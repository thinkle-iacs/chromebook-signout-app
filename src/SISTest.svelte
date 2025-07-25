<script lang="ts">
  import {
    testSISConnection,
    testSISAuth,
    testStudentLookup,
    testScheduleLookup,
    testScheduleAnalysis,
    isValidStudentEmail,
  } from "./data/sisData";

  let studentEmail = "";
  let results: any[] = [];
  let loading = false;

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
  }

  // Test functions
  const testA = () => runTest("A. Basic Connectivity", testSISConnection);
  const testB = () => runTest("B. SIS Authentication", testSISAuth);
  const testC = () =>
    runTest("C. Student Lookup", () => testStudentLookup(studentEmail));
  const testD = () =>
    runTest("D. Schedule Lookup", () => testScheduleLookup(studentEmail));
  const testE = () =>
    runTest("E. Structured Schedule", () => testScheduleAnalysis(studentEmail));
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
        <label class="w3-text-blue"
          ><b>Student Email (for tests C & D):</b></label
        >
        <input
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

        <button
          class="w3-button w3-teal w3-margin-right w3-margin-bottom"
          on:click={testE}
          disabled={loading ||
            !studentEmail ||
            !isValidStudentEmail(studentEmail)}
        >
          Test E: Get structured schedule
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
</style>
