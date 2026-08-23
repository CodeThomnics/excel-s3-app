<script lang="ts">
  import { uploadFile } from "../api";

  let {
    onUploadComplete = () => {}
  }: {
    onUploadComplete?: () => void;
  } = $props();

  const fileInputId = "excel-upload-input";
  let uploading = $state(false);
  let error = $state<string | null>(null);
  let dragOver = $state(false);

  async function handleFile(file: File, input?: HTMLInputElement): Promise<void> {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      error = "Only .xlsx, .xls, and .csv files are allowed";
      return;
    }

    uploading = true;
    error = null;

    try {
      await uploadFile(file);
      onUploadComplete();
    } catch (e) {
      error = e instanceof Error ? e.message : "Upload mislukt";
    } finally {
      uploading = false;
      if (input) input.value = "";
    }
  }

  function handleChange(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (file) void handleFile(file, target);
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) void handleFile(file);
  }

  function openFileDialog(): void {
    const input = document.getElementById(fileInputId);
    if (input instanceof HTMLInputElement) input.click();
  }
</script>

<div class="space-y-4">
  <div
    class={`group flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border bg-white p-6 text-center shadow-[0_12px_35px_-24px_rgba(84,70,69,0.4)] transition-all duration-200 hover:border-asb-red/35 hover:shadow-[0_16px_40px_-24px_rgba(162,26,32,0.35)] dark:bg-asb-dark-surface dark:shadow-none dark:hover:border-asb-red-soft/45 ${dragOver ? "-translate-y-0.5 border-asb-red bg-asb-red/3 ring-4 ring-asb-red/10 dark:border-asb-red-soft dark:bg-asb-red-soft/10 dark:ring-asb-red-soft/15" : "border-asb-line dark:border-asb-dark-line"}`}
    role="button"
    tabindex="0"
    aria-label="Upload an Excel file"
    ondragover={(event) => {
      event.preventDefault();
      dragOver = true;
    }}
    ondragleave={() => (dragOver = false)}
    ondrop={handleDrop}
    onclick={openFileDialog}
    onkeydown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFileDialog();
      }
    }}
  >
    <input
      id={fileInputId}
      type="file"
      accept=".xlsx,.xls,.csv"
      onchange={handleChange}
      hidden
    />

    <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-asb-red/10 text-xl font-medium text-asb-red transition-transform duration-200 group-hover:-translate-y-0.5 dark:bg-asb-red-soft/15 dark:text-asb-red-soft">
      ⬆
    </div>
    <h2 class="mt-4 text-lg font-semibold text-[#342b2a] dark:text-asb-dark-text">
      Bestand uploaden
    </h2>
    <p class="mt-1 max-w-60 text-sm leading-6 text-asb-brown/65 dark:text-asb-dark-muted">
      Sleep een spreadsheet hierheen of kies er een op je apparaat.
    </p>
    <div class="mt-4 inline-flex items-center rounded-lg bg-asb-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-asb-red-dark dark:bg-asb-red-soft dark:text-asb-dark-bg dark:group-hover:bg-asb-red">
      {uploading ? "Uploaden…" : "Bestand kiezen"}
    </div>
    <p class="mt-3 text-xs text-asb-brown/45 dark:text-asb-dark-muted">
      XLSX · XLS · CSV
    </p>
  </div>
  {#if error}
    <p class="rounded-2xl border border-asb-red/30 bg-asb-red/10 px-4 py-3 text-sm text-asb-red dark:border-asb-red-soft/30 dark:bg-asb-red-soft/10 dark:text-asb-red-soft">
      {error}
    </p>
  {/if}
</div>
