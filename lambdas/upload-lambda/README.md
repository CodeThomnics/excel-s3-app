# Upload Lambda

Generates a presigned PUT URL to upload directly to S3.

Environment:
- `BUCKET` — S3 bucket name (required)

Request (JSON body):
{
  "key": "path/to/file.txt",
  "contentType": "text/plain"
}

Response: `{ uploadUrl, key }` — upload with a standard HTTP PUT to `uploadUrl`.
