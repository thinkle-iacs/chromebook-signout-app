<script lang="ts">
  import TicketNotificationBlurb from "./TicketNotificationBlurb.svelte";
  import { logger } from "@utils/log";

  import TicketNotificationsSummary from "./components/TicketNotificationsSummary.svelte";
  import TicketNotification from "./TicketNotification.svelte";
  import type { Ticket } from "@data/tickets";
  import { createNotifications } from "@data/notifications";
  import { messagesStore, getMessages } from "@data/messages";
  import { isValidEmail } from "@utils/util";
  import EmailBlob from "@components/EmailBlob.svelte";
  export let ticket: Ticket;
  export let defaultMessage = "RepairComplete";
  export let messages = [
    "BringMachineForRepairNoLoan",
    "BringMachineForRepairLoanReady",
    "RepairComplete",
    "TicketUpdate",
  ];

  // Message templates (store is keyed by human-friendly ID)
  let selectedMessageId: string = ""; // Airtable _id once resolved
  $: allTemplates = Object.values($messagesStore || {});

  $: templates =
    messages && messages.length > 0
      ? messages
          .map((id) => ($messagesStore as any)?.[id])
          .filter((m) => Boolean(m))
      : allTemplates;

  // Lazy-load messages when empty
  $: if (allTemplates.length === 0) {
    getMessages().catch((e) => logger.logError("Failed to load messages", e));
  }

  // After templates are available, set/validate selection by mapping ID -> _id
  $: if (templates.length > 0) {
    const valid = templates.map((t: any) => t._id);
    const defaultMsg = ($messagesStore as any)?.[defaultMessage];
    if (!selectedMessageId || !valid.includes(selectedMessageId)) {
      selectedMessageId = defaultMsg ? defaultMsg._id : templates[0]._id;
    }
  }

  // Selected template object for preview
  $: selectedTemplate = (templates || []).find(
    (t: any) => t && t._id === selectedMessageId
  );

  let extraText = "";
  let sending = false;
  let result: any[] | null = null;
  let showSendInterface = false;

  // Check if there are existing notifications
  $: hasExistingNotifications =
    ((ticket as any)?.Notifications || []).length > 0;

  function getDefaultRecipients(ticket) {
    logger.logVerbose("Get default notifications...", ticket);
    const studentEmail = (ticket as any)?._linked?.Student?.Email;
    const parent1 = (ticket as any)?._linked?.Student?.["Contact1Email"];
    const parent2 = (ticket as any)?._linked?.Student?.["Contact2Email"];
    return [studentEmail, parent1, parent2].filter(Boolean);
  }

  let defaultRecipientList = [];
  let extraRecipients = [];
  let recipientChecks: boolean[] = [];
  let notificationRecipients = [];

  $: defaultRecipientList = getDefaultRecipients(ticket);
  $: if (defaultRecipientList) {
    // Initialize checkboxes to true for each recipient
    if (recipientChecks.length !== defaultRecipientList.length) {
      recipientChecks = defaultRecipientList.map(() => true);
    }
  }

  $: notificationRecipients = [
    ...defaultRecipientList.filter((r, i) => recipientChecks[i]),
    ...extraRecipients,
  ];
  $: logger.logVerbose("Recipients are:", notificationRecipients);
  let haveSent = 0;

  async function send() {
    if (!selectedMessageId) {
      alert("Select a message template first.");
      return;
    }
    sending = true;
    try {
      const [recipient, recipient2, recipient3, recipient4, recipient5] =
        notificationRecipients;
      const notifications = [
        {
          Ticket: [ticket._id],
          Messages: [selectedMessageId],
          ExtraText: extraText,
          Recipient: recipient,
          Recipient2: recipient2,
          Recipient3: recipient3,
          Recipient4: recipient4,
          Recipient5: recipient5,
          Send: true,
        },
      ];
      result = await createNotifications(notifications as any);
      ticket.Notifications = [
        ...(ticket as any)?.Notifications,
        result.id || result._id,
      ];

      // Reset form after successful send
      extraText = "";
      selectedMessageId = "";
      showSendInterface = false;
      haveSent++;
    } catch (e) {
      logger.logError("Failed to send notification:", e);
      alert("Failed to send notification");
      // Use getDefaultRecipients() to get all possible recipients
    } finally {
      sending = false;
    }
  }
</script>

{#if ticket}
  <div class="w3-panel w3-border">
    <h5>Send Ticket Notification</h5>

    {#if hasExistingNotifications}
      {#key `${ticket._id}-${haveSent}`}<TicketNotificationsSummary
          {ticket}
        />{/key}
      {#if !showSendInterface}
        <div class="w3-section">
          <button
            class="w3-button w3-blue w3-small"
            on:click={() => (showSendInterface = true)}
          >
            Send Another Notification
          </button>
        </div>
      {/if}
    {/if}

    {#if showSendInterface || !hasExistingNotifications}
      <div class="w3-section w3-border-top w3-padding-top">
        <h6>
          {hasExistingNotifications
            ? "Send Another Notification"
            : "Send Ticket Notification"}
        </h6>
        <div class="w3-small w3-text-gray">
          Selected: {selectedTemplate
            ? selectedTemplate.Name ||
              selectedTemplate.Subject ||
              selectedTemplate.ID ||
              selectedTemplate._id
            : "(none)"}
        </div>
        <div class="w3-row-padding">
          <div class="w3-col s12 m6">
            <label for="msg-template" class="w3-small">Message Template</label>
            <select
              id="msg-template"
              class="w3-select w3-border"
              bind:value={selectedMessageId}
              disabled={templates.length === 0}
            >
              <option value=""
                >{templates.length === 0 ? "Loading…" : "Select…"}</option
              >
              {#each templates as t (t._id)}
                <option value={t._id}
                  >{t.Name || t.Subject || t.ID || t._id}</option
                >
              {/each}
            </select>

            {#if selectedTemplate}
              <details class="w3-margin-top">
                <summary class="w3-small">Preview message</summary>
                <div class="w3-small w3-section">
                  <div>
                    <strong>Subject:</strong>
                    {selectedTemplate.Subject || "(no subject)"}
                  </div>
                  <EmailBlob>{selectedTemplate.Body || "(no body)"}</EmailBlob>
                  <EmailBlob>{extraText}</EmailBlob>
                  <TicketNotificationBlurb {ticket}></TicketNotificationBlurb>
                </div>
              </details>
            {/if}
          </div>
          <div class="w3-col s12 m6">
            <label for="extra-text" class="w3-small">Extra Text</label>
            <textarea
              id="extra-text"
              class="w3-input w3-border"
              rows="5"
              bind:value={extraText}
              placeholder="Optional note…"
            />
          </div>
        </div>
        <div class="w3-margin-top">
          <h4 class="w3-small">Recipients:</h4>
          <div class="w3-section">
            {#each defaultRecipientList as recipient, i}
              <label class="w3-check w3-small name-label">
                <input type="checkbox" bind:checked={recipientChecks[i]} />
                {recipient}
              </label>
            {/each}
            {#each Array(5 - defaultRecipientList.length).fill("") as _, i}
              {#if i == 0 || isValidEmail(extraRecipients[i - 1])}
                <label class="w3-check w3-small name-label">
                  <input
                    type="checkbox"
                    checked={isValidEmail(extraRecipients[i])}
                  />
                  <input
                    bind:value={extraRecipients[i]}
                    placeholder="Type valid email to add..."
                  />
                </label>
              {/if}
            {/each}
          </div>
        </div>
        <div class="w3-section">
          <button
            class="w3-button w3-blue"
            on:click={send}
            disabled={sending || templates.length === 0}
          >
            {sending ? "Sending…" : "Send Notification"}
          </button>
          {#if hasExistingNotifications}
            <button
              class="w3-button w3-light-gray w3-margin-left"
              on:click={() => (showSendInterface = false)}
            >
              Cancel
            </button>
          {/if}
        </div>
        {#if result}
          <div class="w3-small w3-text-green">Notification sent.</div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  label.name-label {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
