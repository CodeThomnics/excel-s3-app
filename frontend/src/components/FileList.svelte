<script lang="ts">
  import { deleteFile, downloadFile, type FileInfo } from "../api";

  let {
    files = [],
    loading = false,
    onRefresh = () => {}
  }: {
    files?: FileInfo[];
    loading?: boolean;
    onRefresh?: () => void;
  } = $props();

  let downloading = $state<string | null>(null);
  let deleting = $state<string | null>(null);

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  function fileExtension(fileName: string): string {
    return fileName.split(".").pop()?.slice(0, 4).toUpperCase() ?? "FILE";
  }

  async function handleDelete(file: FileInfo): Promise<void> {
    if (!confirm(`Weet je zeker dat je "${file.displayName ?? file.Key}" wilt verwijderen?`)) return;
    deleting = file.Key;
    try {
      await deleteFile(file.Key);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Verwijderen mislukt");
    } finally {
      deleting = null;
    }
  }

  async function handleDownload(file: FileInfo): Promise<void> {
    downloading = file.Key;
    try {
      await downloadFile(file.Key, file.downloadUrl);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download mislukt");
    } finally {
      downloading = null;
    }
  }
</script>

<div class="overflow-hidden rounded-lg border border-asb-line bg-white shadow-[0_12px_35px_-24px_rgba(84,70,69,0.4)] dark:border-asb-dark-line dark:bg-asb-dark-surface dark:shadow-none">
  <div class="flex items-center justify-between gap-3 border-b border-asb-line px-5 py-4 dark:border-asb-dark-line">
    <div>
      <h2 class="text-lg font-semibold text-[#342b2a] dark:text-asb-dark-text">Bestanden</h2>
      <p class="mt-0.5 text-sm text-asb-brown/60 dark:text-asb-dark-muted">{files.length} {files.length === 1 ? "bestand" : "bestanden"} in S3</p>
    </div>
    <button
      onclick={onRefresh}
      disabled={loading}
      class="flex h-9 w-9 items-center justify-center rounded-md border border-asb-line text-lg text-asb-brown/65 transition-colors hover:border-asb-red/35 hover:bg-asb-red/4 hover:text-asb-red disabled:cursor-not-allowed disabled:opacity-50 dark:border-asb-dark-line dark:text-asb-dark-muted dark:hover:border-asb-red-soft/50 dark:hover:bg-asb-red-soft/10 dark:hover:text-asb-red-soft"
      aria-label="Bestanden vernieuwen"
      title="Bestanden vernieuwen"
    >
      <span class={loading ? "animate-spin" : ""} aria-hidden="true">↻</span>
    </button>
  </div>

  {#if loading && files.length === 0}
    <p class="m-5 rounded-lg bg-asb-cream p-8 text-center text-asb-brown/65 dark:bg-asb-dark-bg dark:text-asb-dark-muted">
      Bestanden worden geladen...
    </p>
  {:else if files.length === 0}
    <p class="m-5 rounded-lg bg-asb-cream p-8 text-center text-asb-brown/65 dark:bg-asb-dark-bg dark:text-asb-dark-muted">
      Geen Excel-bestanden gevonden. Upload er een om te beginnen.
    </p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full max-[480px]:block">
        <thead class="max-[480px]:hidden">
          <tr class="bg-asb-cream/75 dark:bg-asb-dark-bg/60">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-asb-brown/60 dark:text-asb-dark-muted">
              Bestandsnaam
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-asb-brown/60 dark:text-asb-dark-muted">
              Grootte
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-asb-brown/60 dark:text-asb-dark-muted">
              Laatst gewijzigd
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-asb-brown/60 dark:text-asb-dark-muted">
              Acties
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-asb-line max-[480px]:block max-[480px]:divide-y-0 dark:divide-asb-dark-line">
          {#each files as file (file.Key)}
            <tr class="bg-white transition-colors hover:bg-asb-cream max-[480px]:block max-[480px]:border-b max-[480px]:border-asb-line max-[480px]:px-[0.9rem] max-[480px]:py-3 max-[480px]:last:border-b-0 dark:bg-asb-dark-surface dark:hover:bg-asb-dark-bg dark:max-[480px]:border-asb-dark-line">
              <td class="break-all px-4 py-3 font-medium text-asb-brown max-[480px]:block max-[480px]:w-full max-[480px]:wrap-break-word max-[480px]:px-0 max-[480px]:py-[0.3rem] max-[480px]:before:mb-[0.35rem] max-[480px]:before:block max-[480px]:before:content-[attr(data-label)] max-[480px]:before:text-asb-brown/60 max-[480px]:before:text-[0.72rem] max-[480px]:before:font-semibold max-[480px]:before:uppercase max-[480px]:before:tracking-[0.03em] dark:text-asb-dark-text dark:max-[480px]:before:text-asb-dark-muted" data-label="Bestandsnaam" title={file.Key}>
                <div class="flex items-center gap-3">
                  <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-asb-red/10 text-[0.62rem] font-bold text-asb-red dark:bg-asb-red-soft/15 dark:text-asb-red-soft">
                    {fileExtension(file.displayName ?? file.Key)}
                  </span>
                  <span>{file.displayName ?? file.Key}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-asb-brown/70 max-[480px]:flex max-[480px]:w-full max-[480px]:items-start max-[480px]:justify-between max-[480px]:gap-3 max-[480px]:px-0 max-[480px]:py-[0.3rem] max-[480px]:before:flex-[0_0_7.75rem] max-[480px]:before:content-[attr(data-label)] max-[480px]:before:text-asb-brown/60 max-[480px]:before:text-[0.72rem] max-[480px]:before:font-semibold max-[480px]:before:uppercase max-[480px]:before:tracking-[0.03em] dark:text-asb-dark-muted dark:max-[480px]:before:text-asb-dark-muted" data-label="Grootte">{formatBytes(file.Size)}</td>
              <td class="px-4 py-3 text-asb-brown/70 max-[480px]:flex max-[480px]:w-full max-[480px]:items-start max-[480px]:justify-between max-[480px]:gap-3 max-[480px]:px-0 max-[480px]:py-[0.3rem] max-[480px]:before:flex-[0_0_7.75rem] max-[480px]:before:content-[attr(data-label)] max-[480px]:before:text-asb-brown/60 max-[480px]:before:text-[0.72rem] max-[480px]:before:font-semibold max-[480px]:before:uppercase max-[480px]:before:tracking-[0.03em] dark:text-asb-dark-muted dark:max-[480px]:before:text-asb-dark-muted" data-label="Laatst gewijzigd">
                {new Date(file.LastModified).toLocaleString("nl-NL")}
              </td>
              <td class="px-4 py-3 max-[480px]:block max-[480px]:w-full max-[480px]:px-0 max-[480px]:py-[0.3rem] max-[480px]:before:mb-[0.35rem] max-[480px]:before:block max-[480px]:before:content-[attr(data-label)] max-[480px]:before:text-asb-brown/60 max-[480px]:before:text-[0.72rem] max-[480px]:before:font-semibold max-[480px]:before:uppercase max-[480px]:before:tracking-[0.03em] dark:max-[480px]:before:text-asb-dark-muted" data-label="Acties">
                <div class="flex flex-wrap gap-2 max-[480px]:grid max-[480px]:w-full max-[480px]:grid-cols-2">
                  <button
                    onclick={() => handleDownload(file)}
                    disabled={downloading === file.Key || deleting === file.Key}
                    class="rounded-md bg-asb-red px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-asb-red-dark disabled:cursor-not-allowed disabled:opacity-60 dark:bg-asb-red-soft dark:text-asb-dark-bg dark:hover:bg-asb-red dark:hover:text-white max-[480px]:w-full"
                  >
                    {downloading === file.Key ? "Downloaden..." : "Download"}
                  </button>
                  <button
                    onclick={() => handleDelete(file)}
                    disabled={deleting === file.Key || downloading === file.Key}
                    class="rounded-md border border-asb-line bg-white px-3.5 py-2 text-xs font-semibold text-asb-brown/70 transition-colors hover:border-asb-red/35 hover:bg-asb-red/4 hover:text-asb-red disabled:cursor-not-allowed disabled:opacity-60 max-[480px]:w-full dark:border-asb-dark-line dark:bg-transparent dark:text-asb-dark-muted dark:hover:border-asb-red-soft/50 dark:hover:bg-asb-red-soft/10 dark:hover:text-asb-red-soft"
                  >
                    {deleting === file.Key ? "Verwijderen..." : "Verwijderen"}
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
