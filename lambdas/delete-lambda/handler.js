import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getS3Client() {
  return new S3Client({ region: process.env.AWS_REGION });
}

function getBucket() {
  return process.env.BUCKET;
}

function getDefaultPrefix() {
  return process.env.PREFIX ?? "excel/";
}

function buildCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "http://localhost:3000",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "DELETE,POST,OPTIONS",
  };
}

function normalizeKey(base, provided) {
  const clean = (provided || "").trim().replace(/^\/+/, "");
  if (!clean) return "";
  return clean.startsWith(base) ? clean : `${base}${clean}`;
}

function getKeyFromBody(event) {
  if (event?.body == null) return "";

  if (typeof event.body === "string") {
    try {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      const parsed = JSON.parse(body);
      return typeof parsed?.key === "string" ? parsed.key : "";
    } catch {
      return "";
    }
  }

  if (typeof event.body === "object") {
    return typeof event.body?.key === "string" ? event.body.key : "";
  }

  return "";
}

export const handler = async (event) => {
  const maybe = (obj, path) => {
    try {
      return path.split(".").reduce((s, p) => (s && s[p] != null ? s[p] : undefined), obj);
    } catch {
      return undefined;
    }
  };

  const methodRaw =
    maybe(event, "requestContext.http.method") ||
    maybe(event, "requestContext.httpMethod") ||
    event?.httpMethod ||
    event?.requestContext?.http?.method ||
    event?.requestContext?.httpMethod ||
    event?.requestContext?.http?.method ||
    event?.requestContext?.method ||
    event?.method ||
    (event?.headers && (event.headers["X-HTTP-Method-Override"] || event.headers["x-http-method-override"])) ||
    "";

  const method = String(methodRaw || "").toUpperCase();
  const corsHeaders = buildCorsHeaders(event?.headers?.origin || event?.headers?.Origin);

  try {
    if (method === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders, body: "" };
    }

    if (method !== "DELETE" && method !== "POST") {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Method ${method} not allowed` }),
      };
    }

    const bucket = getBucket();
    if (!bucket) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Environment variable BUCKET is required" }),
      };
    }

    const providedKey =
      event?.queryStringParameters?.key ||
      getKeyFromBody(event);
    const key = normalizeKey(getDefaultPrefix(), providedKey);

    if (!key) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "A file key is required" }),
      };
    }

    await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Deleted", key }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err?.message || "Internal server error" }),
    };
  }
};
