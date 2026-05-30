<script lang="ts">
  export let items: Array<Record<string, any>> = [];
  export let filename: string = "export.csv";
  export let headers: Array<string> = []; // Specify headers explicitly

  function exportToCSV() {
    if (!items.length) return;

    function csvCell(value: any) {
      if (Array.isArray(value)) {
        value = value.join(";");
      }
      const text = value !== undefined && value !== null ? String(value) : "";
      if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    }

    // Build CSV content
    const csvHeaders = headers.length ? headers : Object.keys(items[0]);
    const csvRows = items.map(
      (item) =>
        csvHeaders
          .map((header) => csvCell(item[header]))
          .join(",") // Join fields with ","
    );

    const csvContent = [csvHeaders.map(csvCell).join(","), ...csvRows].join(
      "\n"
    );

    // Create a downloadable link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
</script>

<button class="w3-button w3-blue" on:click={exportToCSV}>
  Export to CSV
</button>

<style>
  .w3-button.w3-blue {
    margin-top: 16px;
  }
</style>
