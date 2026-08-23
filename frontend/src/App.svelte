<script lang="ts">
  import { onMount } from "svelte";
  import { listFiles, type FileInfo } from "./api";
  import FileList from "./components/FileList.svelte";
  import FileUpload from "./components/FileUpload.svelte";

  let files: FileInfo[] = $state([]);
  let loading = $state(true);
  let dark = $state(document.documentElement.classList.contains("dark"));

  function toggleDark(): void {
    dark = !dark;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.theme = dark ? "dark" : "light";
  }

  async function fetchFiles(): Promise<void> {
    loading = true;
    try {
      files = await listFiles();
    } catch (e) {
      console.error("Failed to fetch files:", e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchFiles();
  });
</script>

<div class="min-h-screen bg-asb-cream dark:bg-asb-dark-bg">
  <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header class="flex flex-col gap-5 border-b border-asb-line pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-asb-dark-line">
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-asb-red text-xs font-bold tracking-wider text-white shadow-[0_8px_20px_-8px_rgba(162,26,32,0.65)]">
          XLS
        </div>
        <div>
          <h1 class="text-2xl font-semibold text-[#342b2a] dark:text-asb-dark-text">Excel S3 Beheer</h1>
          <p class="mt-0.5 text-sm text-asb-brown/65 dark:text-asb-dark-muted">Aaltense Schietbond</p>
        </div>
      </div>

      <div class="flex items-center gap-5 self-start sm:self-auto">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-asb-brown/45 dark:text-asb-dark-muted">Bestanden</p>
          <p class="mt-0.5 text-lg font-semibold text-asb-brown dark:text-asb-dark-text">{files.length}</p>
        </div>
        <div class="h-9 w-px bg-asb-line dark:bg-asb-dark-line"></div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-asb-brown/45 dark:text-asb-dark-muted">Status</p>
          <p class="mt-1 flex items-center gap-2 text-sm font-medium text-asb-brown dark:text-asb-dark-text">
            <span class="h-2 w-2 rounded-full {loading ? 'bg-amber-400' : 'bg-asb-green'}"></span>
            {loading ? "Vernieuwen…" : "Gereed"}
          </p>
        </div>
        <div class="h-9 w-px bg-asb-line dark:bg-asb-dark-line"></div>
        <button
          onclick={toggleDark}
          class="flex h-9 w-9 items-center justify-center rounded-md border border-asb-line text-asb-brown/70 transition-colors hover:border-asb-red/35 hover:bg-asb-red/4 hover:text-asb-red dark:border-asb-dark-line dark:text-asb-dark-muted dark:hover:border-asb-red-soft/50 dark:hover:bg-asb-red-soft/10 dark:hover:text-asb-red-soft"
          aria-label={dark ? "Lichte modus" : "Donkere modus"}
          title={dark ? "Lichte modus" : "Donkere modus"}
        >
          {dark ? "☀" : "☾"}
        </button>
      </div>
    </header>

    <main class="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <section aria-label="Bestand uploaden">
        <FileUpload onUploadComplete={fetchFiles} />
      </section>
      <section class="min-w-0" aria-label="Bestanden beheren">
        <FileList {files} {loading} onRefresh={fetchFiles} />
      </section>
    </main>

    <footer class="pb-4 text-center text-sm text-asb-brown/50 dark:text-asb-dark-muted">
      Gebouwd met ♥ voor de Aaltense Schietbond
    </footer>
  </div>
</div>
