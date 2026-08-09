<script lang="ts">
  import { onMount } from "svelte";
  import "./App.css";
  import { listFiles, type FileInfo } from "./api";
  import FileList from "./components/FileList.svelte";
  import FileUpload from "./components/FileUpload.svelte";

  let files: FileInfo[] = [];
  let loading = true;

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

<div class="app-shell min-h-screen">
  <div class="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <header class="app-card overflow-hidden rounded-[28px] border border-white/10 p-8 shadow-[0_25px_80px_rgba(2,10,58,0.45)]">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-2xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-[#68a94a]/30 bg-[#68a94a]/12 px-3 py-1 text-sm font-medium text-[#8dd467]">
            <span class="h-2 w-2 rounded-full bg-[#68a94a]"></span>
            Geïnspireerd door Aaltense Schietbond
          </div>
          <h1 class="mt-4 text-4xl font-semibold tracking-tight text-[#e8f0f8] sm:text-5xl">
            Excel S3 Beheer
          </h1>
          <p class="mt-3 text-lg leading-8 text-[#a0bcd4]">
            Upload, bekijk en download je Excel-bestanden uit S3 met een rustige, verzorgde interface.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <p class="text-sm text-[#8fafc8]">Opgeslagen bestanden</p>
            <p class="mt-1 text-2xl font-semibold text-[#e8f0f8]">{files.length}</p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <p class="text-sm text-[#8fafc8]">Status</p>
            <p class="mt-1 text-sm font-medium text-[#8dd467]">
              {loading ? "Vernieuwen…" : "Klaar om te bekijken"}
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="flex flex-col gap-8">
      <section class="app-card rounded-3xl border border-white/10 p-5 shadow-[0_20px_60px_rgba(2,10,58,0.30)] sm:p-6">
        <FileUpload onUploadComplete={fetchFiles} />
      </section>
      <section class="app-card rounded-3xl border border-white/10 p-5 shadow-[0_20px_60px_rgba(2,10,58,0.30)] sm:p-6">
        <FileList {files} {loading} onRefresh={fetchFiles} />
      </section>
    </main>
  </div>
</div>
