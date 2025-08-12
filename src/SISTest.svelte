<script lang="ts">
  import {
    testSISConnection,
    testSISAuth,
    testStudentLookup,
    testScheduleLookup,
    isValidStudentEmail,
  } from "@data/sisData";
  import { buildStructuredSchedule } from "./scheduling/structuredSchedule";

  let studentEmail = "";
  let results: any[] = [];
  let loading = false;

  // New: structured schedule output for Step E
  let structured: any[] | null = null;
  let eError: string | null = null;

  async function runTest(testName: string, testFunction: () => Promise<any>) {
    loading = true;
    const startTime = Date.now();

    try {
      console.log(`[Test] Starting ${testName}...`);
      const result = await testFunction();
      const duration = Date.now() - startTime;

      results = [
        ...results,
        {
          test: testName,
          success: true,
          duration: `${duration}ms`,
          result: result,
          timestamp: new Date().toLocaleTimeString(),
        },
      ];

      console.log(`[Test] ${testName} completed successfully in ${duration}ms`);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      results = [
        ...results,
        {
          test: testName,
          success: false,
          duration: `${duration}ms`,
          error: error.message || "Unknown error",
          result: error,
          timestamp: new Date().toLocaleTimeString(),
        },
      ];

      console.error(`[Test] ${testName} failed after ${duration}ms:`, error);
    } finally {
      loading = false;
    }
  }

  function clearResults() {
    results = [];
    structured = null;
    eError = null;
  }

  // Test functions
  const testA = () => runTest("A. Basic Connectivity", testSISConnection);
  const testB = () => runTest("B. SIS Authentication", testSISAuth);
  const testC = () =>
    runTest("C. Student Lookup", () => testStudentLookup(studentEmail));
  const testD = () =>
    runTest("D. Schedule Lookup", () => testScheduleLookup(studentEmail));

  // New: Step E - Fetch schedule and display parsed view
  async function testE() {
    if (!studentEmail || !isValidStudentEmail(studentEmail)) return;
    loading = true;
    eError = null;
    structured = null;

    try {
      const [studentResp, scheduleResp] = await Promise.all([
        testStudentLookup(studentEmail),
        testScheduleLookup(studentEmail),
      ]);

      const student = studentResp?.student || studentResp;
      const sisSchedule = scheduleResp?.schedule || scheduleResp;

      if (!sisSchedule?.classes) {
        throw new Error("Schedule response missing classes array");
      }

      structured = buildStructuredSchedule(student, sisSchedule);
    } catch (err: any) {
      console.error("Step E failed:", err);
      eError = err?.message || "Unknown error";
    } finally {
      loading = false;
    }
  }

  // Helpers for highlighting current time
  function timeToMinutes(t: string): number {
    // t like "8:05" or "1:30"
    const [h, m] = t.split(":").map((x) => parseInt(x, 10));
    let hour = isNaN(h) ? 0 : h;
    const minutes = isNaN(m) ? 0 : m;
    // Heuristic: afternoon blocks use 1-3 without AM/PM; map 1-6 -> 13-18
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
    // 1=Mon..5=Fri else -1
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d : -1;
  }
</script>

<div class="w3-container w3-padding">
  <div class="w3-card w3-white w3-margin">
    <header class="w3-container w3-blue">
      <h2>🧪 SIS API Step-by-Step Testing</h2>
    </header>

    <div class="w3-container w3-padding">
      <div class="w3-panel w3-pale-yellow w3-border">
        <p><strong>Test Order:</strong> A → B → C → D → E</p>
        <p>
          <strong>Goal:</strong> Test SIS integration and schedule analysis with
          bell schedules
        </p>
      </div>

      <!-- Student Email Input -->
      <div class="w3-section">
        <label class="w3-text-blue" for="sis-email">
          <b>Student Email (for tests C, D & E):</b>
        </label>
        <input
          id="sis-email"
          class="w3-input w3-border w3-margin-bottom"
          type="email"
          bind:value={studentEmail}
          placeholder="student.name@innovationcharter.org"
          class:w3-border-red={studentEmail &&
            !isValidStudentEmail(studentEmail)}
        />
        {#if studentEmail && !isValidStudentEmail(studentEmail)}
          <p class="w3-text-red w3-small">
            Must be a student email (has a dot in username)
          </p>
        {/if}
      </div>

      <!-- Test Buttons -->
      <div class="w3-section">
        <button
          class="w3-button w3-blue w3-margin-right w3-margin-bottom"
          on:click={testA}
          disabled={loading}
        >
          Test A: Can we connect?
        </button>

        <button
          class="w3-button w3-indigo w3-margin-right w3-margin-bottom"
          on:click={testB}
          disabled={loading}
        >
          Test B: Can we authenticate?
        </button>

        <button
          class="w3-button w3-purple w3-margin-right w3-margin-bottom"
          on:click={testC}
          disabled={loading ||
            !studentEmail ||
            !isValidStudentEmail(studentEmail)}
        >
          Test C: Can we find student?
        </button>

        <button
          class="w3-button w3-deep-purple w3-margin-right w3-margin-bottom"
          on:click={testD}
          disabled={loading ||
            !studentEmail ||
            !isValidStudentEmail(studentEmail)}
        >
          Test D: Can we get schedule?
        </button>

        <div class="w3-container w3-margin">
          <p class="w3-text-grey">
            <em
              >Note: Backend schedule parsing has been removed. Use the new
              ScheduleTester.svelte for comprehensive frontend schedule testing
              with enhanced debugging capabilities.</em
            >
          </p>
        </div>

        <!-- New: Step E Button -->
        <button
          class="w3-button w3-teal w3-margin-right w3-margin-bottom"
          on:click={testE}
          disabled={loading ||
            !studentEmail ||
            !isValidStudentEmail(studentEmail)}
        >
          Test E: Display Parsed Schedule
        </button>

        <button
          class="w3-button w3-gray w3-margin-bottom"
          on:click={clearResults}
        >
          Clear Results
        </button>
      </div>

      {#if loading}
        <div class="w3-panel w3-blue w3-margin">
          <p><i class="fa fa-spinner fa-spin"></i> Running test...</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Results -->
  {#if results.length > 0}
    <div class="w3-card w3-white w3-margin">
      <header class="w3-container w3-teal">
        <h3>� Test Results</h3>
      </header>

      <div class="w3-container w3-padding">
        {#each results as result, i}
          <div
            class="w3-panel {result.success
              ? 'w3-pale-green'
              : 'w3-pale-red'} w3-border w3-margin-bottom"
          >
            <h4>
              {result.success ? "✅" : "❌"}
              {result.test}
              <span class="w3-small w3-text-gray">({result.duration})</span>
              <span class="w3-small w3-right w3-text-gray"
                >{result.timestamp}</span
              >
            </h4>

            {#if result.success && !result.result?.error}
              <p class="w3-text-green"><strong>Success!</strong></p>
              <details class="w3-small">
                <summary class="w3-text-blue" style="cursor: pointer;"
                  >View response details</summary
                >
                <pre
                  class="w3-code w3-light-gray w3-margin-top">{JSON.stringify(
                    result.result,
                    null,
                    2
                  )}</pre>
              </details>
            {:else}
              <p class="w3-text-red">
                <strong>Error:</strong>
                {result.result?.error || result.error || "Unknown error"}
              </p>
              <details class="w3-small">
                <summary class="w3-text-blue" style="cursor: pointer;"
                  >View error details</summary
                >
                <pre
                  class="w3-code w3-light-gray w3-margin-top">{JSON.stringify(
                    result.result,
                    null,
                    2
                  )}</pre>
              </details>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- New: Step E Display -->
  {#if structured}
    <div class="w3-card w3-white w3-margin">
      <header class="w3-container w3-teal">
        <h3>📅 Parsed Weekly Schedule</h3>
      </header>
      <div class="w3-container w3-padding">
        <div class="schedule-display">
          {#each structured as day, dayIndex}
            {@const dayNames = [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
            ]}
            {#if day?.blocks?.length}
              <div
                class="day-column"
                class:today={todayWeekdayIndex() === day.weekday}
              >
                <h3 class="day-header">{dayNames[dayIndex]}</h3>
                <div class="blocks-list">
                  {#each day.blocks as block}
                    <div
                      class="block-item"
                      class:current={todayWeekdayIndex() === day.weekday &&
                        isNowBetween(block.start, block.end)}
                      class:free={block.isFree}
                    >
                      <div class="block-header">
                        <div class="block-name">{block.blockName}</div>
                        <div class="block-time">
                          {block.start} - {block.end}
                        </div>
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
            {:else}
              <div class="day-column empty">
                <h3 class="day-header">{dayNames[dayIndex]}</h3>
                <div class="no-classes">No classes</div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  {:else if eError}
    <div class="w3-panel w3-pale-red w3-border w3-margin">
      <strong>Step E Error:</strong>
      {eError}
    </div>
  {/if}

  <!-- Debug Info -->
  <div class="w3-card w3-pale-gray w3-margin">
    <header class="w3-container w3-gray">
      <h4>🔧 Debug Information</h4>
    </header>
    <div class="w3-container w3-padding">
      <ul class="w3-ul">
        <li><strong>What each test does:</strong></li>
        <li>
          <strong>Test A:</strong> Checks if our endpoint responds and shows environment
          variables
        </li>
        <li>
          <strong>Test B:</strong> Tries to authenticate with SIS (will fail until
          auth is implemented)
        </li>
        <li>
          <strong>Test C:</strong> Looks up a student by email (needs auth working
          first)
        </li>
        <li>
          <strong>Test D:</strong> Gets student's class schedule (needs student lookup
          working first)
        </li>
        <li>
          <strong>Test E:</strong> Displays parsed weekly schedule with locations
          and highlights the current block for today.
        </li>
      </ul>

      <p class="w3-small w3-text-gray">
        <strong>Check your browser console and Netlify function logs</strong> for
        detailed debug output.
      </p>
    </div>
  </div>
</div>

<style>
  pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    max-height: 200px;
    font-family: "Courier New", monospace;
    font-size: 11px;
  }

  .fa-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* New styles for Step E */
  .schedule-display {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding: 10px 0;
  }
  .day-column {
    flex: 1;
    min-width: 220px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
  }
  .day-column.today .day-header {
    background: #046b99;
  }
  .day-header {
    background: #007cba;
    color: white;
    margin: 0;
    padding: 12px 16px;
    border-radius: 8px 8px 0 0;
    text-align: center;
    font-size: 16px;
    font-weight: bold;
  }
  .blocks-list {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .block-item {
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 12px;
    background: #f8f9fa;
  }
  .block-item.current {
    border-color: #ff9800;
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
    background: #fff9e6;
  }
  .block-item.free {
    background: #f1f3f4;
    border-color: #ccc;
    opacity: 0.9;
  }
  .block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .block-name {
    font-weight: bold;
    color: #333;
    font-size: 14px;
  }
  .block-time {
    font-size: 12px;
    color: #666;
    background: white;
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid #ddd;
  }
  .block-content .class-name {
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 4px;
  }
  .room-info {
    font-size: 12px;
    color: #666;
    font-style: italic;
  }
</style>
