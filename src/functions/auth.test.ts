import type { Context } from "aws-lambda";

/** auth.ts reads CONTEXT at import, so each case loads a fresh copy. */
function levelWith(contextEnv: string | undefined, ctx: Context = {} as Context) {
  const saved = process.env.CONTEXT;
  if (contextEnv === undefined) delete process.env.CONTEXT;
  else process.env.CONTEXT = contextEnv;
  let level: string;
  jest.isolateModules(() => {
    level = require("./auth").getAuthLevel(ctx);
  });
  if (saved === undefined) delete process.env.CONTEXT;
  else process.env.CONTEXT = saved;
  return level!;
}

test("local dev skips auth, whether netlify-cli leaves CONTEXT unset or sets it to dev", () => {
  expect(levelWith(undefined)).toBe("it");
  expect(levelWith("dev")).toBe("it");
});

test("hosted contexts enforce auth", () => {
  for (const hosted of ["production", "deploy-preview", "branch-deploy"]) {
    expect(levelWith(hosted)).toBe("none");
  }
  const it = { clientContext: { user: { email: "thinkle@innovationcharter.org" } } } as any as Context;
  expect(levelWith("production", it)).toBe("it");
});
