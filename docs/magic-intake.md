# `/magic/` — Chromebook intake

Work branch for the new-Chromebook intake flow. This app owns two of the three pieces:

1. **`mode=intake`** — a new handler in `src/functions/`, alongside the existing modes in
   `src/functions/index.ts`.
2. **`/magic/`** — a new route + Svelte page, registered in `src/ui/App.svelte`.

The third piece is a ChromeOS extension living in its own private repo:
**[thinkle-iacs/cb-intake-extension](https://github.com/thinkle-iacs/cb-intake-extension)**.

**The full design lives in that repo at `docs/design.md`** — architecture, security model,
field mapping, conflict rules, and UI requirements. It covers both halves, and the
security model doesn't survive being reasoned about one half at a time. Read it first.

---

## What this branch is for

Target flow: join a Chromebook to the domain → sign in as `cbenroll` → Chrome opens to
`cb.innovationcharter.org/magic/` → type the asset tag → confirm → Airtable `Inventory`
upserted with make/model/MAC/AUE pulled from Admin Directory.

A tech doing this 100 times in a sitting should never touch the mouse after the first
device.

## What it touches here

The extension repo changed the design after this doc was first written: the extension is now
a **content script** that hands `/magic/` the serial and the policy token, and **the page
makes its own same-origin calls**. See that repo's `docs/protocol.md`, which supersedes
design §3–4 and writes down what the trade costs.

- **New:** `src/functions/intake.ts` (handler) and `src/functions/intakeFields.ts` (field
  mapping and conflict rules, pure and unit-tested). `src/functions/index.ts` dispatches
  `mode=intake` **ahead of** the login gate: a `cbenroll` session has no JWT.
- **New:** `src/ui/magic/MagicIntake.svelte`, routed at `/magic/` in `src/ui/App.svelte`
  with no login gate and no app chrome. `src/data/intake.ts` is its API client.
- **Copied, don't edit:** `src/ui/magic/protocol.ts` and `src/ui/magic/cb-intake-page.ts`
  from the extension repo. The header comment records the commit they came from.
- **Modified:** `gas/Code.js` — `mode=setAssetId` patches `annotatedAssetId`. Best-effort;
  its failure never fails an intake.
- **Later:** `public/ext/` to host the extension CRX + `update.xml`.

## Build order

1. ~~`intake.ts` + `Intake Defaults` table~~ — endpoint done and tested; the table still
   needs creating (below).
2. ~~`/magic/` page including the manual-serial fallback~~ — done, driven against the mock.
3. Extension (other repo) — built; prove `chrome.enterprise.deviceAttributes` on a real
   managed device.
4. CRX hosting, Admin console, `cbenroll` account.
5. Field-test one device end to end before widening the OU.

## Setup before this works in production

1. **Netlify env:** `INTAKE_TOKEN` — a long random string. The same value goes into the
   extension's policy JSON in the Admin console. Unset, the token path is simply closed and
   only IT logins work.
2. **Airtable:** a table named `Intake Defaults` in base `appFim2L4assVgjdk` with four
   single-line-text fields: `Purpose`, `Status`, `Location`, `Category`. The endpoint
   creates its one row on the first save. Without the table, intake still works; records
   just get no batch fields, and the page says so.
3. **GAS shim:** push `gas/Code.js` and deploy a new version of the web app, or the Google
   write-back reports failure on every device (the Airtable write still succeeds).

## Endpoint behavior beyond protocol.md

- `lookup` returns `serial` (Google's canonical casing) and `duplicateSerial`.
- `commit` refuses with **422 `not_in_google`** if Admin Directory doesn't know the serial,
  so a typo in manual entry can't become a record.
- `commit` refuses with **409 `tag_in_use`** if the tag is already on a *different* serial.
  No override: fix the other record first.
- A re-intake never applies batch defaults and never overwrites `Year of Purchase` unless
  the tech confirmed one.
- Writes use Airtable `typecast`, so a year lands in a number field and defaults match
  select options.

## Trying it without Airtable

`netlify dev` pulls production env, and local dev treats every request as IT — so it
writes to the real base. To drive the page safely, serve `public/` with
`/.netlify/functions/*` proxied to the extension repo's `dev/mock-endpoint.mjs`.

## Open questions

- `MAC-Wireless` format: written as `AA:BB:CC:DD:EE:FF` (`formatMac`). Confirm against
  existing rows.
- `Make` parsing (`parseMake`): known brands normalised, else first token of the model.
  Confirm against the fleet's distinct models.
- Default `Category` for a new device.

## Don't regress

- `/magic/` is served without a login gate **by design**. Every write needs the intake
  token or an IT login; the page asks for the login itself when there's no token. Do not
  add auth to the page, and do not weaken the endpoint's requirement.
- The intake token opens `mode=intake` and nothing else.
- A serial that already carries a *different* asset tag is refused unless explicitly
  overridden.
- The success panel is a state, not a toast.
