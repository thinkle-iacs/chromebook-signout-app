<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import TicketNotification from "../TicketNotification.svelte";
  import { signoutAsset } from "../../data/signout";
  import { assetStore } from "../../data/inventory";
  import { get } from "svelte/store";

  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;

  let draft: Partial<Ticket> = {};
  function handleChange(updates: Partial<Ticket>) {
    draft = { ...draft, ...updates };
  }

  // Close actions
  let checkInTemp = true;
  let checkOutRepaired = true;
  let processing = false;

  // Derive asset tags for labels
  $: mainTag =
    ticket._linked?.Device?.["Asset Tag"] ||
    (ticket as any)["Asset Tag (from Device)"]?.[0] ||
    "";
  $: tempTag =
    (ticket as any)._linked?.["Temporary Device"]?.["Asset Tag"] ||
    (ticket as any)["Asset Tag (from Temporary Device)"]?.[0] ||
    "";

  async function closeTicket() {
    if (processing) return;
    processing = true;
    try {
      const updates: Partial<Ticket> = { ...draft };
      const historyChanges: Record<string, { from?: unknown; to?: unknown }> =
        {};

      const studentIds = (ticket as any).Student as string[] | undefined;
      const studentId = studentIds && studentIds[0];
      const deviceIds = (ticket as any).Device as string[] | undefined;
      const deviceId = deviceIds && deviceIds[0];
      const tempArr = (ticket as any)["Temporary Device"] as
        | string[]
        | undefined;
      const tempId = tempArr && tempArr[0];

      const store: any = get(assetStore);

      // 1) Check IN temporary device
      if (checkInTemp && tempId && studentId) {
        const tempAsset: any = store[tempId] || {
          _id: tempId,
          "Asset Tag": tempTag,
        };
        const studentObj: any = { _id: studentId };
        await signoutAsset(
          studentObj,
          null as any,
          tempAsset,
          `Temp device returned for Ticket #${ticket.Number}`,
          "Returned",
          false
        );
        (updates as any)["Temp Status"] = "Returned";
        historyChanges["Temp Status"] = {
          from: ticket["Temp Status"],
          to: "Returned",
        };
      }

      // 2) Check OUT repaired main device
      if (checkOutRepaired && deviceId && studentId) {
        const deviceAsset: any = store[deviceId] || {
          _id: deviceId,
          "Asset Tag": mainTag,
        };
        const studentObj: any = { _id: studentId };
        await signoutAsset(
          studentObj,
          null as any,
          deviceAsset,
          `Repaired device returned (Ticket #${ticket.Number})`,
          "Out",
          false
        );
      }

      // 3) Close ticket
      updates["Ticket Status"] = "Closed" as any;
      historyChanges["Ticket Status"] = {
        from: ticket["Ticket Status"],
        to: "Closed",
      };

      await updateTicket(updates, {
        action: "pickup_complete",
        status: "Closed",
        note: `Closed after pickup${checkInTemp && tempId ? "; temp returned" : ""}${checkOutRepaired ? "; device checked out" : ""}`,
        changes: historyChanges,
      } as any);

      draft = {};
    } catch (e) {
      console.error("Failed to close ticket:", e);
      alert("Failed to close ticket.");
    } finally {
      processing = false;
    }
  }
</script>

<div class="w3-panel w3-pale-green w3-border">
  <h4>In Repair → Ready for Pickup</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>

  <TicketInfo {ticket} onChange={handleChange} />
  <TicketDescription {ticket} onChange={handleChange} />

  <TicketNotification {ticket} />

  <div class="w3-section w3-padding w3-border w3-round">
    <h5>Pickup Actions</h5>
    <label class="w3-small" style="display:block;margin-bottom:8px;">
      <input type="checkbox" bind:checked={checkInTemp} disabled={processing} />
      Check in temporary device{tempTag ? ` (${tempTag})` : ""}
    </label>
    <label class="w3-small" style="display:block;margin-bottom:8px;">
      <input
        type="checkbox"
        bind:checked={checkOutRepaired}
        disabled={processing}
      />
      Check out repaired device to student{mainTag ? ` (${mainTag})` : ""}
    </label>
  </div>

  <div class="w3-section">
    <button
      class="w3-button w3-green"
      on:click={closeTicket}
      disabled={processing}
    >
      {processing ? "Processing…" : "Close Ticket"}
    </button>
  </div>
</div>
