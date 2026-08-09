import { beforeEach, describe, expect, mock, test } from "bun:test";

const sendCalls = [];

mock.module("@aws-sdk/client-s3", () => ({
  S3Client: class {
    constructor() {}
    async send(command) {
      sendCalls.push(command.input);
      return {};
    }
  },
  DeleteObjectCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
}));

const { handler } = await import("./handler.js");

describe("delete lambda", () => {
  beforeEach(() => {
    sendCalls.length = 0;
    process.env.BUCKET = "test-bucket";
    process.env.AWS_REGION = "us-east-1";
  });

  test("accepts lowercase DELETE methods and object bodies", async () => {
    const result = await handler({
      requestContext: { http: { method: "delete" } },
      headers: { origin: "http://localhost:5173" },
      body: { key: "excel/example.xlsx" },
    });

    expect(result.statusCode).toBe(200);
    expect(sendCalls).toHaveLength(1);
    expect(sendCalls[0]).toEqual({ Bucket: "test-bucket", Key: "excel/example.xlsx" });
  });

  test("reads keys from query string when no body is provided", async () => {
    const result = await handler({
      requestContext: { http: { method: "DELETE" } },
      headers: { origin: "http://localhost:5173" },
      queryStringParameters: { key: "excel/query-file.xlsx" },
      body: null,
    });

    expect(result.statusCode).toBe(200);
    expect(sendCalls[0]).toEqual({ Bucket: "test-bucket", Key: "excel/query-file.xlsx" });
  });
});
