import { describe, expect, test } from "bun:test";
import { listFiles } from "./api";

describe("listFiles", () => {
  test("parses API Gateway payloads with a stringified body", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            items: [
              {
                Key: "excel/test.xlsx",
                LastModified: "2024-07-01T00:00:00.000Z",
                Size: 123,
              },
            ],
            count: 1,
          }),
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    ) as typeof fetch;

    try {
      const files = await listFiles();
      expect(files).toHaveLength(1);
      expect(files[0].displayName).toBe("test.xlsx");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("parses API Gateway payloads returning an array of file objects", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          statusCode: 200,
          body: JSON.stringify([
            {
              key: "excel/actual-file.xlsx",
              fileName: "actual-file.xlsx",
              size: 999,
              lastModified: "2024-07-01T00:00:00.000Z",
              downloadUrl: "https://example.com/download.xlsx",
            },
          ]),
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    ) as typeof fetch;

    try {
      const files = await listFiles();
      expect(files).toHaveLength(1);
      expect(files[0].displayName).toBe("actual-file.xlsx");
      expect(files[0].Size).toBe(999);
      expect(files[0].downloadUrl).toBe("https://example.com/download.xlsx");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
