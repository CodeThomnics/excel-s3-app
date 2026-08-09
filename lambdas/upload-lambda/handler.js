import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000", // Use "*" for development if appropriate
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

export const handler = async (event) => {
  try {
    // Support both HTTP API v2 and REST API v1
    const method =
      event.requestContext?.http?.method || event.httpMethod;

    // Handle preflight request
    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: corsHeaders,
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "No file received",
        }),
      };
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;

    const { filename, content, contentType: fileContentType } = JSON.parse(rawBody);
    const buffer = Buffer.from(content, "base64");

    const ext = (filename || "upload").split(".").pop() ?? "xlsx";
    // Use the exact original filename when possible. Remove any path segments to prevent traversal.
    const originalBase = (filename || `upload.${ext}`).split(/[/\\]+/).pop();
    // As a safety measure, strip any characters that could be problematic in S3 keys (control chars).
    const fileName = originalBase.replace(/[\x00-\x1F\x7F]/g, "_");

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET,
        Key: `excel/${fileName}`,
        Body: buffer,
        ContentType: fileContentType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        fileName,
      }),
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: err.message,
      }),
    };
  }
};