<script lang="ts">
  import { logger } from "@utils/log";
  import type { Ticket } from "@data/tickets";
  import { createInvoices } from "@data/invoices";
  import Toast from "@components/Toast.svelte";
  import TicketInvoicesSummary from "./components/TicketInvoicesSummary.svelte";

  export let ticket: Ticket;

  // Check if there are existing invoices
  $: hasExistingInvoices = ((ticket as any)?.Invoices || []).length > 0;

  let showSendInterface = false;
  let sendingInvoice = false;
  let toast: { kind: "success" | "error" | "info"; message: string } | null =
    null;
  let confirmOpen = false;

  function showToast(kind: "success" | "error" | "info", message: string) {
    toast = { kind, message };
    setTimeout(() => (toast = null), 3500);
  }

  function openConfirm() {
    confirmOpen = true;
  }

  function closeConfirm() {
    confirmOpen = false;
  }

  async function sendInvoice() {
    if (sendingInvoice) return;
    sendingInvoice = true;
    try {
      const studentIds = (ticket as any).Student as string[] | undefined;
      const ticketId = (ticket as any)._id as string;
      if (!studentIds?.length || !ticketId) {
        showToast("error", "Missing Student or Ticket link");
        return;
      }
      await createInvoices([
        { Student: [studentIds[0]], Ticket: [ticketId], "Send Email": true },
      ] as any);
      showToast("success", "Invoice queued to send.");
      closeConfirm();
      showSendInterface = false;
    } catch (e) {
      logger.logError("Failed to send invoice:", e);
      showToast("error", "Failed to send invoice");
    } finally {
      sendingInvoice = false;
    }
  }

  // Helper data for display
  $: studentEmailText = ticket?._linked?.Student?.Email || "-";
  $: assetTagText = ticket?._linked?.Device?.["Asset Tag"] || "-";
  $: repairCost = ticket["Repair Cost"] || 0;
</script>

<div class="w3-panel w3-border">
  <h5>Send Invoice</h5>

  {#if hasExistingInvoices}
    <!-- Show summary first, with option to send another -->
    <TicketInvoicesSummary {ticket} />

    {#if !showSendInterface}
      <div class="w3-section">
        <button
          class="w3-button w3-amber w3-small"
          on:click={() => (showSendInterface = true)}
        >
          Send Another Invoice
        </button>
      </div>
    {/if}

    {#if showSendInterface}
      <div class="w3-section w3-border-top w3-padding-top">
        <h6>Send Another Invoice</h6>
        <div class="w3-panel w3-light-gray w3-small">
          <p>
            We will ask the business office to invoice
            <b>{studentEmailText}</b>
            for <b>${repairCost}</b> related to the repair of asset
            <b>{assetTagText}</b>.
          </p>
        </div>
        <div class="w3-section">
          <button
            class="w3-button w3-amber"
            on:click={openConfirm}
            disabled={sendingInvoice}
          >
            {sendingInvoice ? "Sending..." : "Send Invoice"}
          </button>
          <button
            class="w3-button w3-light-gray w3-margin-left"
            on:click={() => (showSendInterface = false)}
          >
            Cancel
          </button>
        </div>
      </div>
    {/if}
  {:else}
    <!-- No existing invoices, show the send interface directly -->
    <div class="w3-panel w3-light-gray w3-small">
      <p>
        We will ask the business office to invoice
        <b>{studentEmailText}</b>
        for <b>${repairCost}</b> related to the repair of asset
        <b>{assetTagText}</b>.
      </p>
    </div>
    <div class="w3-section">
      <button
        class="w3-button w3-amber"
        on:click={openConfirm}
        disabled={sendingInvoice}
      >
        {sendingInvoice ? "Sending..." : "Send Invoice"}
      </button>
    </div>
  {/if}
</div>

{#if confirmOpen}
  <div class="w3-modal" style="display:block">
    <div class="w3-modal-content w3-animate-top w3-card-4">
      <header class="w3-container w3-amber">
        <h5>Confirm Invoice</h5>
      </header>
      <div class="w3-container">
        <p>
          We will ask the business office to invoice
          <b>{studentEmailText}</b>
          for <b>${repairCost}</b> related to the repair of asset
          <b>{assetTagText}</b>.
        </p>
      </div>
      <footer class="w3-container w3-padding">
        <button class="w3-button w3-light-grey" on:click={closeConfirm}
          >Cancel</button
        >
        <button class="w3-button w3-amber w3-right" on:click={sendInvoice}
          >Confirm & Send</button
        >
      </footer>
    </div>
  </div>
{/if}

{#if toast}
  <Toast kind={toast.kind} message={toast.message} show={true} />
{/if}
