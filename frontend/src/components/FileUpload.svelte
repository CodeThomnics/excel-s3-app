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
    class={`upload-dropzone flex min-h-90 cursor-pointer flex-col items-center justify-center rounded-[22px] p-10 text-center transition-all duration-200 sm:min-h-100 sm:p-12 ${dragOver ? "upload-dropzone--active" : ""}`}
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

    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-400">
      ⬆
    </div>
    <h2 class="mt-5 text-xl font-semibold text-app-text">
      Excel-bestanden uploaden
    </h2>
    <p class="mt-2 text-sm leading-7 text-app-text-muted">
      Sleep een spreadsheet hierheen of kies een bestand van je apparaat.
    </p>
    <div class="mt-5 inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/12 px-4 py-2 text-sm font-medium text-emerald-400">
      {uploading ? "Uploaden…" : "Bestand kiezen"}
    </div>
    <p class="mt-4 text-xs uppercase tracking-[0.24em] text-[#5a7a9a]">
      Ondersteund: .xlsx .xls .csv
    </p>
  </div>
  {#if error}
    <p class="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
      {error}
    </p>
  {/if}
</div>
