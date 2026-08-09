const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface FileInfo {
  Key: string;
  LastModified: string;
  Size: number;
  ETag?: string;
  StorageClass?: string;
  displayName?: string;
  downloadUrl?: string;
}

interface ListResponse {
  items: FileInfo[];
  count: number;
}

interface GatewayFileItem {
  key?: string;
  fileName?: string;
  size?: number;
  lastModified?: string;
  Key?: string;
  LastModified?: string;
  Size?: number;
  downloadUrl?: string;
  url?: string;
}

interface DownloadResponse {
  downloadUrl?: string;
  url?: string;
  error?: string;
}

interface DownloadAttempt {
  url: string;
  init?: RequestInit;
}

function parseGatewayPayload<T>(payload: unknown): T {
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload) as T;
    } catch {
      return payload as T;
    }
  }

  if (payload && typeof payload === "object" && "body" in payload) {
    const candidate = (payload as { body?: unknown }).body;
    return parseGatewayPayload<T>(candidate);
  }

  return payload as T;
}

function tryParseJson(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

async function parseResponsePayload(res: Response): Promise<unknown> {
  const rawText = await res.text();
  if (!rawText) return {};
  return parseGatewayPayload<unknown>(tryParseJson(rawText));
}

function normalizeFileItems(payload: unknown): FileInfo[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeFileItem(item as GatewayFileItem));
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as ListResponse & { error?: string } & { items?: unknown };
    if (candidate.error) throw new Error(candidate.error);
    if (Array.isArray(candidate.items)) {
      return candidate.items.map((item) => normalizeFileItem(item as GatewayFileItem));
    }
  }

  return [];
}

function normalizeFileItem(item: GatewayFileItem): FileInfo {
  const key = item.key ?? item.Key ?? item.fileName ?? "";
  const lastModified = item.lastModified ?? item.LastModified ?? "";
  const size = item.size ?? item.Size ?? 0;

  return {
    Key: key,
    LastModified: lastModified,
    Size: size,
    displayName: key.split("/").filter(Boolean).pop() ?? key,
    downloadUrl: item.downloadUrl ?? item.url,
  };
}

function normalizeDownloadUrl(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const candidate = payload as DownloadResponse;
    if (candidate.error) throw new Error(candidate.error);
    if (candidate.downloadUrl) return candidate.downloadUrl;
    if (candidate.url) return candidate.url;
  }

  throw new Error("Download URL was not returned by the API");
}

export async function listFiles(): Promise<FileInfo[]> {
  const res = await fetch(`${API_URL}/getFiles`);
  if (!res.ok) throw new Error(`Fouten bij het ophalen van bestanden: ${res.statusText}`);

  const parsed = await parseResponsePayload(res);
  return normalizeFileItems(parsed);
}

const CONTENT_TYPES: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
};

export async function uploadFile(file: File): Promise<{ message: string; key: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const content = await fileToBase64(file);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, content, contentType }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Upload mislukt: ${res.statusText}`);
  }

  return res.json();
}

function triggerBrowserDownload(downloadUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename.split("/").pop() ?? filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadFile(filename: string, directUrl?: string): Promise<void> {
  if (directUrl) {
    triggerBrowserDownload(directUrl, filename);
    return;
  }

  const encodedPathKey = filename
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  const params = new URLSearchParams({ key: filename });
  const attempts: DownloadAttempt[] = [
    {
      url: `${API_URL}/download/${encodedPathKey}`,
    },
    {
      url: `${API_URL}/download?${params.toString()}`,
    },
    {
      url: `${API_URL}/download`,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: filename }),
      },
    },
  ];

  let lastError: Error | null = null;
  let downloadUrl: string | null = null;

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, attempt.init);
      if (!res.ok) {
        lastError = new Error(`Download mislukt: ${res.status} ${res.statusText}`);
        continue;
      }

      const parsed = await parseResponsePayload(res);
      downloadUrl = normalizeDownloadUrl(parsed);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (!downloadUrl) {
    throw lastError ?? new Error("Download mislukt");
  }

  triggerBrowserDownload(downloadUrl, filename);
}

export async function deleteFile(key: string): Promise<void> {
  const res = await fetch(`${API_URL}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Verwijderen mislukt: ${res.statusText}`);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
