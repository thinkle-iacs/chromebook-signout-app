<script lang="ts">
  export let items: Array<Record<string, any>> = [];
  export let filename: string = "export.csv";
  export let headers: Array<string> = []; // Specify headers explicitly

  function exportToCSV() {
    if (!items.length) return;

    // Build CSV content
    const csvHeaders = headers.length ? headers : Object.keys(items[0]);
    const csvRows = items.map(
      (item) =>
        csvHeaders
          .map((header) => {
            const value = item[header];
            if (Array.isArray(value)) {
              return value.join(";"); // Join array values with ";"
            }
            return value !== undefined ? value : ""; // Handle undefined values
          })
          .join(",") // Join fields with ","
    );

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

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
