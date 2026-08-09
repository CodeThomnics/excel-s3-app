import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const BUCKET = process.env.BUCKET;
const DEFAULT_PREFIX = process.env.PREFIX ?? "excel/";

function buildCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "http://localhost:3000",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

function normalizeKey(base, provided) {
  const cleanProvided = (provided || "").trim().replace(/^\/+/, "");
  if (!cleanProvided) return "";
  return cleanProvided.startsWith(base) ? cleanProvided : `${base}${cleanProvided}`;
}

function getKeyFromPath(event) {
  const candidate =
    event?.pathParameters?.proxy ||
    event?.pathParameters?.key ||
    event?.pathParameters?.fileKey;

  if (candidate) {
    return decodeURIComponent(candidate);
  }

  const rawPath = event?.rawPath || event?.path || "";
  const match = rawPath.match(/\/download\/?(.+)$/);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return "";
}

function getKeyFromBody(event) {
  if (!event?.body) return "";

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

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const corsHeaders = buildCorsHeaders(event?.headers?.origin || event?.headers?.Origin);

  try {
    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: "",
      };
    }

    if (method !== "GET" && method !== "POST") {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Method ${method} not allowed` }),
      };
    }

    if (!BUCKET) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Environment variable BUCKET is required" }),
      };
    }

    const providedKey =
      event?.queryStringParameters?.key ||
      getKeyFromPath(event) ||
      getKeyFromBody(event);
    const key = normalizeKey(DEFAULT_PREFIX, providedKey);

    if (!key) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "A file key is required" }),
      };
    }

    const fileName = key.split("/").filter(Boolean).pop() ?? key;
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });

    const downloadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ downloadUrl, key }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error.message || String(error),
      }),
    };
  }
};