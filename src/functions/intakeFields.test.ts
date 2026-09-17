import {
  formatMac,
  formulaString,
  isValidAssetTag,
  isValidSerial,
  parseMake,
  parseModel,
  planCommit,
  suggestedFields,
  tokenMatches,
  dateFromEnrollment,
  formatManufactureDate,
  type CommitInput,
} from "./intakeFields";

const google = {
  serialNumber: "5CD1234ABC",
  manufactureDate: "2025-11",
  model: "HP Chromebook 11 G8 EE",
  macAddress: "a0b1c2d3e4f5",
  firstEnrollmentTime: "2026-08-14T12:00:00.000Z",
};

describe("field mapping", () => {
  test("parseMake normalises known brands and falls back to the first token", () => {
    expect(parseMake("HP Chromebook 11 G8 EE")).toBe("HP");
    expect(parseMake("Lenovo 100e Chromebook Gen 3")).toBe("Lenovo");
    expect(parseMake("asus Chromebook C204")).toBe("Asus");
    expect(parseMake("Hewlett-Packard Chromebook 14")).toBe("HP");
    expect(parseMake("Zork Chromebook")).toBe("Zork");
    expect(parseMake("")).toBeUndefined();
    expect(parseMake(undefined)).toBeUndefined();
  });

  test("parseModel drops the brand and the word Chromebook, the way Inventory stores it", () => {
    expect(parseModel("HP Chromebook 11A G8 EE")).toBe("11A G8 EE");
    expect(parseModel("Lenovo 100e Chromebook Gen 4")).toBe("100e Gen 4");
    expect(parseModel("Acer Chromebook C871")).toBe("C871");
    expect(parseModel("Samsung Chromebook")).toBe("Samsung Chromebook");
    expect(parseModel("Zork Chromebook 9000")).toBe("Zork Chromebook 9000");
    expect(parseModel(undefined)).toBeUndefined();
  });

  test("formatMac writes bare upper-case hex, and leaves odd input alone", () => {
    expect(formatMac("a0b1c2d3e4f5")).toBe("A0B1C2D3E4F5");
    expect(formatMac("A0-B1-C2-D3-E4-F5")).toBe("A0B1C2D3E4F5");
    expect(formatMac("abc")).toBe("abc");
    expect(formatMac(undefined)).toBeUndefined();
  });

  test("formatManufactureDate fills in the day Google usually leaves off", () => {
    expect(formatManufactureDate("2020-11")).toBe("2020-11-01");
    expect(formatManufactureDate("2020-11-15")).toBe("2020-11-15");
    expect(formatManufactureDate("")).toBeUndefined();
    expect(formatManufactureDate("unknown")).toBeUndefined();
    expect(formatManufactureDate(undefined)).toBeUndefined();
  });

  test("dateFromEnrollment", () => {
    expect(dateFromEnrollment("2026-08-14T12:00:00.000Z")).toBe("2026-08-14");
    expect(dateFromEnrollment("garbage")).toBeUndefined();
    expect(dateFromEnrollment(undefined)).toBeUndefined();
  });

  test("suggestedFields drops what Google didn't report", () => {
    expect(suggestedFields(google)).toEqual({
      Serial: "5CD1234ABC",
      "Device Type": "Chromebook",
      Category: "Chromebook",
      Model: "11 G8 EE",
      Make: "HP",
      "MAC-Wireless": "A0B1C2D3E4F5",
      DOP: "2026-08-14",
      "Manufacture Date": "2025-11-01",
    });
    expect(suggestedFields({ serialNumber: "X1234" })).toEqual({
      Serial: "X1234",
      "Device Type": "Chromebook",
      Category: "Chromebook",
    });
  });
});

describe("input validation", () => {
  test("serials are alphanumeric, which keeps them out of formula trouble", () => {
    expect(isValidSerial("5CD1234ABC")).toBe(true);
    expect(isValidSerial('5CD" OR 1=1')).toBe(false);
    expect(isValidSerial("")).toBe(false);
    expect(isValidSerial(42)).toBe(false);
  });

  test("asset tags refuse quotes and blanks", () => {
    expect(isValidAssetTag("IACS-1234")).toBe(true);
    expect(isValidAssetTag("  ")).toBe(false);
    expect(isValidAssetTag('12"34')).toBe(false);
  });

  test("formulaString escapes quotes and backslashes", () => {
    expect(formulaString('a"b\\c')).toBe('"a\\"b\\\\c"');
  });

  test("tokenMatches", () => {
    expect(tokenMatches("secret", "secret")).toBe(true);
    expect(tokenMatches("secreT", "secret")).toBe(false);
    expect(tokenMatches("short", "secret")).toBe(false);
    expect(tokenMatches(undefined, "secret")).toBe(false);
    // An unset INTAKE_TOKEN must never match an empty or missing header.
    expect(tokenMatches("", undefined)).toBe(false);
    expect(tokenMatches(undefined, undefined)).toBe(false);
  });
});

describe("planCommit (design §6)", () => {
  const base: CommitInput = {
    google,
    assetTag: "IACS-1234",
    existing: null,
    tagHolder: null,
    defaults: { Purpose: "Student Loan", Status: "", Location: "Tech Room" },
    overrides: {},
    allowRetag: false,
  };

  test("a new device gets Google fields, batch defaults, and the tag", () => {
    const plan = planCommit(base);
    expect(plan).toEqual({
      kind: "write",
      recordId: null,
      idempotent: false,
      retagged: false,
      fields: {
        Serial: "5CD1234ABC",
        "Device Type": "Chromebook",
        Category: "Chromebook",
        Model: "11 G8 EE",
        Make: "HP",
        "MAC-Wireless": "A0B1C2D3E4F5",
        DOP: "2026-08-14",
        "Manufacture Date": "2025-11-01",
        Purpose: "Student Loan",
        Location: "Tech Room",
        "Asset Tag": "IACS-1234",
      },
    });
  });

  test("per-device overrides win, and unknown fields are ignored", () => {
    const plan = planCommit({
      ...base,
      overrides: { DOP: "2025-01-02", Purpose: "Tech", "Student (Current)": "rec123" },
    });
    expect(plan.kind).toBe("write");
    if (plan.kind !== "write") return;
    expect(plan.fields.DOP).toBe("2025-01-02");
    expect(plan.fields.Purpose).toBe("Tech");
    expect(plan.fields).not.toHaveProperty("Student (Current)");
  });

  test("a DOP override that isn't a date is ignored", () => {
    const plan = planCommit({ ...base, overrides: { DOP: "last spring" } });
    if (plan.kind !== "write") throw new Error("expected a write");
    expect(plan.fields.DOP).toBe("2026-08-14");
  });

  test("an existing record with no DOP gets one", () => {
    const plan = planCommit({ ...base, existing: { id: "recA", fields: { "Asset Tag": "IACS-1234" } } });
    if (plan.kind !== "write") throw new Error("expected a write");
    expect(plan.fields.DOP).toBe("2026-08-14");
  });

  test("same tag on the same serial is an idempotent refresh that keeps DOP and defaults", () => {
    const plan = planCommit({
      ...base,
      assetTag: "iacs-1234 ",
      existing: {
        id: "recA",
        fields: { "Asset Tag": "IACS-1234", DOP: "2019-06-01", Purpose: "Staff Spare" },
      },
      tagHolder: { id: "recA", fields: { Serial: "5CD1234ABC" } },
    });
    expect(plan.kind).toBe("write");
    if (plan.kind !== "write") return;
    expect(plan.recordId).toBe("recA");
    expect(plan.idempotent).toBe(true);
    expect(plan.fields["Asset Tag"]).toBe("IACS-1234");
    expect(plan.fields).not.toHaveProperty("DOP");
    // Google-derived, so a re-scan fills it in on records that predate the field.
    expect(plan.fields["Manufacture Date"]).toBe("2025-11-01");
    expect(plan.fields).not.toHaveProperty("Purpose");
    expect(plan.fields["MAC-Wireless"]).toBe("A0B1C2D3E4F5");
  });

  test("a different tag on the same serial is refused without allowRetag", () => {
    const existing = { id: "recA", fields: { "Asset Tag": "IACS-1" } };
    expect(planCommit({ ...base, existing })).toEqual({ kind: "retag_conflict", existingTag: "IACS-1" });

    const plan = planCommit({ ...base, existing, allowRetag: true });
    expect(plan).toMatchObject({ kind: "write", recordId: "recA", retagged: true });
  });

  test("an existing record with no tag yet is simply tagged", () => {
    const plan = planCommit({ ...base, existing: { id: "recA", fields: { Serial: "5CD1234ABC" } } });
    expect(plan).toMatchObject({ kind: "write", recordId: "recA", retagged: false, idempotent: false });
  });

  test("a tag already on another serial is refused, even with allowRetag", () => {
    const plan = planCommit({
      ...base,
      allowRetag: true,
      tagHolder: { id: "recB", fields: { Serial: "OTHER999", "Asset Tag": "IACS-1234" } },
    });
    expect(plan).toEqual({ kind: "tag_in_use", otherSerial: "OTHER999", otherRecordId: "recB" });
  });
});
