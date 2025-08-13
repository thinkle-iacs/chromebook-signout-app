<script lang="ts">
  import {
    test78schedule as testMSschedule,
    test56schedule as testMS56schedule,
    testHSschedule,
  } from "./scheduleSampleData";
  import { buildStructuredSchedule } from "./structuredSchedule";
  import {
    parseProjectScheduleFromSIS,
    getBellScheduleForStudentDay,
  } from "./bellSchedules";

  let selectedSample = "ms78";
  let structuredResult: any = null;
  let scheduleMap: any = null;
  let daySchedules: any = {};
  let error: string | null = null;

  function runTest() {
    error = null;
    structuredResult = null;
    scheduleMap = null;
    daySchedules = {};

    try {
      const sampleData = getSampleData();
      console.log("Testing with sample:", selectedSample, sampleData);

      // Extract student and schedule from sample data
      const { student, schedule } = sampleData;

      // STEP 1: Parse SIS data into day mappings
      scheduleMap = parseProjectScheduleFromSIS(schedule);
      console.log("Schedule map:", scheduleMap);

      // STEP 2: Get bell schedules for each day
      const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      for (let weekday = 1; weekday <= 5; weekday++) {
        const dayName = dayNames[weekday - 1];
        const bellSchedule = getBellScheduleForStudentDay(
          student,
          weekday,
          scheduleMap
        );
        daySchedules[dayName] = {
          bellSchedule: bellSchedule
            ? {
                name: bellSchedule.name,
                description: bellSchedule.description,
                grades: bellSchedule.grades,
              }
            : null,
          classMap: scheduleMap[dayName] || {},
        };
      }
      console.log("Day schedules:", daySchedules);

      // STEP 3: Build final structured schedule
      structuredResult = buildStructuredSchedule(student, schedule);
      console.log("Structured result:", structuredResult);
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : JSON.stringify(err);
      console.error("Test error:", err);
    }
  }

  function getSampleData() {
    switch (selectedSample) {
      case "ms56":
        return testMS56schedule;
      case "ms78":
        return testMSschedule;
      case "hs":
        return testHSschedule;
      default:
        return testMSschedule;
    }
  }

  // Run initial test and reactive updates
  $: if (selectedSample) {
    runTest();
  }
</script>

<div class="schedule-tester">
  <h2>Schedule Structure Tester</h2>

  <div class="controls">
    <label>
      <input
        type="radio"
        bind:group={selectedSample}
        value="ms56"
        on:change={runTest}
      />
      Middle School Grade 5/6
    </label>
    <label>
      <input
        type="radio"
        bind:group={selectedSample}
        value="ms78"
        on:change={runTest}
      />
      Middle School Grade 7/8
    </label>
    <label>
      <input
        type="radio"
        bind:group={selectedSample}
        value="hs"
        on:change={runTest}
      />
      High School (9th grade)
    </label>
  </div>
  {#key selectedSample}
    <!-- STEP 1: Original SIS Data -->
    <details open>
      <summary><strong>STEP 1: Original SIS Schedule Data</strong></summary>
      <div class="json-dump">
        <pre>{JSON.stringify(getSampleData().schedule, null, 2)}</pre>
      </div>
    </details>

    <!-- STEP 2: Parsed Day Mappings -->
    {#if scheduleMap}
      <details open>
        <summary
          ><strong>STEP 2: Parsed Day-by-Day Schedule Map</strong></summary
        >
        <div class="schedule-map">
          {#each Object.entries(scheduleMap) as [day, classes]}
            <div class="day-section">
              <h4>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
              <div class="class-list">
                {#each Object.entries(classes) as [block, className]}
                  <div class="class-block">
                    <strong>{block.toUpperCase()}:</strong>
                    {className}
                  </div>
                {:else}
                  <div class="no-classes">No classes found</div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </details>
    {/if}

    <!-- STEP 3: Bell Schedule Selection -->
    {#if daySchedules && Object.keys(daySchedules).length > 0}
      <details open>
        <summary
          ><strong>STEP 3: Bell Schedule Selection by Day</strong></summary
        >
        <div class="day-schedules">
          {#each Object.entries(daySchedules) as [day, info]}
            <div class="day-schedule">
              <h4>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
              {#if info.bellSchedule}
                <div class="schedule-info">
                  <strong>Bell Schedule:</strong>
                  {info.bellSchedule.name}<br />
                  <strong>Description:</strong>
                  {info.bellSchedule.description}<br />
                  <strong>Grades:</strong>
                  {info.bellSchedule.grades.join(", ")}
                </div>
              {:else}
                <div class="no-schedule">No bell schedule found</div>
              {/if}

              <div class="project-detection">
                <strong>Project Class Detection:</strong>
                {#each Object.entries(info.classMap) as [block, className]}
                  {#if className.toLowerCase().includes("project")}
                    <div class="project-class">
                      ✓ {block.toUpperCase()}: {className} (PROJECT DETECTED)
                    </div>
                  {:else}
                    <div class="regular-class">
                      {block.toUpperCase()}: {className}
                    </div>
                  {/if}
                {:else}
                  <div class="no-classes">No classes mapped</div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </details>
    {/if}
  {/key}
  <!-- STEP 4: Final Structured Schedule -->
  {#if structuredResult}
    {#key selectedSample}
      <details open>
        <summary
          ><strong>STEP 4: Final Structured Schedule Output</strong></summary
        >
        <div class="final-schedule">
          <div class="schedule-summary">
            <div class="success">
              <p>
                <strong>Student:</strong>
                {getSampleData().student?.givenName}
                {getSampleData().student?.familyName}
                <strong>Grade:</strong>
                {getSampleData().student?.grades?.[0] || "Unknown"}
              </p>
              <p>
                <strong>Schedule processed successfully!</strong>
                Found {structuredResult.length} days with schedule data.
              </p>
            </div>
          </div>

          <!-- Schedule Display -->
          <div class="schedule-display">
            {#each structuredResult as day, dayIndex}
              {@const dayNames = [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
              ]}
              <div class="day-column">
                <h3 class="day-header">{dayNames[dayIndex]}</h3>
                <div class="blocks-list">
                  {#each day.blocks as block}
                    <div
                      class="block-item"
                      class:free={block.isFree}
                      class:project={block.class
                        ?.toLowerCase()
                        .includes("project")}
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
            {/each}
          </div>

          <!-- Raw JSON View -->
          <details>
            <summary>View Raw JSON Data</summary>
            <div class="json-dump">
              <pre>{JSON.stringify(structuredResult, null, 2)}</pre>
            </div>
          </details>
        </div>
      </details>
    {/key}
  {/if}
</div>

<style>
  .schedule-tester {
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: Arial, sans-serif;
  }

  .controls {
    margin: 20px 0;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .controls label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f9f9f9;
  }

  .controls label:hover {
    background: #f0f0f0;
  }

  .error {
    background: #ffe6e6;
    border: 1px solid #ff9999;
    border-radius: 4px;
    padding: 15px;
    margin: 20px 0;
  }

  .success {
    background: #e6ffe6;
    border: 1px solid #99ff99;
    border-radius: 4px;
    padding: 15px;
  }

  .json-dump {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
  }

  .json-dump pre {
    margin: 0;
    font-family: "Courier New", monospace;
    font-size: 12px;
  }

  details {
    margin: 20px 0;
    border: 1px solid #ddd;
    border-radius: 6px;
  }

  details summary {
    background: #f0f0f0;
    padding: 12px;
    cursor: pointer;
    font-weight: bold;
    border-radius: 6px 6px 0 0;
  }

  details[open] summary {
    border-bottom: 1px solid #ddd;
  }

  details > div {
    padding: 15px;
  }

  .schedule-map {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .day-section {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 10px;
    background: #fafafa;
  }

  .day-section h4 {
    margin: 0 0 10px 0;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
  }

  .class-block {
    margin: 5px 0;
    padding: 5px;
    background: white;
    border-radius: 3px;
    font-size: 14px;
  }

  .no-classes {
    color: #666;
    font-style: italic;
    text-align: center;
    padding: 10px;
  }

  .day-schedules {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
  }

  .day-schedule {
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 15px;
    background: #fafafa;
  }

  .day-schedule h4 {
    margin: 0 0 10px 0;
    color: #333;
    border-bottom: 2px solid #007cba;
    padding-bottom: 5px;
  }

  .schedule-info {
    background: white;
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
    border-left: 4px solid #007cba;
  }

  .no-schedule {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .project-detection {
    margin-top: 10px;
  }

  .project-class {
    background: #d4edda;
    color: #155724;
    padding: 5px 8px;
    margin: 3px 0;
    border-radius: 3px;
    border-left: 4px solid #28a745;
    font-weight: bold;
  }

  .regular-class {
    background: white;
    padding: 5px 8px;
    margin: 3px 0;
    border-radius: 3px;
    border-left: 4px solid #ccc;
  }

  /* Schedule Display Styles */
  .final-schedule {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .schedule-summary {
    margin-bottom: 15px;
  }

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
    transition: all 0.2s ease;
  }

  .block-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .block-item.project {
    background: #d4edda;
    border-color: #28a745;
    border-left: 4px solid #28a745;
  }

  .block-item.free {
    background: #f1f3f4;
    border-color: #ccc;
    opacity: 0.8;
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

  .block-item.project .class-name {
    color: #155724;
  }

  .block-item.free .class-name {
    font-style: italic;
    color: #666;
  }

  .room-info {
    font-size: 12px;
    color: #666;
    font-style: italic;
  }
</style>
