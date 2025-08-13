<script lang="ts">
  import TicketNotificationsSummary from "./components/TicketNotificationsSummary.svelte";
  import TicketNotification from "./TicketNotification.svelte";
  import type { Ticket } from "@data/tickets";
  import { createNotifications } from "@data/notifications";
  import { messagesStore, getMessages } from "@data/messages";

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
    getMessages().catch((e) => console.error("Failed to load messages", e));
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

  function defaultRecipients() {
    const studentEmail = (ticket as any)["Email (from Student)"]?.[0];
    const parent1 = (ticket as any)["Contact1Email (from Student)"]?.[0];
    const parent2 = (ticket as any)["Contact2Email (from Student)"]?.[0];
    return [studentEmail, parent1, parent2].filter(Boolean);
  }

  async function send() {
    if (!selectedMessageId) {
      alert("Select a message template first.");
      return;
    }
    sending = true;
    try {
      const [recipient, recipient2, recipient3] = defaultRecipients();
      const notifications = [
        {
          Ticket: [ticket._id],
          Messages: [selectedMessageId],
          ExtraText: extraText,
          Recipient: recipient,
          Recipient2: recipient2,
          Recipient3: recipient3,
          Send: true,
        },
      ];
      result = await createNotifications(notifications as any);

      // Reset form after successful send
      extraText = "";
      selectedMessageId = "";
      showSendInterface = false;
    } catch (e) {
      console.error("Failed to send notification:", e);
      alert("Failed to send notification");
    } finally {
      sending = false;
    }
  }
</script>

<div class="w3-panel w3-border">
  <h5>Send Ticket Notification</h5>

  {#if hasExistingNotifications}
    <!-- Show summary first, with option to send another -->
    <TicketNotificationsSummary {ticket} />

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

    {#if showSendInterface}
      <div class="w3-section w3-border-top w3-padding-top">
        <h6>Send Another Notification</h6>
        <!-- Notification sender interface -->
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
                  <pre
                    class="w3-code w3-light-gray"
                    style="white-space: pre-wrap;">{selectedTemplate.Body ||
                      "(no body)"}</pre>
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
        <div class="w3-section">
          <button
            class="w3-button w3-blue"
            on:click={send}
            disabled={sending || templates.length === 0}
          >
            {sending ? "Sending…" : "Send Notification"}
          </button>
          <button
            class="w3-button w3-light-gray w3-margin-left"
            on:click={() => (showSendInterface = false)}
          >
            Cancel
          </button>
        </div>
        {#if result}
          <div class="w3-small w3-text-green">Notification sent.</div>
        {/if}
      </div>
    {/if}
  {:else}
    <!-- No existing notifications, show the send interface directly -->
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
            <option value={t._id}>{t.Name || t.Subject || t.ID || t._id}</option
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
              <pre
                class="w3-code w3-light-gray"
                style="white-space: pre-wrap;">{selectedTemplate.Body ||
                  "(no body)"}</pre>
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
    <div class="w3-section">
      <button
        class="w3-button w3-blue"
        on:click={send}
        disabled={sending || templates.length === 0}
      >
        {sending ? "Sending…" : "Send Notification"}
      </button>
    </div>
    {#if result}
      <div class="w3-small w3-text-green">Notification sent.</div>
    {/if}
  {/if}
</div>
