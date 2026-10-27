import fs from "fs";
import path from "path";

test("renders every machine in a checkout even when Airtable returns a null staff email", async () => {
  const { preprocess, compile } = require("svelte/compiler");
  const { create_ssr_component, escape } = require("svelte/internal");
  const { writable } = require("svelte/store");
  const filename = path.join(__dirname, "SignoutHistoryTable.svelte");
  const source = await preprocess(
    fs.readFileSync(filename, "utf8"),
    require("svelte-preprocess")(),
    { filename }
  );
  const compiled = compile(source.code, { filename, generate: "ssr", format: "cjs" });
  const output = { exports: {} as any };
  // Keep this a template regression test: asset details and logging aren't under test.
  const componentRequire = (name: string) => {
    if (name === "@assets/AssetDisplay.svelte") return {
      default: create_ssr_component(($$result, { asset }) => `<span>${escape(asset["Asset Tag"])}</span>`),
    };
    if (name === "@data/inventory") return { assetStore: writable({}) };
    if (name === "@utils/log") return { logger: { logVerbose: () => {} } };
    if (name === "@utils/util") return {};
    return require(name);
  };
  new Function("require", "module", "exports", compiled.js.code)(componentRequire, output, output.exports);
  const rendered = output.exports.default.render({ signoutHistoryItems: [{
    "Asset Tag (from Asset)": ["A1222", "A1223", "A1224", "A1225"],
    "Email (from Staff)": [null],
    Time: "2026-08-25T15:27:59.000Z",
    Status: "Out",
  }] });
  for (const tag of ["A1222", "A1223", "A1224", "A1225"]) {
    expect(rendered.html).toContain(tag);
  }
  expect(rendered.html).not.toContain("mailto:null");
});
