<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import Loader from "@components/Loader.svelte";
  import DataExporter from "./DataExporter.svelte";
  import EmailDisplay from "@people/components/EmailDisplay.svelte";
  import { logger } from "@utils/log";
  import {
    buildStudentDeviceReport,
    type StudentDeviceReportMachine,
    type StudentDeviceReportRow,
  } from "@data/studentDeviceReport";
  import { INACTIVE_PURPOSES } from "@data/inventory";

  type SortColumn =
    | "student"
    | "yog"
    | "status"
    | "summary"
    | "currentLoanCount"
    | "lastUsedMachineCount"
    | "problemCount";

  type DisplayRow = {
    key: string;
    row: StudentDeviceReportRow;
    machine: StudentDeviceReportMachine | null;
    machineIndex: number;
  };

  let inputMode: "yog" | "list" = "yog";
  let selectedYOG = "";
  let selectedStudentStatus = "";
  let listInput = "";
  let rows: StudentDeviceReportRow[] = [];
  let loading = false;
  let error = "";
  let errorDetails = "";
  let progress = { completed: 0, total: 0 };
  const STATUS_ORDER = [
    "checkedInAfterGoogleUse",
    "checkedInUnknown",
    "signedOutToStaff",
    "signedOutToOther",
    "unknown",
    "checkedInAfterUse",
    "checkedInSameDay",
    "normal",
    "noMachine",
  ] as const;

  const STATUS_LABELS: Record<string, string> = {
    normal: "Signed out to latest user",
    signedOutToOther: "Signed out to different student",
    signedOutToStaff: "Signed out to staff",
    checkedInAfterUse: "Checked in after Google activity",
    checkedInSameDay: "Checked in same day as Google activity; order unknown",
    checkedInAfterGoogleUse: "Google activity after check-in",
    checkedInUnknown: "Checked in; no check-in date found",
    unknown: "Not found in inventory",
    noMachine: "No Google last-used machines",
  };

  let sortColumn: SortColumn = "lastUsedMachineCount";
  let sortDirection: "asc" | "desc" = "desc";
  let selectedStatuses: Set<string> = new Set();
  let hideRetired = true;
  let expandedMachines = {};
  let tableScrollEl: HTMLDivElement | null = null;
  let topScrollEl: HTMLDivElement | null = null;
  let viewportScrollEl: HTMLDivElement | null = null;
  let reportTableEl: HTMLTableElement | null = null;
  let topScrollWidth = 0;
  let showTopScroll = false;
  let showViewportScroll = false;
  let viewportScrollLeft = 0;
  let viewportScrollWidth = 0;
  let resizeObserver: ResizeObserver | null = null;

  $: parsedEmails = parseEmails(listInput);
  $: canRun =
    !loading &&
    ((inputMode === "yog" && selectedYOG.trim()) ||
      (inputMode === "list" && parsedEmails.length));
  $: sortedRows = sortRows(rows, sortColumn, sortDirection);
  $: allDisplayRows = flattenDisplayRows(sortedRows);
  $: availableStatuses = getAvailableStatuses(rows);
  $: selectedStatuses = new Set(availableStatuses);
  $: displayRows = filterAndSortDisplayRows(
    allDisplayRows,
    selectedStatuses,
    hideRetired,
    sortColumn,
    sortDirection,
  );
  $: exportRows = exportFromDisplayRows(displayRows);
  $: filename = [
    inputMode === "yog" ? selectedYOG || "students" : "student-list",
    selectedStudentStatus || "all-statuses",
    "student-device-report.csv",
  ].join("-");

  function syncScrollMetrics() {
    if (!tableScrollEl || !reportTableEl) return;
    const rect = tableScrollEl.getBoundingClientRect();

    topScrollWidth = reportTableEl.scrollWidth;
    showTopScroll = reportTableEl.scrollWidth > tableScrollEl.clientWidth + 1;
    viewportScrollLeft = Math.max(0, rect.left);
    viewportScrollWidth = Math.max(
      0,
      Math.min(rect.width, window.innerWidth - viewportScrollLeft),
    );
    showViewportScroll =
      showTopScroll && rect.bottom > 0 && rect.top < window.innerHeight;

    if (topScrollEl && topScrollEl.scrollLeft !== tableScrollEl.scrollLeft) {
      topScrollEl.scrollLeft = tableScrollEl.scrollLeft;
    }
    if (
      viewportScrollEl &&
      viewportScrollEl.scrollLeft !== tableScrollEl.scrollLeft
    ) {
      viewportScrollEl.scrollLeft = tableScrollEl.scrollLeft;
    }
  }

  function handleTopScroll() {
    if (!tableScrollEl || !topScrollEl) return;
    if (tableScrollEl.scrollLeft !== topScrollEl.scrollLeft) {
      tableScrollEl.scrollLeft = topScrollEl.scrollLeft;
    }
    if (
      viewportScrollEl &&
      viewportScrollEl.scrollLeft !== topScrollEl.scrollLeft
    ) {
      viewportScrollEl.scrollLeft = topScrollEl.scrollLeft;
    }
  }

  function handleViewportScroll() {
    if (!tableScrollEl || !viewportScrollEl) return;
    if (tableScrollEl.scrollLeft !== viewportScrollEl.scrollLeft) {
      tableScrollEl.scrollLeft = viewportScrollEl.scrollLeft;
    }
    if (topScrollEl && topScrollEl.scrollLeft !== viewportScrollEl.scrollLeft) {
      topScrollEl.scrollLeft = viewportScrollEl.scrollLeft;
    }
  }

  function handleTableScroll() {
    if (!tableScrollEl) return;
    if (topScrollEl && topScrollEl.scrollLeft !== tableScrollEl.scrollLeft) {
      topScrollEl.scrollLeft = tableScrollEl.scrollLeft;
    }
    if (
      viewportScrollEl &&
      viewportScrollEl.scrollLeft !== tableScrollEl.scrollLeft
    ) {
      viewportScrollEl.scrollLeft = tableScrollEl.scrollLeft;
    }
  }

  let syncPending = false;
  async function scheduleSyncMetrics() {
    if (syncPending) return;
    syncPending = true;
    await tick();
    syncPending = false;
    syncScrollMetrics();
  }

  $: displayRows.length, sortedRows.length, scheduleSyncMetrics();

  onMount(() => {
    const onResize = () => syncScrollMetrics();
    const onScroll = () => syncScrollMetrics();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => syncScrollMetrics());
      if (reportTableEl) {
        resizeObserver.observe(reportTableEl);
      }
    }
    scheduleSyncMetrics();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  function parseEmails(value: string) {
    return value
      .split(/[,\n\r\t ;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  function setSort(column: SortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection =
        column === "student" || column === "yog" || column === "status"
          ? "asc"
          : "desc";
    }
  }

  function sortRows(
    reportRows: StudentDeviceReportRow[],
    column: SortColumn,
    direction: "asc" | "desc",
  ) {
    if (column === "summary") {
      return [...reportRows];
    }

    const sorted = [...reportRows];
    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (column === "student") {
        aValue = a.student.Email || a.student.Name || "";
        bValue = b.student.Email || b.student.Name || "";
      } else if (column === "yog") {
        aValue = a.student.YOG || "";
        bValue = b.student.YOG || "";
      } else if (column === "status") {
        aValue = a.student.Status || "";
        bValue = b.student.Status || "";
      } else {
        aValue = a[column];
        bValue = b[column];
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  function flattenDisplayRows(reportRows: StudentDeviceReportRow[]) {
    return reportRows.flatMap((row) => {
      if (!row.machines.length) {
        return [
          {
            key: `${row.student._id}:none`,
            row,
            machine: null,
            machineIndex: 0,
          },
        ];
      }
      return row.machines.map((machine, machineIndex) => ({
        key: `${row.student._id}:${machine.serial || machine.assetTag}`,
        row,
        machine,
        machineIndex,
      }));
    }) as DisplayRow[];
  }

  function summarySortRank(machine: StudentDeviceReportMachine | null) {
    if (!machine) return 99;

    const ranks = {
      signedOutToOther: 1,
      signedOutToStaff: 2,
      checkedInAfterGoogleUse: 3,
      checkedInUnknown: 4,
      unknown: 5,
      checkedInAfterUse: 6,
      checkedInSameDay: 7,
      normal: 8,
    };

    return ranks[machine.status] ?? 98;
  }

  function getAvailableStatuses(reportRows: StudentDeviceReportRow[]): string[] {
    const found = new Set<string>();
    for (const row of reportRows) {
      if (!row.machines.length) {
        found.add("noMachine");
      } else {
        for (const machine of row.machines) {
          found.add(machine.status);
        }
      }
    }
    return STATUS_ORDER.filter((s) => found.has(s));
  }

  function toggleStatus(status: string) {
    const next = new Set(selectedStatuses);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    selectedStatuses = next;
  }

  function selectAllStatuses() {
    selectedStatuses = new Set(availableStatuses);
  }

  function clearAllStatuses() {
    selectedStatuses = new Set();
  }

  function exportFromDisplayRows(dRows: DisplayRow[]): Record<string, any>[] {
    return dRows.map(({ row, machine, machineIndex }) => {
      const recentUsersStr = machine
        ? (machine.googleData?.recentUsers || [])
            .map((u) => u?.email)
            .filter(Boolean)
            .join(";")
        : "";
      const lastActiveMs =
        machine?.googleData?.activeTimeRanges?.slice(-1)[0]?.activeTime ?? null;
      return {
        Student: row.student.Email,
        Name: row.student.Name,
        YOG: row.student.YOG,
        Status: row.student.Status,
        "Machine Number": machine ? machineIndex + 1 : "",
        "Machine Count": row.lastUsedMachineCount,
        "Asset Tag": machine?.assetTag || "",
        Purpose: machine?.purpose || "",
        Serial: machine?.serial || "",
        "Last Activity Date": machine?.lastUsed || "",
        "Google Last Sync": machine?.googleData?.lastSync || "",
        "Last Activity Duration": machine ? formatDuration(lastActiveMs) : "",
        "Recent Users": recentUsersStr,
        "Checkout Status": machine
          ? machine.currentOwner
            ? `Signed out to ${machine.currentOwner}`
            : machine.checkInTime
              ? `Checked in ${machine.checkInTime}`
              : machine.status === "unknown"
                ? "Not found in inventory"
                : "Checked in; no check-in date found"
          : "No Google last-used machines",
        "Checkout Time": machine?.checkoutTime || "",
        "Check-In Time": machine?.checkInTime || "",
        Summary: machine?.statusLabel || "No Google last-used machines",
      };
    });
  }

  function matchesStatusFilter(displayRow: DisplayRow, selected: Set<string>) {
    if (selected.size === 0) return false;
    const status = displayRow.machine?.status ?? "noMachine";
    return selected.has(status);
  }

  function filterAndSortDisplayRows(
    reportRows: DisplayRow[],
    selected: Set<string>,
    hideInactive: boolean,
    column: SortColumn,
    direction: "asc" | "desc",
  ) {
    const filtered = reportRows.filter((displayRow) => {
      if (!matchesStatusFilter(displayRow, selected)) return false;
      if (hideInactive && displayRow.machine?.purpose && INACTIVE_PURPOSES.includes(displayRow.machine.purpose)) return false;
      return true;
    });

    if (column !== "summary") {
      return filtered;
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const aRank = summarySortRank(a.machine);
      const bRank = summarySortRank(b.machine);
      if (aRank !== bRank) {
        return direction === "asc" ? aRank - bRank : bRank - aRank;
      }

      const aStudent = a.row.student.Email || a.row.student.Name || "";
      const bStudent = b.row.student.Email || b.row.student.Name || "";
      if (aStudent < bStudent) return -1;
      if (aStudent > bStudent) return 1;
      return 0;
    });

    return sorted;
  }

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    listInput = await file.text();
    inputMode = "list";
  }

  async function runReport() {
    loading = true;
    error = "";
    errorDetails = "";
    rows = [];
    progress = { completed: 0, total: 0 };

    try {
      rows = await buildStudentDeviceReport({
        yog: inputMode === "yog" ? selectedYOG.trim() : undefined,
        emails: inputMode === "list" ? parsedEmails : undefined,
        status: selectedStudentStatus || undefined,
        onProgress: ({ completed, total }) => {
          progress = { completed, total };
        },
      });
    } catch (err) {
      const reportError =
        err instanceof Error
          ? err
          : new Error(String(err || "Failed to build student device report."));
      error = reportError.message || "Failed to build student device report.";
      errorDetails = reportError.stack || reportError.message;
      logger.logError("StudentDeviceReport runReport failed", reportError);
    } finally {
      loading = false;
    }
  }

  function statusClass(machine: StudentDeviceReportMachine) {
    return `status-pill status-${machine.status}`;
  }

  function isWarningMachine(machine: StudentDeviceReportMachine | null) {
    if (!machine) return false;
    return !["normal", "checkedInAfterUse"].includes(machine.status);
  }

  function formatDate(date: string | null) {
    if (!date) return "Unknown";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString();
  }

  function formatDateTime(date: string | null) {
    if (!date) return "Unknown";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleString();
  }

  function formatDuration(ms: number | null | undefined) {
    if (!ms && ms !== 0) return "";
    const totalMinutes = Math.round(ms / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours) return `${hours}:${String(minutes).padStart(2, "0")}`;
    return `${minutes} min`;
  }

  function latestActivity(machine: StudentDeviceReportMachine | null) {
    if (!machine) return null;
    const ranges = machine.googleData?.activeTimeRanges || [];
    return ranges.length ? ranges[ranges.length - 1] : null;
  }

  function activitySummary(machine: StudentDeviceReportMachine | null) {
    const activity = latestActivity(machine);
    if (!machine || !activity) return "";
    const duration = formatDuration(activity.activeTime);
    return duration
      ? `${formatDate(activity.date)} for ${duration}`
      : formatDate(activity.date);
  }

  function recentUsers(machine: StudentDeviceReportMachine | null) {
    return machine?.googleData?.recentUsers || [];
  }

  function recentUserSummary(machine: StudentDeviceReportMachine | null) {
    const users = recentUsers(machine)
      .map((user) => user?.email)
      .filter((email): email is string => !!email);
    if (!machine || !users.length) return "";
    const lastUserLower = (machine.lastUser || "").toLowerCase();
    const nextUsers = users
      .slice(1, 4)
      .filter(
        (email) => !lastUserLower || email.toLowerCase() !== lastUserLower,
      );
    if (!nextUsers.length) return "No other recent users listed";
    return `Next recent: ${nextUsers.map(shortEmail).join(", ")}`;
  }

  function toggleExpanded(key: string) {
    expandedMachines = {
      ...expandedMachines,
      [key]: !expandedMachines[key],
    };
  }

  function formatCheckoutStatus(machine: StudentDeviceReportMachine | null) {
    if (!machine) return "";
    if (machine.currentOwner) {
      return `Signed out to ${shortEmail(machine.currentOwner)}${
        machine.checkoutTime
          ? ` on ${formatDateTime(machine.checkoutTime)}`
          : ""
      }`;
    }
    if (machine.checkInTime) {
      return `Checked in ${formatDateTime(machine.checkInTime)}`;
    }
    if (machine.status === "unknown") {
      return "Not found in inventory";
    }
    return "Checked in; no check-in date found";
  }

  function shortEmail(email: string | null | undefined) {
    if (!email) return "";
    const at = email.indexOf("@");
    return at > 0 ? email.slice(0, at) : email;
  }

  const now = new Date();
  const seniorGradYear =
    now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const currentEighthYOG = seniorGradYear + 4;

  function formatCount(displayRow: DisplayRow) {
    if (!displayRow.machine) {
      return "No machines where this student is Google latest user";
    }
    return `Machine ${displayRow.machineIndex + 1} of ${
      displayRow.row.lastUsedMachineCount
    } this student was the Google latest user`;
  }
</script>

<section class="student-device-report">
  <div class="controls w3-border-bottom">
    <div class="mode-buttons" aria-label="Student selection mode">
      <button
        class="w3-button w3-border"
        class:w3-blue={inputMode === "yog"}
        on:click={() => (inputMode = "yog")}
      >
        Class Year
      </button>
      <button
        class="w3-button w3-border"
        class:w3-blue={inputMode === "list"}
        on:click={() => (inputMode = "list")}
      >
        Uploaded List
      </button>
    </div>

    {#if inputMode === "yog"}
      <label>
        YOG
        <input
          class="w3-input w3-border"
          type="text"
          placeholder="e.g. {currentEighthYOG} for current 8th graders"
          bind:value={selectedYOG}
        />
      </label>
    {:else}
      <label class="email-list">
        Student Emails
        <textarea
          class="w3-input w3-border"
          rows="4"
          bind:value={listInput}
          placeholder="student@example.org"
        ></textarea>
      </label>
      <label>
        Upload
        <input
          class="w3-input w3-border"
          type="file"
          accept=".csv,.txt"
          on:change={handleFileUpload}
        />
      </label>
    {/if}

    <label>
      Status
      <select class="w3-select w3-border" bind:value={selectedStudentStatus}>
        <option value="">All</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </label>

    <div class="actions">
      <button
        class="w3-button w3-green"
        disabled={!canRun}
        on:click={runReport}
      >
        {rows.length ? "Rerun" : "Run"} Report
      </button>
      {#if exportRows.length}
        <DataExporter
          items={exportRows}
          {filename}
          headers={[
            "Student",
            "Name",
            "YOG",
            "Status",
            "Machine Number",
            "Machine Count",
            "Asset Tag",
            "Purpose",
            "Serial",
            "Last Activity Date",
            "Google Last Sync",
            "Last Activity Duration",
            "Recent Users",
            "Checkout Status",
            "Checkout Time",
            "Check-In Time",
            "Summary",
          ]}
        />
      {/if}
    </div>

    {#if rows.length}
      <label class="retired-toggle">
        <input type="checkbox" bind:checked={hideRetired} />
        Hide Disposed/Retired machines
      </label>
    {/if}

    {#if rows.length && availableStatuses.length}
      <div class="status-filter-section">
        <div class="status-filter-header">
          <strong>Filter by status:</strong>
          <button
            class="w3-button w3-tiny w3-border"
            on:click={selectAllStatuses}
          >All</button>
          <button
            class="w3-button w3-tiny w3-border"
            on:click={clearAllStatuses}
          >None</button>
        </div>
        <div class="status-checkboxes">
          {#each availableStatuses as status}
            <label class="status-checkbox-label">
              <input
                type="checkbox"
                checked={selectedStatuses.has(status)}
                on:change={() => toggleStatus(status)}
              />
              {STATUS_LABELS[status] || status}
            </label>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  {#if error}
    <div class="w3-panel w3-pale-red w3-border">
      <div>{error}</div>
      {#if errorDetails}
        <details class="error-details">
          <summary>Details</summary>
          <pre>{errorDetails}</pre>
        </details>
      {/if}
    </div>
  {/if}

  {#if loading}
    <Loader
      working={true}
      text={progress.total
        ? `Checking Google Admin: ${progress.completed}/${progress.total}`
        : "Loading students and inventory"}
    />
  {:else if rows.length}
    <p>
      Showing <b>{sortedRows.length}</b> students and
      <b>{displayRows.length}</b> of <b>{allDisplayRows.length}</b> report rows
      with
      <b>{exportRows.filter((row) => row.Serial).length}</b> last-used machines
    </p>

    <div class="w3-responsive">
      {#if showViewportScroll}
        <div
          class="viewport-scrollbar"
          bind:this={viewportScrollEl}
          on:scroll={handleViewportScroll}
          style={`left: ${viewportScrollLeft}px; width: ${viewportScrollWidth}px;`}
        >
          <div
            class="top-scrollbar-content"
            style={`width: ${topScrollWidth}px;`}
          ></div>
        </div>
      {/if}
      {#if showTopScroll}
        <div
          class="top-scrollbar"
          bind:this={topScrollEl}
          on:scroll={handleTopScroll}
        >
          <div
            class="top-scrollbar-content"
            style={`width: ${topScrollWidth}px;`}
          ></div>
        </div>
      {/if}
      <div
        class="report-table-scroll"
        bind:this={tableScrollEl}
        on:scroll={handleTableScroll}
      >
        <table
          bind:this={reportTableEl}
          class="w3-table w3-bordered w3-striped report-table report-table-grid"
        >
          <thead>
            <tr>
              <th on:click={() => setSort("student")}>Student</th>
              <th on:click={() => setSort("status")}>Status</th>
              <th>Machine</th>
              <th>Purpose</th>
              <th>Last Activity</th>
              <th>Checkout Status</th>
              <th on:click={() => setSort("summary")}>Summary</th>
              <th on:click={() => setSort("lastUsedMachineCount")}>Count</th>
            </tr>
          </thead>
          <tbody>
            {#each displayRows as displayRow (displayRow.key)}
              <tr class:has-warning={isWarningMachine(displayRow.machine)}>
                <td>
                  <b><EmailDisplay email={displayRow.row.student.Email} /></b>
                  <div class="w3-small">{displayRow.row.student.Name}</div>
                  <div class="w3-small">YOG {displayRow.row.student.YOG}</div>
                </td>
                <td>
                  <span
                    class:inactive={displayRow.row.student.Status ===
                      "Inactive"}
                    class="student-status"
                  >
                    {displayRow.row.student.Status}
                  </span>
                  <div class="w3-small">
                    {displayRow.row.currentLoanCount} currently signed out
                    {#if displayRow.row.problemCount}
                      | {displayRow.row.problemCount} warning{displayRow.row
                        .problemCount === 1
                        ? ""
                        : "s"}
                    {/if}
                  </div>
                </td>
                <td>
                  {#if displayRow.machine}
                    <div class="machine-summary">
                      {#if displayRow.machine.asset}
                        <AssetDisplay
                          asset={displayRow.machine.asset}
                          openInNewTab={true}
                          showOwner={true}
                        />
                      {:else}
                        <div>
                          <b>{displayRow.machine.assetTag}</b>
                          <div class="w3-monospace w3-small">
                            s/n {displayRow.machine.serial}
                          </div>
                        </div>
                      {/if}
                    </div>
                  {:else}
                    <span class="w3-text-gray"
                      >No Google last-used machines</span
                    >
                  {/if}
                </td>
                <td class="purpose-cell">
                  {#if displayRow.machine?.purpose}
                    <span class="purpose-pill purpose-{displayRow.machine.purpose.toLowerCase().replace(/\s+/g, '-')}"
                      >{displayRow.machine.purpose}</span
                    >
                  {/if}
                </td>
                <td>
                  {#if displayRow.machine}
                    <div>
                      {activitySummary(displayRow.machine) ||
                        formatDate(displayRow.machine.lastUsed)}
                    </div>
                    {#if displayRow.machine.googleData?.lastSync}
                      <div class="w3-small">
                        Last sync: {formatDateTime(
                          displayRow.machine.googleData.lastSync,
                        )}
                      </div>
                    {/if}
                    <div class="w3-small">
                      {recentUserSummary(displayRow.machine)}
                      <button
                        class="w3-button w3-tiny w3-border expand-button"
                        on:click={() => toggleExpanded(displayRow.key)}
                      >
                        {expandedMachines[displayRow.key] ? "-" : "+"}
                      </button>
                    </div>
                  {/if}
                </td>
                <td>{formatCheckoutStatus(displayRow.machine)}</td>
                <td>
                  {#if displayRow.machine}
                    <span class={statusClass(displayRow.machine)}>
                      {displayRow.machine.statusLabel}
                    </span>
                  {:else}
                    <span class="w3-text-gray"
                      >No Google latest-user machines</span
                    >
                  {/if}
                </td>
                <td>{formatCount(displayRow)}</td>
              </tr>
              {#if expandedMachines[displayRow.key] && displayRow.machine}
                <tr class="expanded-row">
                  <td colspan="8">
                    <div class="expanded-grid">
                      <div>
                        <h4>Recent Users</h4>
                        <ol>
                          {#each recentUsers(displayRow.machine) as user}
                            <li>{user.email || user.type}</li>
                          {/each}
                        </ol>
                      </div>
                      <div>
                        <h4>Device Activity</h4>
                        <ol>
                          {#each [...(displayRow.machine.googleData?.activeTimeRanges || [])]
                            .reverse()
                            .slice(0, 10) as range}
                            <li>
                              {formatDate(range.date)}
                              {#if formatDuration(range.activeTime)}
                                for {formatDuration(range.activeTime)}
                              {/if}
                            </li>
                          {/each}
                        </ol>
                      </div>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</section>

<style>
  .student-device-report {
    padding-top: 16px;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    padding-bottom: 16px;
  }
  .controls label {
    min-width: 150px;
    font-weight: bold;
  }
  .mode-buttons {
    display: flex;
    gap: 4px;
  }
  .email-list {
    min-width: min(460px, 100%);
  }
  .actions {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .actions :global(button.w3-button) {
    margin-top: 0;
  }
  th {
    cursor: pointer;
    white-space: nowrap;
  }
  .report-table td {
    vertical-align: top;
  }
  .report-table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .top-scrollbar {
    position: sticky;
    top: 0;
    overflow-x: auto;
    overflow-y: hidden;
    margin-bottom: 6px;
    padding: 6px 0 4px;
    background: #fff;
    z-index: 20;
    border-bottom: 1px solid #e0e0e0;
    -webkit-overflow-scrolling: touch;
  }
  .top-scrollbar-content {
    height: 1px;
  }
  .viewport-scrollbar {
    position: fixed;
    bottom: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    z-index: 1200;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
    -webkit-overflow-scrolling: touch;
  }
  .report-table-grid {
    min-width: 980px;
    table-layout: auto;
  }
  .has-warning {
    background-color: #fff8e1;
  }
  .student-status {
    font-weight: bold;
  }
  .inactive {
    color: #757575;
    text-decoration: line-through;
  }
  .machine-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: flex-start;
  }
  .expand-button {
    margin-left: 6px;
    padding: 0 6px;
  }
  .expanded-row td {
    background: #f7f7f7;
  }
  .expanded-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .expanded-grid h4 {
    margin: 4px 0;
    font-size: 14px;
    font-weight: bold;
  }
  .expanded-grid ol {
    margin: 0;
    padding-left: 20px;
  }
  .status-pill {
    border-radius: 4px;
    display: inline-block;
    font-size: 12px;
    font-weight: bold;
    padding: 2px 6px;
  }
  .status-normal {
    background: #dff3df;
    color: #1b5e20;
  }
  .status-checkedInAfterUse {
    background: #dff3df;
    color: #1b5e20;
  }
  .status-checkedInSameDay,
  .status-checkedInUnknown {
    background: #fff4c2;
    color: #7a5600;
  }
  .status-signedOutToOther,
  .status-signedOutToStaff,
  .status-checkedInAfterGoogleUse {
    background: #ffd6d6;
    color: #8b0000;
  }
  .status-unknown {
    background: #eeeeee;
    color: #424242;
  }
  .purpose-cell {
    white-space: nowrap;
  }
  .purpose-pill {
    display: inline-block;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
    background: #eeeeee;
    color: #424242;
  }
  .purpose-pill.purpose-mcas {
    background: #111;
    color: #ff4444;
    border: 1px solid #ff4444;
  }
  .purpose-pill.purpose-daily-loaner {
    background: #e3f2fd;
    color: #0d47a1;
    border: 1px solid #90caf9;
  }
  .purpose-pill.purpose-staff-spare {
    background: #fff3e0;
    color: #bf360c;
    border: 1px solid #ffcc80;
  }
  .purpose-pill.purpose-temp {
    background: #f5f5f5;
    color: #616161;
    border: 1px solid #bdbdbd;
  }
  .error-details {
    margin-top: 8px;
  }
  .error-details pre {
    white-space: pre-wrap;
    margin: 6px 0 0;
    font-size: 12px;
  }
  .retired-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: normal;
    cursor: pointer;
    min-width: unset;
  }
  .status-filter-section {
    width: 100%;
    padding: 8px 0 4px;
  }
  .status-filter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .status-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
  }
  .status-checkbox-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: normal;
    cursor: pointer;
    min-width: unset;
  }
</style>
