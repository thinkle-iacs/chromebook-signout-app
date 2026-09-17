import type { Context } from "aws-lambda";

/** auth.ts reads the environment at import, so each case loads a fresh copy. */
function levelWith(env: Record<string, string | undefined>, ctx: Context = {} as Context) {
  const saved = { NETLIFY_DEV: process.env.NETLIFY_DEV, CONTEXT: process.env.CONTEXT };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  let level: string;
  try {
    jest.isolateModules(() => {
      level = require("./auth").getAuthLevel(ctx);
    });
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
  return level!;
}

const it = { clientContext: { user: { email: "thinkle@innovationcharter.org" } } } as any as Context;
const teacher = { clientContext: { user: { email: "someteacher@innovationcharter.org" } } } as any as Context;
const student = { clientContext: { user: { email: "jane.doe@innovationcharter.org" } } } as any as Context;

test("netlify dev skips auth", () => {
  expect(levelWith({ NETLIFY_DEV: "true", CONTEXT: "dev" })).toBe("it");
});

test("a deployed function enforces auth even though CONTEXT is undefined at runtime", () => {
  expect(levelWith({ NETLIFY_DEV: undefined, CONTEXT: undefined })).toBe("none");
  expect(levelWith({ NETLIFY_DEV: undefined, CONTEXT: undefined }, it)).toBe("it");
  expect(levelWith({ NETLIFY_DEV: undefined, CONTEXT: undefined }, teacher)).toBe("teacher");
  expect(levelWith({ NETLIFY_DEV: undefined, CONTEXT: undefined }, student)).toBe("none");
});

test("CONTEXT alone never skips auth", () => {
  for (const context of ["dev", "production", "deploy-preview", "branch-deploy"]) {
    expect(levelWith({ NETLIFY_DEV: undefined, CONTEXT: context })).toBe("none");
  }
});
