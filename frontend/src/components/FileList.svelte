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
  <div class="mb-1 flex items-center justify-between gap-3">
    <div>
      <h2 class="text-xl font-semibold text-app-text">Bestanden in S3</h2>
      <p class="mt-1 text-sm text-app-text-muted">
        Bekijk uploads en beheer downloads.
      </p>
    </div>
    <button
      onclick={onRefresh}
      disabled={loading}
      class="rounded-full border border-white/10 bg-app-800 px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      <table class="w-full">
        <thead>
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
        <tbody class="divide-y divide-white/10">
          {#each files as file (file.Key)}
            <tr class="transition-colors hover:bg-white/3">
              <td class="break-all px-4 py-3 font-medium text-[#e8f0f8]" title={file.Key}>
                {file.displayName ?? file.Key}
              </td>
              <td class="px-4 py-3 text-app-text-muted">{formatBytes(file.Size)}</td>
              <td class="px-4 py-3 text-app-text-muted">
                {new Date(file.LastModified).toLocaleString("nl-NL")}
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
                  <button
                    onclick={() => handleDownload(file)}
                    disabled={downloading === file.Key || deleting === file.Key}
                    class="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-medium text-app-900 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloading === file.Key ? "Downloaden..." : "Download"}
                  </button>
                  <button
                    onclick={() => handleDelete(file)}
                    disabled={deleting === file.Key || downloading === file.Key}
                    class="rounded-full bg-app-800 px-3 py-1.5 text-xs font-medium text-app-text transition-colors hover:bg-app-700 disabled:cursor-not-allowed disabled:opacity-60"
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
