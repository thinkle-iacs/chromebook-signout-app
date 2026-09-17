import type { APIGatewayEvent, Context } from "aws-lambda";

/*
 * The handler end to end, with Airtable and the GAS shim replaced by in-memory fakes.
 * Env is set before the modules load, since auth.ts reads CONTEXT at import time.
 */

process.env.CONTEXT = "production"; // enforce auth as deployed, not the local-dev bypass
process.env.INTAKE_TOKEN = "the-token";
process.env.SHIM_SECRET = "shim-secret";
process.env.SHIM_URL = "https://shim.example";

type Row = { id: string; fields: Record<string, any> };
const inventory: Row[] = [];
const defaultsRows: Row[] = [];
let nextId = 1;

/** Just enough of Airtable's formula language for the filters intake.ts writes. */
function matches(formula: string, row: Row) {
  const m = formula.match(/^LOWER\((?:TRIM\()?\{(.+?)\}\)?\) = "(.*)"$/);
  if (!m) throw new Error(`fake Airtable can't parse ${formula}`);
  const [, field, value] = m;
  return String(row.fields[field] ?? "").trim().toLowerCase() === value.replace(/\\"/g, '"');
}

function fakeTable(rows: Row[]) {
  return {
    select: ({ filterByFormula, maxRecords }: any = {}) => ({
      firstPage: async () =>
        rows.filter((r) => !filterByFormula || matches(filterByFormula, r)).slice(0, maxRecords ?? 100),
    }),
    create: jest.fn(async (fields: any) => {
      const row = { id: `rec${nextId++}`, fields: { ...fields } };
      rows.push(row);
      return row;
    }),
    update: jest.fn(async (id: string, fields: any) => {
      const row = rows.find((r) => r.id === id)!;
      Object.assign(row.fields, fields);
      return row;
    }),
  };
}

const inventoryTable = fakeTable(inventory);
const defaultsTable = fakeTable(defaultsRows);
jest.mock("./Airtable", () => ({
  get inventoryBase() {
    return inventoryTable;
  },
  get intakeDefaultsBase() {
    return defaultsTable;
  },
}));

const googleDevices: Record<string, any> = {};
let writeBackFails = false;
const shimCalls: Record<string, string>[] = [];
jest.mock("./googleAdmin", () => ({
  callShim: async (params: Record<string, string>) => {
    shimCalls.push(params);
    if (params.mode === "serial") {
      return { status: "success", result: googleDevices[params.id.toLowerCase()] };
    }
    if (params.mode === "setAssetId") {
      return writeBackFails
        ? { status: "Error", detail: "Error setting annotatedAssetId", errorMessage: "Not Authorized" }
        : { status: "success", result: { annotatedAssetId: params.assetId } };
    }
    throw new Error(`unexpected shim mode ${params.mode}`);
  },
}));

import { handler } from "./index";

const itContext = { clientContext: { user: { email: "thinkle@innovationcharter.org" } } } as any as Context;
const teacherContext = { clientContext: { user: { email: "someteacher@innovationcharter.org" } } } as any as Context;
const noLogin = {} as Context;

function call(
  action: string,
  opts: { method?: string; params?: Record<string, string>; body?: any; token?: string; context?: Context } = {},
) {
  const event = {
    httpMethod: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.token ? { "x-intake-token": opts.token } : {},
    queryStringParameters: { mode: "intake", action, ...opts.params },
    body: opts.body ? JSON.stringify(opts.body) : null,
    isBase64Encoded: false,
  } as any as APIGatewayEvent;
  return handler(event, opts.context ?? noLogin).then((r) => ({ status: r.statusCode, body: JSON.parse(r.body) }));
}

beforeEach(() => {
  inventory.length = 0;
  defaultsRows.length = 0;
  shimCalls.length = 0;
  writeBackFails = false;
  for (const key of Object.keys(googleDevices)) delete googleDevices[key];
  googleDevices["5cd1234abc"] = {
    serialNumber: "5CD1234ABC",
    model: "Lenovo 100e Chromebook Gen 3",
    macAddress: "a0b1c2d3e4f5",
    firstEnrollmentTime: "2026-08-14T12:00:00.000Z",
    autoUpdateExpiration: "1780000000000",
  };
  defaultsRows.push({ id: "recDefaults", fields: { Purpose: "Student Loan", Status: "Active" } });
});

describe("auth", () => {
  test("the token gets in with no login, ahead of the router's gate", async () => {
    const r = await call("lookup", { params: { serial: "5CD1234ABC" }, token: "the-token" });
    expect(r.status).toBe(200);
  });

  test("an it-level login gets in with no token", async () => {
    const r = await call("lookup", { params: { serial: "5CD1234ABC" }, context: itContext });
    expect(r.status).toBe(200);
  });

  test("a bad token is a 401 that offers login", async () => {
    const r = await call("lookup", { params: { serial: "5CD1234ABC" }, token: "wrong" });
    expect(r).toEqual({ status: 401, body: expect.objectContaining({ error: "bad_token", canFallBackToLogin: true }) });
  });

  test("a bad token still gets in alongside an it login", async () => {
    const r = await call("lookup", { params: { serial: "5CD1234ABC" }, token: "wrong", context: itContext });
    expect(r.status).toBe(200);
  });

  test("teachers and anonymous callers are refused", async () => {
    expect((await call("lookup", { params: { serial: "5CD1234ABC" }, context: teacherContext })).status).toBe(401);
    expect((await call("lookup", { params: { serial: "5CD1234ABC" } })).status).toBe(401);
  });

  test("the intake token opens nothing but intake", async () => {
    const event = {
      httpMethod: "GET",
      headers: { "x-intake-token": "the-token" },
      queryStringParameters: { mode: "student" },
    } as any as APIGatewayEvent;
    expect((await handler(event, noLogin)).statusCode).toBe(403);
  });
});

describe("lookup", () => {
  test("returns Google data, suggested fields, and batch defaults", async () => {
    const r = await call("lookup", { params: { serial: "5cd1234abc" }, token: "the-token" });
    expect(r.body).toMatchObject({
      serial: "5CD1234ABC",
      suggested: { Make: "Lenovo", "MAC-Wireless": "A0B1C2D3E4F5", DOP: "2026-08-14" },
      existingRecord: null,
      defaults: { Purpose: "Student Loan", Status: "Active" },
    });
  });

  test("prefills a known device's recorded DOP rather than its enrollment date", async () => {
    inventory.push({ id: "recOld", fields: { Serial: "5CD1234ABC", "Asset Tag": "IACS-9", DOP: "2019-06-01" } });
    const r = await call("lookup", { params: { serial: "5CD1234ABC" }, token: "the-token" });
    expect(r.body.existingRecord).toMatchObject({ _id: "recOld", "Asset Tag": "IACS-9" });
    expect(r.body.suggested.DOP).toBe("2019-06-01");
  });

  test("refuses a serial that could break out of the formula", async () => {
    const r = await call("lookup", { params: { serial: '") OR TRUE() OR ("' }, token: "the-token" });
    expect(r.status).toBe(400);
  });
});

describe("commit", () => {
  const commit = (body: any) => call("commit", { body, token: "the-token" });

  test("creates a record and writes the tag back to Google", async () => {
    const r = await commit({ serial: "5CD1234ABC", assetTag: "IACS-1234", fields: { DOP: "2025-09-01" } });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      created: true,
      updated: false,
      fieldsWritten: {
        "Asset Tag": "IACS-1234",
        Serial: "5CD1234ABC",
        Make: "Lenovo",
        DOP: "2025-09-01",
        Purpose: "Student Loan",
      },
      googleAssetIdWriteBack: { ok: true },
      recordUrl: "/asset/IACS-1234",
    });
    expect(inventory).toHaveLength(1);
    expect(shimCalls).toContainEqual(expect.objectContaining({ mode: "setAssetId", serial: "5CD1234ABC", assetId: "IACS-1234" }));
  });

  test("a failed Google write-back is reported, not fatal", async () => {
    writeBackFails = true;
    const r = await commit({ serial: "5CD1234ABC", assetTag: "IACS-1234" });
    expect(r.status).toBe(200);
    expect(r.body.googleAssetIdWriteBack).toEqual({ ok: false, error: "Not Authorized" });
    expect(inventory).toHaveLength(1);
  });

  test("a re-intake that doesn't send a DOP leaves the recorded one alone", async () => {
    inventory.push({ id: "recOld", fields: { Serial: "5CD1234ABC", "Asset Tag": "IACS-9", DOP: "2019-06-01" } });
    const r = await commit({ serial: "5CD1234ABC", assetTag: "IACS-9" });
    expect(r.body.fieldsWritten).not.toHaveProperty("DOP");
    expect(inventory[0].fields.DOP).toBe("2019-06-01");
  });

  test("re-intaking the same device with the same tag refreshes it", async () => {
    await commit({ serial: "5CD1234ABC", assetTag: "IACS-1234" });
    const r = await commit({ serial: "5CD1234ABC", assetTag: "iacs-1234" });
    expect(r.body).toMatchObject({ created: false, updated: true, idempotent: true });
    expect(inventory).toHaveLength(1);
  });

  test("a different tag is a 409 naming both, until allowRetag", async () => {
    await commit({ serial: "5CD1234ABC", assetTag: "IACS-1" });
    const refused = await commit({ serial: "5CD1234ABC", assetTag: "IACS-2" });
    expect(refused).toEqual({
      status: 409,
      body: expect.objectContaining({ error: "retag_conflict", existingTag: "IACS-1", incomingTag: "IACS-2" }),
    });
    expect(inventory[0].fields["Asset Tag"]).toBe("IACS-1");

    const forced = await commit({ serial: "5CD1234ABC", assetTag: "IACS-2", allowRetag: true });
    expect(forced.body).toMatchObject({ updated: true, retagged: true });
    expect(inventory[0].fields["Asset Tag"]).toBe("IACS-2");
  });

  test("a tag that's already on another device is refused", async () => {
    inventory.push({ id: "recOther", fields: { Serial: "OTHER999", "Asset Tag": "IACS-1234" } });
    const r = await commit({ serial: "5CD1234ABC", assetTag: "IACS-1234", allowRetag: true });
    expect(r).toEqual({ status: 409, body: expect.objectContaining({ error: "tag_in_use", otherSerial: "OTHER999" }) });
    expect(inventory).toHaveLength(1);
  });

  test("a serial Google doesn't know is refused, so typos don't become records", async () => {
    const r = await commit({ serial: "TYPO12345", assetTag: "IACS-1234" });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe("not_in_google");
    expect(inventory).toHaveLength(0);
  });

  test("intake still works without an Intake Defaults row", async () => {
    defaultsRows.length = 0;
    const r = await commit({ serial: "5CD1234ABC", assetTag: "IACS-1234" });
    expect(r.status).toBe(200);
    expect(r.body.fieldsWritten).not.toHaveProperty("Purpose");
  });
});

test("a missing Intake Defaults table is explained, not reported as a permissions problem", async () => {
  const select = defaultsTable.select;
  defaultsTable.select = () => ({
    firstPage: async () => {
      throw Object.assign(new Error("You are not authorized to perform this operation"), { error: "NOT_AUTHORIZED", statusCode: 403 });
    },
  });
  try {
    const r = await call("lookup", { params: { serial: "5CD1234ABC" }, token: "the-token" });
    expect(r.status).toBe(200);
    expect(r.body.defaults).toBeNull();
    expect(r.body.defaultsError).toMatch(/no "Intake Defaults" table/);
  } finally {
    defaultsTable.select = select;
  }
});

describe("setDefaults", () => {
  test("updates the one row, keeping only the known fields", async () => {
    const r = await call("setDefaults", {
      body: { defaults: { Purpose: "Tech", Location: "Room 101", Serial: "nope" } },
      token: "the-token",
    });
    expect(r.body).toEqual({ ok: true, defaults: { Purpose: "Tech", Status: "Active", Location: "Room 101" } });
    expect(defaultsRows).toHaveLength(1);
  });

  test("creates the row if the table is empty", async () => {
    defaultsRows.length = 0;
    await call("setDefaults", { body: { defaults: { Purpose: "Tech" } }, token: "the-token" });
    expect(defaultsRows).toHaveLength(1);
  });
});
