import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const PRESIGN_TTL = 300; // seconds

export const handler = async () => {
  try {
    const result = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.BUCKET,
        Prefix: "excel/",
      })
    );

    const items = (result.Contents || []).filter(file => file.Key !== "excel/");

    const files = await Promise.all(
      items.map(async (file) => {
        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET,
          Key: file.Key,
          ResponseContentDisposition: `attachment; filename="${file.Key.split("/").pop()}"`,
        });
        const downloadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_TTL });
        return {
          key: file.Key,
          fileName: file.Key.replace("excel/", ""),
          size: file.Size,
          lastModified: file.LastModified,
          downloadUrl,
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(files),
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
      }),
    };
  }
};