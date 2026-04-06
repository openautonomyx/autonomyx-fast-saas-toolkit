# RustFS (S3-Compatible Storage) Configuration

## Post-Setup Steps

1. **Access console**: https://storage-console.DOMAIN
2. **Log in** with RUSTFS_ACCESS_KEY and RUSTFS_SECRET_KEY
3. **Create buckets**: `uploads`, `avatars`, `exports`, `backups`
4. **Set bucket policies** (public-read for avatars, private for exports)

## SDK Integration

```typescript
// Install: npm install @aws-sdk/client-s3
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'https://storage.YOUR_DOMAIN',
  region: 'us-east-1', // Required but ignored by RustFS
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for S3-compatible storage
});

await s3.send(new PutObjectCommand({
  Bucket: 'uploads',
  Key: `${tenantId}/${filename}`,
  Body: fileBuffer,
}));
```

## Tenant-Scoped Storage

Prefix all object keys with `tenant_id/` to isolate storage per tenant.
The middleware can enforce this via presigned URL generation.
