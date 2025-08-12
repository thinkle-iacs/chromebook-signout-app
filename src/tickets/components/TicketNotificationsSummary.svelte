<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import { getNotifications } from "../../data/notifications";

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
        console.log("Fetching notifications for ticket number", ticket.Number);
        rows = await getNotifications({ ticketNumber: String(ticket.Number) });
      } finally {
        loading = false;
      }
    }
  }
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
              <tr class="clickable" on:click={() => toggleRow(n.id)}>
                <td>{n.fields?.["Subject (from Messages)"]?.[0] || n.id}</td>
                <td class="w3-text-gray">{displayDate(n.fields?.Created)}</td>
              </tr>
              {#if expanded[n.id]}
                <tr>
                  <td colspan="2">
                    <div class="w3-panel w3-light-gray w3-small">
                      {#if n.fields?.ExtraText}
                        <div><b>Extra:</b> {n.fields.ExtraText}</div>
                      {/if}
                      {#if n.fields?.["Body (from Messages)"]}
                        <div class="w3-margin-top">
                          <b>Body:</b>
                          <div style="white-space: pre-wrap;">
                            {(n.fields["Body (from Messages)"] || []).join(
                              "\n"
                            )}
                          </div>
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
