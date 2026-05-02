---
trigger: model_decision
description: Signed download/upload URLs must have a configurable expiry time and be generated through a single StorageAdapter method to ensure consistency.
---

# Presigned URL Standards Rule

## Purpose

Standardize the generation and management of presigned URLs for file uploads and downloads across the application. Ensure consistent expiry times, security policies, and centralized URL generation through a unified StorageAdapter interface.

## Core Requirements

### URL Generation Standards

**All presigned URLs must:**

1. **Use Centralized Method**: Generated through `StorageAdapter.generatePresignedUrl()`
2. **Configurable Expiry**: Default 15 minutes, configurable per use case
3. **Security Headers**: Include proper CORS and content security headers
4. **Consistent Format**: Standardized URL structure and parameters
5. **Access Control**: URLs respect user permissions and tenant isolation

### Expiry Time Standards

**Default expiry times by use case:**

- **File Upload**: 15 minutes (900 seconds)
- **File Download**: 15 minutes (900 seconds)
- **Document Preview**: 5 minutes (300 seconds)
- **Bulk Operations**: 30 minutes (1800 seconds)
- **Admin Operations**: 1 hour (3600 seconds)

## Implementation Requirements

### Storage Adapter Interface

```typescript
// src/services/storage/StorageAdapter.ts
export interface StorageAdapter {
  generatePresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrl>;
  uploadFile(file: UploadRequest): Promise<UploadResult>;
  downloadFile(fileId: string): Promise<DownloadResult>;
  deleteFile(fileId: string): Promise<void>;
  getFileMetadata(fileId: string): Promise<FileMetadata>;
}

export interface PresignedUrlOptions {
  operation: 'upload' | 'download' | 'preview';
  fileId: string;
  fileName?: string;
  contentType?: string;
  expiresIn?: number; // Seconds
  tenantId: string;
  userId?: string;
  permissions?: string[]; // Additional access controls
  metadata?: Record<string, any>;
}

export interface PresignedUrl {
  url: string;
  expiresAt: Date;
  headers: Record<string, string>;
  fileId: string;
  operation: string;
}
```

### Centralized URL Generation Service

```typescript
// src/services/PresignedUrlService.ts
export class PresignedUrlService {
  constructor(
    private storageAdapter: StorageAdapter,
    private permissionService: PermissionService
  ) {}

  async generateUploadUrl(
    fileId: string,
    fileName: string,
    contentType: string,
    tenantId: string,
    userId: string,
    expiresIn: number = 900 // 15 minutes default
  ): Promise<PresignedUrl> {
    // Validate user permissions for upload
    await this.permissionService.checkUploadPermission(
      tenantId,
      userId,
      fileId
    );

    const options: PresignedUrlOptions = {
      operation: 'upload',
      fileId,
      fileName,
      contentType,
      expiresIn,
      tenantId,
      userId,
      metadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    };

    return await this.storageAdapter.generatePresignedUrl(options);
  }

  async generateDownloadUrl(
    fileId: string,
    tenantId: string,
    userId?: string,
    expiresIn: number = 900, // 15 minutes default
    clientContext?: PortalClientContext
  ): Promise<PresignedUrl> {
    // Check download permissions
    if (clientContext) {
      // Portal client permission check
      const hasPermission = await this.permissionService.checkPermission(
        clientContext,
        'document',
        fileId,
        'download'
      );

      if (!hasPermission) {
        throw new PortalAccessDeniedError('No download permission for this document');
      }
    } else {
      // Internal user permission check
      if (userId) {
        await this.permissionService.checkDownloadPermission(
          tenantId,
          userId,
          fileId
        );
      }
    }

    const options: PresignedUrlOptions = {
      operation: 'download',
      fileId,
      expiresIn,
      tenantId,
      userId,
      permissions: userId ? ['internal_download'] : ['portal_download']
    };

    return await this.storageAdapter.generatePresignedUrl(options);
  }

  async generatePreviewUrl(
    fileId: string,
    tenantId: string,
    userId?: string,
    expiresIn: number = 300 // 5 minutes default for preview
  ): Promise<PresignedUrl> {
    // Preview URLs require view permission
    if (userId) {
      await this.permissionService.checkViewPermission(
        tenantId,
        userId,
        fileId
      );
    }

    const options: PresignedUrlOptions = {
      operation: 'preview',
      fileId,
      expiresIn,
      tenantId,
      userId,
      permissions: ['preview']
    };

    return await this.storageAdapter.generatePresignedUrl(options);
  }

  async generateBulkDownloadUrls(
    fileIds: string[],
    tenantId: string,
    userId: string,
    expiresIn: number = 1800 // 30 minutes for bulk operations
  ): Promise<PresignedUrl[]> {
    // Check bulk download permission
    await this.permissionService.checkBulkDownloadPermission(
      tenantId,
      userId,
      fileIds
    );

    const urls: PresignedUrl[] = [];

    for (const fileId of fileIds) {
      try {
        const url = await this.generateDownloadUrl(
          fileId,
          tenantId,
          userId,
          expiresIn
        );
        urls.push(url);
      } catch (error) {
        // Log error but continue with other files
        console.error(`Failed to generate download URL for file ${fileId}:`, error);
      }
    }

    return urls;
  }

  async validatePresignedUrl(
    url: string,
    operation: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      // Extract URL components (implementation depends on storage provider)
      const urlComponents = this.parsePresignedUrl(url);
      
      // Validate expiry
      if (urlComponents.expiresAt < new Date()) {
        return false;
      }

      // Validate operation
      if (urlComponents.operation !== operation) {
        return false;
      }

      // Validate tenant (if embedded in URL)
      if (urlComponents.tenantId && urlComponents.tenantId !== tenantId) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private parsePresignedUrl(url: string): PresignedUrlComponents {
    // Implementation depends on storage provider (S3, R2, etc.)
    // This is a placeholder for the actual parsing logic
    const urlParams = new URL(url).searchParams;
    
    return {
      fileId: urlParams.get('X-Amz-Server-Side-Encryption-Aws-Kms-Key-Id') || '',
      operation: urlParams.get('X-Amz-Algorithm')?.includes('upload') ? 'upload' : 'download',
      expiresAt: new Date(urlParams.get('X-Amz-Expires') || ''),
      tenantId: urlParams.get('X-Amz-Meta-Tenant-Id') || ''
    };
  }
}
```

### S3 Storage Adapter Implementation

```typescript
// src/services/storage/S3StorageAdapter.ts
export class S3StorageAdapter implements StorageAdapter {
  constructor(
    private s3Client: AWS.S3,
    private bucketName: string
  ) {}

  async generatePresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrl> {
    const s3Params: AWS.S3.PresignedUrl.Params = {
      Bucket: this.bucketName,
      Key: this.buildFilePath(options),
      Expires: options.expiresIn || 900,
      ContentType: options.contentType,
      Metadata: {
        'tenant-id': options.tenantId,
        'user-id': options.userId || '',
        'operation': options.operation,
        ...options.metadata
      }
    };

    let url: string;
    let headers: Record<string, string> = {};

    switch (options.operation) {
      case 'upload':
        url = await this.s3Client.getSignedUrlPromise('putObject', s3Params);
        headers = {
          'Content-Type': options.contentType || 'application/octet-stream',
          'x-amz-meta-tenant-id': options.tenantId,
          'x-amz-meta-user-id': options.userId || '',
          'x-amz-acl': 'private'
        };
        break;

      case 'download':
        url = await this.s3Client.getSignedUrlPromise('getObject', s3Params);
        headers = {
          'Content-Disposition': `attachment; filename="${options.fileName || 'download'}"`,
          'Cache-Control': 'no-cache'
        };
        break;

      case 'preview':
        url = await this.s3Client.getSignedUrlPromise('getObject', {
          ...s3Params,
          ResponseContentType: 'application/pdf',
          ResponseContentDisposition: `inline; filename="${options.fileName || 'preview'}"`
        });
        headers = {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${options.fileName || 'preview'}"`
        };
        break;

      default:
        throw new Error(`Unsupported operation: ${options.operation}`);
    }

    return {
      url,
      expiresAt: new Date(Date.now() + (options.expiresIn || 900) * 1000),
      headers,
      fileId: options.fileId,
      operation: options.operation
    };
  }

  private buildFilePath(options: PresignedUrlOptions): string {
    return `${options.tenantId}/${options.fileId}`;
  }
}
```

### API Endpoint Implementation

```typescript
// src/routes/documents.ts
router.get('/:id/download-url', async (req, res, next) => {
  try {
    const { expiresIn } = req.query;
    
    const presignedUrl = await presignedUrlService.generateDownloadUrl(
      req.params.id,
      req.tenant.id,
      req.user?.id,
      expiresIn ? parseInt(expiresIn as string) : undefined
    );

    res.json({
      url: presignedUrl.url,
      expiresAt: presignedUrl.expiresAt,
      fileId: presignedUrl.fileId,
      headers: presignedUrl.headers
    });
  } catch (error) {
    if (error instanceof PortalAccessDeniedError) {
      return res.status(403).json({
        error: error.message,
        code: error.code
      });
    }
    next(error);
  }
});

router.post('/:id/upload-url', validateRequest(uploadUrlSchema), async (req, res, next) => {
  try {
    const { fileName, contentType, expiresIn } = req.body;
    
    const fileId = randomUUID();
    const presignedUrl = await presignedUrlService.generateUploadUrl(
      fileId,
      fileName,
      contentType,
      req.tenant.id,
      req.user.id,
      expiresIn
    );

    res.status(201).json({
      url: presignedUrl.url,
      expiresAt: presignedUrl.expiresAt,
      fileId: presignedUrl.fileId,
      headers: presignedUrl.headers,
      uploadMethod: 'PUT'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/preview-url', async (req, res, next) => {
  try {
    const presignedUrl = await presignedUrlService.generatePreviewUrl(
      req.params.id,
      req.tenant.id,
      req.user?.id
    );

    res.json({
      url: presignedUrl.url,
      expiresAt: presignedUrl.expiresAt,
      fileId: presignedUrl.fileId,
      headers: presignedUrl.headers
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bulk-download-urls', validateRequest(bulkDownloadSchema), async (req, res, next) => {
  try {
    const { fileIds, expiresIn } = req.body;
    
    const presignedUrls = await presignedUrlService.generateBulkDownloadUrls(
      fileIds,
      req.tenant.id,
      req.user.id,
      expiresIn
    );

    res.json({
      urls: presignedUrls,
      total: presignedUrls.length,
      requested: fileIds.length
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for file upload with presigned URLs
export const FileUploader: React.FC<{ onUploadComplete: (fileId: string) => void }> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned upload URL
      const uploadUrlResponse = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          expiresIn: 900 // 15 minutes
        })
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, fileId, headers } = await uploadUrlResponse.json();

      // Step 2: Upload file to presigned URL
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setUploadProgress((event.loaded / event.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          onUploadComplete(fileId);
          setUploadProgress(100);
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed');
      });

      xhr.open('PUT', url);
      
      // Set required headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(file);

    } catch (error) {
      console.error('Upload failed:', error);
      showErrorMessage('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        disabled={uploading}
      />
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span>{Math.round(uploadProgress)}%</span>
        </div>
      )}
    </div>
  );
};

// Component for file download with presigned URLs
export const FileDownloader: React.FC<{ fileId: string; fileName: string }> = ({ 
  fileId, 
  fileName 
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);

    try {
      // Get presigned download URL
      const downloadUrlResponse = await fetch(`/api/documents/${fileId}/download-url`);
      
      if (!downloadUrlResponse.ok) {
        throw new Error('Failed to get download URL');
      }

      const { url, headers } = await downloadUrlResponse.json();

      // Download file using presigned URL
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      
      // Add security headers if needed
      Object.entries(headers).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Download failed:', error);
      showErrorMessage('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={downloading}
      className="download-button"
    >
      {downloading ? 'Downloading...' : `Download ${fileName}`}
    </button>
  );
};
```

## Testing Requirements

### Unit Tests

**Test presigned URL generation:**

```typescript
describe('PresignedUrlService', () => {
  test('should generate upload URL with correct expiry', async () => {
    const url = await presignedUrlService.generateUploadUrl(
      'file-123',
      'test.pdf',
      'application/pdf',
      'tenant-1',
      'user-1',
      900 // 15 minutes
    );

    expect(url.operation).toBe('upload');
    expect(url.expiresAt).toBeInstanceOf(Date);
    expect(url.fileId).toBe('file-123');
    expect(url.headers['Content-Type']).toBe('application/pdf');
  });

  test('should validate expired URLs', async () => {
    const expiredUrl = createExpiredPresignedUrl();
    
    const isValid = await presignedUrlService.validatePresignedUrl(
      expiredUrl.url,
      'download',
      'tenant-1'
    );

    expect(isValid).toBe(false);
  });

  test('should check permissions before URL generation', async () => {
    // Mock permission check failure
    permissionService.checkUploadPermission.mockRejectedValue(
      new PortalAccessDeniedError('No upload permission')
    );

    await expect(
      presignedUrlService.generateUploadUrl('file-123', 'test.pdf', 'application/pdf', 'tenant-1', 'user-1')
    ).rejects.toThrow(PortalAccessDeniedError);
  });
});
```

### Integration Tests

**Test end-to-end URL workflow:**

1. **Upload Flow**: Generate URL → Upload file → Verify file stored
2. **Download Flow**: Generate URL → Download file → Verify content
3. **Permission Check**: Unauthorized users can't generate URLs
4. **Expiry Handling**: URLs expire after configured time

### Security Tests

**Test security aspects:**

1. **URL Tampering**: Modified URLs are rejected
2. **Cross-Tenant Access**: Can't access other tenant's files
3. **Permission Bypass**: URLs respect current permissions
4. **Header Injection**: Headers are properly validated

## Security Considerations

### URL Security

```typescript
// URL validation middleware
export const validatePresignedUrl = (req: Request, res: Response, next: NextFunction) => {
  const { url, operation } = req.body;
  
  if (!url || !operation) {
    return res.status(400).json({ error: 'URL and operation required' });
  }

  // Validate URL format and signature
  if (!isValidPresignedUrlFormat(url)) {
    return res.status(400).json({ error: 'Invalid presigned URL format' });
  }

  // Validate operation matches URL purpose
  const urlOperation = extractOperationFromUrl(url);
  if (urlOperation !== operation) {
    return res.status(400).json({ error: 'URL operation mismatch' });
  }

  next();
};
```

### Access Control

- URLs are tenant-scoped
- User permissions are checked before URL generation
- URLs expire automatically
- File metadata includes access control information

## Performance Considerations

### URL Caching

```typescript
// Cache presigned URLs for short duration
private urlCache = new Map<string, PresignedUrl>();

async getCachedUrl(options: PresignedUrlOptions): Promise<PresignedUrl> {
  const cacheKey = this.buildCacheKey(options);
  
  if (this.urlCache.has(cacheKey)) {
    const cached = this.urlCache.get(cacheKey)!;
    
    // Return cached URL if not expired
    if (cached.expiresAt > new Date()) {
      return cached;
    } else {
      this.urlCache.delete(cacheKey);
    }
  }

  // Generate new URL and cache
  const url = await this.storageAdapter.generatePresignedUrl(options);
  this.urlCache.set(cacheKey, url);
  
  return url;
}
```

## Enforcement Checklist

- [ ] All presigned URLs generated through centralized StorageAdapter
- [ ] Default expiry time is 15 minutes for standard operations
- [ ] Expiry times are configurable per use case
- [ ] Permission checks performed before URL generation
- [ ] URLs include proper security headers
- [ ] Tenant isolation enforced in URL generation
- [ ] URL validation prevents tampering
- [ ] Comprehensive test coverage for URL workflows
- [ ] Performance optimization with URL caching
- [ ] Audit logging for URL generation events
- [ ] Error handling for URL generation failures
- [ ] Security monitoring for URL access patterns
