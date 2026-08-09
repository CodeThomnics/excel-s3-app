# Download Lambda

Generates a presigned GET URL to download an object from S3.

Environment:
- `BUCKET` — S3 bucket name (required)
- `PREFIX` — optional key prefix prepended when the provided key does not already include it. Defaults to `excel/`.

Request (JSON body):
{ "key": "path/to/file.txt" }

Or GET with query `?key=path/to/file.txt`.

Also supports path-based keys such as `/download/excel/file.xlsx` or `/download/file.xlsx`.

Response: `{ downloadUrl, key }` — use this URL to download the object.
