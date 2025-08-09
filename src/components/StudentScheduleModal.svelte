<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { buildStructuredSchedule } from "../scheduling/structuredSchedule";
  import { testStudentLookup, testScheduleLookup, isValidStudentEmail } from "../data/sisData";

  export let studentEmail: string = "";
  export let open: boolean = false;

  const dispatch = createEventDispatcher();

  let loading = false;
  let error: string | null = null;
  let structured: any[] | null = null;

  $: valid = isValidStudentEmail(studentEmail);

  async function loadSchedule() {
    if (!open || !valid) return;
    loading = true;
    error = null;
    structured = null;
    try {
      const [studentResp, scheduleResp] = await Promise.all([
        testStudentLookup(studentEmail),
        testScheduleLookup(studentEmail),
      ]);
      const student = studentResp?.student || studentResp;
      const sisSchedule = scheduleResp?.schedule || scheduleResp;
      if (!sisSchedule?.classes) throw new Error("No classes returned");
      structured = buildStructuredSchedule(student, sisSchedule);
    } catch (e: any) {
      error = e?.message || "Failed to load schedule";
    } finally {
      loading = false;
    }
  }

  $: if (open) {
    loadSchedule();
  }

  function close() {
    dispatch("close");
  }

  function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map((x) => parseInt(x, 10));
    let hour = isNaN(h) ? 0 : h;
    const minutes = isNaN(m) ? 0 : m;
    if (hour >= 1 && hour <= 6) hour += 12;
    return hour * 60 + minutes;
  }

  function isNowBetween(start: string, end: string): boolean {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return nowMin >= s && nowMin < e;
  }

  function todayWeekdayIndex(): number {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d : -1;
  }
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="button"
    on:click|self={close}
    tabindex="0"
    on:keydown={(e) => {
      if (e.key === "Escape" || e.key === "Enter") close();
    }}
  >
    <div class="modal" role="dialog" aria-modal="true" aria-label="Student Schedule">
      <header class="modal-header">
        <h3>Student Schedule</h3>
        <button class="close-btn" on:click={close} aria-label="Close">×</button>
      </header>

      <div class="modal-body">
        {#if !valid}
          <div class="w3-panel w3-pale-yellow w3-border">Enter a valid student email.</div>
        {:else if loading}
          <div class="w3-panel w3-blue w3-border"><i class="fa fa-spinner fa-spin"></i> Loading…</div>
        {:else if error}
          <div class="w3-panel w3-pale-red w3-border">{error}</div>
        {:else if structured}
          <div class="schedule-display">
            {#each structured as day}
              {@const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
              <div class="day-column" class:today={todayWeekdayIndex() === day.weekday}>
                <h3 class="day-header">{dayNames[day.weekday - 1]}</h3>
                <div class="blocks-list">
                  {#each day.blocks as block}
                    <div class="block-item" class:current={todayWeekdayIndex() === day.weekday && isNowBetween(block.start, block.end)} class:free={block.isFree}>
                      <div class="block-header">
                        <div class="block-name">{block.blockName}</div>
                        <div class="block-time">{block.start} - {block.end}</div>
                      </div>
                      <div class="block-content">
                        <div class="class-name">{block.class}</div>
                        {#if block.room}
                          <div class="room-info">Room: {block.room}</div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <footer class="modal-footer">
        <button class="w3-button w3-gray" on:click={close}>Close</button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: white;
    border-radius: 8px;
    width: min(1400px, 98vw);
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }
  .close-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }
  .modal-body { padding: 16px; }

  .schedule-display { display: flex; gap: 18px; overflow-x: auto; }
  .day-column { flex: 1; min-width: 240px; border: 1px solid #ddd; border-radius: 8px; background: white; }
  .day-column.today .day-header { background: #046b99; }
  .day-header { background: #007cba; color: white; margin: 0; padding: 12px 16px; border-radius: 8px 8px 0 0; text-align: center; font-size: 16px; font-weight: bold; }
  .blocks-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .block-item { border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; background: #f8f9fa; }
  .block-item.current { border-color: #ff9800; box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2); background: #fff9e6; }
  .block-item.free { background: #f1f3f4; border-color: #ccc; opacity: 0.9; }
  .block-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .block-name { font-weight: bold; color: #333; font-size: 14px; }
  .block-time { font-size: 12px; color: #666; background: white; padding: 2px 6px; border-radius: 3px; border: 1px solid #ddd; }
  .block-content .class-name { font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
  .room-info { font-size: 12px; color: #666; font-style: italic; }
</style>
