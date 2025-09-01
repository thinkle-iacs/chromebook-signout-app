<script lang="ts">
  import { logger } from "@utils/log";
  import type { Ticket } from "@data/tickets";
  import {
    getNotifications,
    getNotificationsObjects,
  } from "@data/notifications";
  import TicketNotification from "../TicketNotification.svelte";
  import TicketNotificationBlurb from "../TicketNotificationBlurb.svelte";
  import EmailBlob from "@components/EmailBlob.svelte";

  export let ticket: Ticket;

  let open = false;
  let loading = false;
  let rows: any[] = [];
  $: count = ((ticket as any)?.Notifications || []).length;
  $: hasAny = count > 0;

  let expanded: Record<string, boolean> = {};

  function toggleRow(id: string) {
    expanded[id] = !expanded[id];
  }

  function displayDate(iso?: string) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso as any;
    }
  }

  async function toggle() {
    open = !open;
    if (open && rows.length === 0) {
      loading = true;
      try {
        logger.logVerbose(
          "Fetching notifications for ticket number",
          ticket.Number
        );
        rows = await getNotificationsObjects({
          ticketNumber: String(ticket.Number),
        });
      } finally {
        loading = false;
      }
    }
  }

  $: logger.logVerbose(JSON.stringify(ticket));
  $: logger.logVerbose("Rows", rows);
</script>

{#if hasAny}
  <button class="w3-button w3-tiny w3-light-grey" on:click={toggle}>
    {count} notification{count === 1 ? "" : "s"} sent
  </button>
  {#if open}
    <div class="w3-panel w3-white w3-border w3-small w3-margin-top">
      {#if loading}
        <div class="w3-small w3-text-gray">Loading…</div>
      {:else if rows.length === 0}
        <div class="w3-small w3-text-gray">No notifications found.</div>
      {:else}
        <table class="w3-table w3-striped w3-small">
          <thead>
            <tr>
              <th style="width:60%">Subject</th>
              <th style="width:40%">Created</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as n}
              <tr class="clickable" on:click={() => toggleRow(n._id)}>
                <td>{n._linked?.Messages?.Subject}</td>
                <td class="w3-text-gray">{displayDate(n.Created)}</td>
              </tr>
              {#if expanded[n._id]}
                <tr>
                  <td colspan="2">
                    <div class="w3-panel w3-light-gray w3-small">
                      {#if n._linked?.Messages?.Subject}
                        <div>
                          <b>Subject:</b>
                          {n._linked?.Messages?.Subject}
                        </div>
                      {/if}
                      {#if n._linked?.Messages?.Body}
                        <div class="w3-margin-top">
                          <div style="white-space: pre-wrap;">
                            <b>To: </b>
                            {#if n.Recipient}
                              {n.Recipient}
                            {/if}
                            {#each [2, 3, 4, 5] as i}
                              {#if n[`Recipient${i}`]}
                                , {n[`Recipient${i}`]}
                              {/if}
                            {/each}
                          </div>

                          <EmailBlob>{n._linked?.Messages?.Body}</EmailBlob>
                          {#if n.ExtraText}
                            <EmailBlob>{n.ExtraText}</EmailBlob>
                          {/if}
                          <TicketNotificationBlurb {ticket} />
                        </div>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .clickable {
    cursor: pointer;
  }
</style>
