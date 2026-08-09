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

<div class="space-y-4">
  <div class="mb-1 flex items-center justify-between gap-3 max-[480px]:flex-col max-[480px]:items-stretch">
    <div>
      <h2 class="text-xl font-semibold text-app-text">Bestanden in S3</h2>
      <p class="mt-1 text-sm text-app-text-muted">
        Bekijk uploads en beheer downloads.
      </p>
    </div>
    <button
      onclick={onRefresh}
      disabled={loading}
      class="rounded-full border border-white/10 bg-app-800 px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-700 disabled:cursor-not-allowed disabled:opacity-60 max-[480px]:w-full"
    >
      {loading ? "Laden…" : "Vernieuwen"}
    </button>
  </div>

  {#if loading && files.length === 0}
    <p class="rounded-[20px] border border-white/10 bg-app-900 p-8 text-center text-app-text-muted">
      Bestanden worden geladen...
    </p>
  {:else if files.length === 0}
    <p class="rounded-[20px] border border-white/10 bg-app-900 p-8 text-center text-app-text-muted">
      Geen Excel-bestanden gevonden. Upload er een om te beginnen.
    </p>
  {:else}
    <div class="overflow-hidden rounded-[20px] border border-white/10 bg-app-900 shadow-inner shadow-black/20">
      <table class="w-full max-[480px]:block">
        <thead class="max-[480px]:hidden">
          <tr class="bg-app-800">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a8fb0]">
              Bestandsnaam
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a8fb0]">
              Grootte
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a8fb0]">
              Laatst gewijzigd
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6a8fb0]">
              Acties
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/10 max-[480px]:block max-[480px]:divide-y-0">
          {#each files as file (file.Key)}
            <tr class="transition-colors hover:bg-white/3 max-[480px]:block max-[480px]:border-b max-[480px]:border-white/10 max-[480px]:px-[0.9rem] max-[480px]:py-3 max-[480px]:last:border-b-0">
              <td class="break-all px-4 py-3 font-medium text-[#e8f0f8] max-[480px]:block max-[480px]:w-full max-[480px]:wrap-break-word max-[480px]:px-0 max-[480px]:py-[0.3rem] max-[480px]:before:mb-[0.35rem] max-[480px]:before:block max-[480px]:before:content-[attr(data-label)] max-[480px]:before:text-app-text-muted max-[480px]:before:text-[0.72rem] max-[480px]:before:font-semibold max-[480px]:before:uppercase max-[480px]:before:tracking-[0.03em]" data-label="Bestandsnaam" title={file.Key}>
                {file.displayName ?? file.Key}
              </td>
              <td class="px-4 py-3 text-app-text-muted max-[480px]:flex max-[480px]:w-full max-[480px]:items-start max-[480px]:justify-between max-[480px]:gap-3 max-[480px]:px-0 max-[480px]:py-[0.3rem] max-[480px]:before:flex-[0_0_7.75rem] max-[480px]:before:content-[attr(data-label)] max-[480px]:before:text-app-text-muted max-[480px]:before:text-[0.72rem] max-[480px]:before:font-semibold max-[480px]:before:uppercase max-[480px]:before:tracking-[0.03em]" data-label="Grootte">{formatBytes(file.Size)}</td>
              <td class="px-4 py-3 text-app-text-muted max-[480px]:flex max-[480px]:w-full max-[480px]:items-start max-[480px]:justify-between max-[480px]:gap-3 max-[480px]:px-0 max-[480px]:py-[0.3rem] max-[480px]:before:flex-[0_0_7.75rem] max-[480px]:before:content-[attr(data-label)] max-[480px]:before:text-app-text-muted max-[480px]:before:text-[0.72rem] max-[480px]:before:font-semibold max-[480px]:before:uppercase max-[480px]:before:tracking-[0.03em]" data-label="Laatst gewijzigd">
                {new Date(file.LastModified).toLocaleString("nl-NL")}
              </td>
              <td class="px-4 py-3 max-[480px]:block max-[480px]:w-full max-[480px]:px-0 max-[480px]:py-[0.3rem] max-[480px]:before:mb-[0.35rem] max-[480px]:before:block max-[480px]:before:content-[attr(data-label)] max-[480px]:before:text-app-text-muted max-[480px]:before:text-[0.72rem] max-[480px]:before:font-semibold max-[480px]:before:uppercase max-[480px]:before:tracking-[0.03em]" data-label="Acties">
                <div class="flex flex-wrap gap-2 max-[480px]:grid max-[480px]:w-full max-[480px]:grid-cols-2">
                  <button
                    onclick={() => handleDownload(file)}
                    disabled={downloading === file.Key || deleting === file.Key}
                    class="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-medium text-app-900 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 max-[480px]:w-full"
                  >
                    {downloading === file.Key ? "Downloaden..." : "Download"}
                  </button>
                  <button
                    onclick={() => handleDelete(file)}
                    disabled={deleting === file.Key || downloading === file.Key}
                    class="rounded-full bg-app-800 px-3 py-1.5 text-xs font-medium text-app-text transition-colors hover:bg-app-700 disabled:cursor-not-allowed disabled:opacity-60 max-[480px]:w-full"
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
