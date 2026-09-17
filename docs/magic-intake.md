# `/magic/` — Chromebook intake

**Live in production, verified end to end on a managed Chromebook (September 2026).**

Join a Chromebook to the domain → sign in as `cbenroll` → Chrome opens to
`cb.innovationcharter.org/magic/` → type the asset tag → Enter → the Airtable `Inventory`
record is created or refreshed from Admin Directory, and the tag is written back to Google.
A tech doing this 100 times in a sitting never touches the mouse after the first device.

This app owns two of the three pieces:

1. **`mode=intake`** — the endpoint, in `src/functions/`.
2. **`/magic/`** — the page, in `src/ui/magic/`.

The third is a ChromeOS extension in its own private repo:
**[thinkle-iacs/cb-intake-extension](https://github.com/thinkle-iacs/cb-intake-extension)**.
Its `docs/design.md` and `docs/protocol.md` are the full design and the security model,
covering both halves. The extension is a **content script** that hands `/magic/` the serial
and the policy token; **the page makes its own same-origin calls**.

---

## Where things are

- `src/functions/intake.ts` — handler (`lookup`, `commit`, `setDefaults`).
  `src/functions/intakeFields.ts` — field mapping and conflict rules, pure and unit-tested.
  `src/functions/index.ts` dispatches `mode=intake` **ahead of** the login gate: a
  `cbenroll` session has no JWT.
- `src/ui/magic/MagicIntake.svelte` — the page, routed at `/magic/` in `src/ui/App.svelte`
  with no login gate and no app chrome. `src/data/intake.ts` is its API client.
- `src/ui/magic/protocol.ts`, `src/ui/magic/cb-intake-page.ts` — **copied from the extension
  repo; don't edit here.** The header comment records the commit they came from.
- `gas/Code.js` — `mode=setAssetId` patches `annotatedAssetId`. Best-effort; its failure
  never fails an intake.
- `public/ext/` — the signed extension CRX and `update.xml`, served at
  `https://cb.innovationcharter.org/ext/update.xml` with content-type headers from
  `netlify.toml`.

## Production setup (all done)

- **Netlify env:** `INTAKE_TOKEN`. The same value is in the extension's **Policy for
  extensions** JSON in the Admin console: `{"intakeToken": {"Value": "…"}}`. Change one,
  change both, and redeploy — functions only see an env change after a new deploy.
- **Airtable:** table `Intake Defaults` (`Purpose`, `Status`, `Location`) in base
  `appFim2L4assVgjdk`. One row, created on the first "Save for this batch".
- **Apps Script:** deployed with `mode=setAssetId` (deployment version 8).
- **Admin console:** `cbenroll` in its own OU; extension `nmeplbocjanmcndfkmnhjbdhnjjlfkdd`
  force-installed there from the update URL above; startup URL `/magic/`.

## Releasing a new extension version

In the extension repo: `npm version patch && npm run check && npm run pack`, which needs
`keys/cb-intake.pem` (not in git — it's in the IT password manager). Copy
`release/cb-intake-<version>.crx` and `release/update.xml` into `public/ext/` here, deploy,
and confirm with `curl` that both are served before anything else. Leave old CRX files in
place for rollback. Full steps: that repo's `docs/release.md`.

## Troubleshooting

- **"This device's intake token was refused."** First check DevTools → Network on the
  `mode=intake&action=lookup` request: is there an `x-intake-token` request header at all?
  (The first real device found a bug where the page sent none — fixed in #35.) Then
  `chrome://policy` shows what the Admin console actually delivered.
- **Test a token against production without revealing it**, from a terminal:
  `read -rs "T?Paste token: " && curl -s -o /dev/null -w "%{http_code}\n" -H "X-Intake-Token: $T" "https://cb.innovationcharter.org/.netlify/functions/index?mode=intake&action=lookup&serial=ZZZZ0000TEST"; unset T`
  — `200` accepted, `401` rejected.
- **"Can't read this device"** on anything but a managed Chromebook is expected: desktop
  Chrome has no `chrome.enterprise` API.
- **Google write-back failed** but the record saved: the Apps Script deployment is stale or
  needs re-authorizing.

## Endpoint behavior beyond protocol.md

- `lookup` returns `serial` (Google's canonical casing) and `duplicateSerial`.
- `commit` refuses with **422 `not_in_google`** if Admin Directory doesn't know the serial,
  so a typo in manual entry can't become a record.
- `commit` refuses with **409 `tag_in_use`** if the tag is already on a *different* serial.
  No override: fix the other record first.
- A re-intake never applies batch defaults, and keeps a recorded `DOP` unless the tech
  changes it.
- Writes use Airtable `typecast`, so defaults match select options.

## Field conventions (checked against Inventory, Sept 2026)

- `Make`: brand only — HP, Lenovo, Acer, Samsung, Asus.
- `Model`: without the brand or "Chromebook" — `11A G8 EE`, `100e`, `C723-K22H`. Google's
  full name is parsed (`parseModel`); the page shows Make and Model as editable because
  unseen models may parse imperfectly.
- `MAC-Wireless`: upper-case hex, no separators — `D039576D475B`.
- `DOP`: "in service since" — the first enrollment date (Google keeps it across wipes).
  Filled on new records and on existing records with a blank DOP. `nYOP` derives the year
  from it, so `Year of Purchase` (the old guess field) isn't written.
- `Manufacture Date` (date field): from Admin Directory's `manufactureDate`, which is usually
  year-month, so it's written as the first of the month (`2020-11-01`). Refreshed on every
  re-scan, so re-scanning an older device fills it in.
- `Category`: always `Chromebook`.

## Trying it locally

`netlify dev` pulls production env and skips auth (it sets `NETLIFY_DEV=true`), so it
**writes to the real base** — lookups are safe, commits are real. To drive the page without
touching Airtable, serve `public/` with `/.netlify/functions/*` proxied to the extension
repo's `dev/mock-endpoint.mjs`, and make sure that setup does *not* treat every request as
logged in, or a missing token goes unnoticed.

## Don't regress

- `/magic/` is served without a login gate **by design**. Every write needs the intake
  token or an IT login; the page asks for the login itself when there's no token. Do not
  add auth to the page, and do not weaken the endpoint's requirement.
- The intake token opens `mode=intake` and nothing else.
- A serial that already carries a *different* asset tag is refused unless explicitly
  overridden.
- The success panel is a state, not a toast.
- Local-dev auth skipping keys off `NETLIFY_DEV`, never `CONTEXT` — Netlify doesn't give
  deployed functions `CONTEXT`, and checking it once left production with no auth (#32).
