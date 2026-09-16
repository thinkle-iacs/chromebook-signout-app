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

- **New:** `src/functions/intake.ts`, registered in the `modes` map in
  `src/functions/index.ts`.
- **New:** an intake page under `src/ui/`, plus a `router("/magic/")` entry in
  `src/ui/App.svelte`.
- **Modified:** `src/functions/auth.ts` — the intake endpoint accepts *either* an
  `X-Intake-Token` header *or* an `it`-level JWT. The second path is what makes this
  testable from a laptop with no managed device.
- **Modified:** `gas/Code.js` — a `mode=setAssetId` to write `annotatedAssetId` back to
  Google. Best-effort; its failure must not fail the intake.
- **New Airtable table:** `Intake Defaults`, one row, three fields, in base
  `appFim2L4assVgjdk`. Backs the batch-defaults strip (see design doc §7 for why the
  obvious client-side alternatives don't work).
- **Later:** `public/ext/` to host the extension CRX + `update.xml`.

Existing Airtable reads/writes go through `src/functions/Airtable.ts`; note that
`inventoryBase` currently has **no create path** — `src/functions/inventory.ts` only
selects and updates. Creating one is the core backend work.

## Build order

1. `intake.ts` + `Intake Defaults` table — testable immediately with an `it` JWT.
2. `/magic/` page including the manual-serial fallback — still no extension required.
3. Extension (other repo). Prove the `externally_connectable` assumption on a real device
   before building on it.
4. CRX hosting, Admin console, `cbenroll` account.
5. Field-test one device end to end before widening the OU.

Steps 1 and 2 are the whole of this branch's initial scope and need no ChromeOS hardware.

## Don't regress

- `/magic/` is served without a login gate **by design** — the page is inert, and every
  write goes through the extension, which holds the token. Do not "fix" this by adding
  auth to the page; do not weaken the endpoint's token requirement.
- The extension must ignore any serial the page sends and use its own
  `getDeviceSerialNumber()`. That invariant is what bounds the damage a compromised page
  could do to the single device it's running on.
- A serial that already carries a *different* asset tag is refused unless explicitly
  overridden.
