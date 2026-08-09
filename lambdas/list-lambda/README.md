# List Lambda

Simple AWS Lambda that lists objects in an S3 bucket.

Environment:
- `BUCKET` — S3 bucket name (required)

Example HTTP GET query with optional `prefix` query string:

Request: GET /
Response JSON: { items: [ { Key, LastModified, Size, ETag, StorageClass } ], isTruncated }
