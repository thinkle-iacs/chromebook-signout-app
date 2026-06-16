<script lang="ts">
  import type { MachinePurpose } from "@data/inventory";
  export let purpose: MachinePurpose | string | null | undefined = null;
  // compact: abbreviate text for tight spaces (AssetDisplay inline badge)
  export let compact = false;
  // showFallback: render plain text for purposes that have no styled badge
  export let showFallback = false;

  const LABELS: Partial<Record<string, string>> = {
    "Daily Loaner": "DL",
    "Staff Spare": "Spare",
  };

  const STYLED = new Set(["MCAS", "Daily Loaner", "Staff Spare", "Temp", "Disposed", "Retired"]);

  $: label = compact
    ? (LABELS[purpose ?? ""] ?? purpose ?? "")
    : (purpose ?? "");
  $: hasStyledBadge = STYLED.has(purpose ?? "");
</script>

{#if purpose === "MCAS"}
  <span class="purpose-badge purpose-mcas">{label}</span>
{:else if purpose === "Daily Loaner"}
  <span class="purpose-badge purpose-daily">{label}</span>
{:else if purpose === "Staff Spare"}
  <span class="purpose-badge purpose-spare">{label}</span>
{:else if purpose === "Temp"}
  <span class="purpose-badge purpose-temp">{label}</span>
{:else if purpose === "Disposed" || purpose === "Retired"}
  <span class="purpose-badge purpose-retired">{label}</span>
{:else if showFallback && purpose}
  {purpose}
{/if}

<style>
  .purpose-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: bold;
    padding: 1px 4px;
    border-radius: 3px;
    vertical-align: middle;
    margin-left: 4px;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
  .purpose-mcas {
    background: #111;
    color: #ff4444;
    border: 1px solid #ff4444;
  }
  .purpose-daily {
    background: #e3f2fd;
    color: #0d47a1;
    border: 1px solid #90caf9;
  }
  .purpose-spare {
    background: #fff3e0;
    color: #bf360c;
    border: 1px solid #ffcc80;
  }
  .purpose-temp {
    background: #f5f5f5;
    color: #616161;
    border: 1px solid #bdbdbd;
  }
  .purpose-retired {
    background: #eeeeee;
    color: #9e9e9e;
    border: 1px solid #bdbdbd;
    text-decoration: line-through;
  }
</style>
