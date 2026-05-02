---
name: document-version-management
description: Implement document versioning system with version bump on file upload, version history tracking, and expose GET /documents/{id}/versions endpoint.
---

# Document Version Management Implementation

## Overview

This skill guides the implementation of a comprehensive document versioning system that automatically increments version numbers on file uploads, maintains complete version history, and provides access to all document versions through API endpoints.

## Core Architecture

### 1. Database Schema Design

#### Documents Table (Enhanced)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  folder_id UUID REFERENCES document_folders(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_type VARCHAR(50) NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  latest_version_id UUID, -- References the latest version in document_versions
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_name ON documents(name);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
```

#### Document Versions Table
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
  mime_type VARCHAR(100) NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  change_description TEXT,
  is_latest BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  storage_provider VARCHAR(50) DEFAULT 'local', -- 'local', 's3', 'r2', etc.
  storage_metadata JSONB, -- Provider-specific metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_document_versions_unique ON document_versions(document_id, version_number);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_latest ON document_versions(document_id, is_latest);
CREATE INDEX idx_document_versions_hash ON document_versions(file_hash);
CREATE INDEX idx_document_versions_tenant ON document_versions(tenant_id);
```

#### Document Version Access Log Table
```sql
CREATE TABLE document_version_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES portal_clients(id), -- For portal access
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'preview')),
  ip_address INET,
  user_agent TEXT,
  access_date TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_document_access_log_document ON document_version_access_log(document_id);
CREATE INDEX idx_document_access_log_version ON document_version_access_log(version_id);
CREATE INDEX idx_document_access_log_date ON document_version_access_log(access_date);
CREATE INDEX idx_document_access_log_tenant ON document_version_access_log(tenant_id);
```

### 2. Document Version Service

```typescript
// src/services/DocumentVersionService.ts
import { Database } from 'drizzle-orm';
import { documents, documentVersions, documentVersionAccessLog } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import { DocumentNotFoundError, VersionConflictError } from '../domain/errors';
import { StorageService } from './StorageService';

export interface CreateDocumentRequest {
  name: string;
  description?: string;
  folderId?: string;
  file: FileUpload;
  changeDescription?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDocumentRequest {
  name?: string;
  description?: string;
  file?: FileUpload;
  changeDescription?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  uploadedBy: string;
  changeDescription?: string;
  isLatest: boolean;
  downloadCount: number;
}

export class DocumentVersionService {
  constructor(
    private db: Database,
    private storageService: StorageService
  ) {}

  /**
   * Create a new document with initial version
   */
  async createDocument(
    request: CreateDocumentRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Calculate file hash
      const fileHash = this.calculateFileHash(request.file.buffer);

      // Check for duplicate files (same hash)
      const existingVersion = await tx
        .select()
        .from(documentVersions)
        .where(and(
          eq(documentVersions.tenant_id, tenantId),
          eq(documentVersions.file_hash, fileHash)
        ))
        .limit(1);

      if (existingVersion[0]) {
        throw new VersionConflictError('A document with identical content already exists');
      }

      // Create document record
      const document = await tx.insert(documents).values({
        tenantId,
        folderId: request.folderId,
        name: request.name,
        description: request.description,
        fileType: this.getFileType(request.file.originalName),
        currentVersion: 1,
        tags: request.tags || [],
        metadata: request.metadata || {},
        createdBy
      }).returning();

      const createdDocument = document[0];

      // Upload file to storage
      const filePath = await this.storageService.uploadFile(
        tenantId,
        createdDocument.id,
        1,
        request.file.buffer,
        request.file.originalName
      );

      // Create initial version
      const version = await tx.insert(documentVersions).values({
        tenantId,
        documentId: createdDocument.id,
        versionNumber: 1,
        filePath,
        fileSize: request.file.size,
        fileHash,
        mimeType: request.file.mimeType,
        uploadedBy: createdBy,
        changeDescription: request.changeDescription || 'Initial version',
        isLatest: true,
        storageMetadata: await this.storageService.getFileMetadata(filePath)
      }).returning();

      const createdVersion = version[0];

      // Update document with latest version reference
      await tx.update(documents)
        .set({
          latestVersionId: createdVersion.id,
          updatedAt: new Date()
        })
        .where(eq(documents.id, createdDocument.id));

      // Emit domain event
      await this.emitEvent('DocumentCreated', {
        documentId: createdDocument.id,
        versionId: createdVersion.id,
        versionNumber: 1,
        createdBy
      });

      return createdDocument;
    });
  }

  /**
   * Update document with new version
   */
  async updateDocument(
    documentId: string,
    request: UpdateDocumentRequest,
    tenantId: string,
    updatedBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Get current document
      const document = await tx
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId),
          eq(documents.is_active, true)
        ))
        .limit(1);

      if (!document[0]) {
        throw new DocumentNotFoundError('Document not found');
      }

      const currentDocument = document[0];
      let newVersionNumber = currentDocument.current_version;

      // If new file is provided, create new version
      if (request.file) {
        // Calculate file hash
        const fileHash = this.calculateFileHash(request.file.buffer);

        // Check if this is actually a new version (different content)
        const latestVersion = await tx
          .select()
          .from(documentVersions)
          .where(and(
            eq(documentVersions.document_id, documentId),
            eq(documentVersions.is_latest, true)
          ))
          .limit(1);

        if (latestVersion[0] && latestVersion[0].file_hash === fileHash) {
          throw new VersionConflictError('New version has identical content to current version');
        }

        newVersionNumber = currentDocument.current_version + 1;

        // Upload new file to storage
        const filePath = await this.storageService.uploadFile(
          tenantId,
          documentId,
          newVersionNumber,
          request.file.buffer,
          request.file.originalName
        );

        // Mark previous version as not latest
        await tx.update(documentVersions)
          .set({
            isLatest: false
          })
          .where(and(
            eq(documentVersions.document_id, documentId),
            eq(documentVersions.is_latest, true)
          ));

        // Create new version
        const newVersion = await tx.insert(documentVersions).values({
          tenantId,
          documentId,
          versionNumber: newVersionNumber,
          filePath,
          fileSize: request.file.size,
          fileHash,
          mimeType: request.file.mimeType,
          uploadedBy: updatedBy,
          changeDescription: request.changeDescription || `Version ${newVersionNumber}`,
          isLatest: true,
          storageMetadata: await this.storageService.getFileMetadata(filePath)
        }).returning();

        // Emit domain event
        await this.emitEvent('DocumentVersionCreated', {
          documentId,
          versionId: newVersion[0].id,
          versionNumber: newVersionNumber,
          previousVersionNumber: currentDocument.current_version,
          updatedBy
        });
      }

      // Update document metadata
      const updatedDocument = await tx.update(documents)
        .set({
          name: request.name || currentDocument.name,
          description: request.description !== undefined ? request.description : currentDocument.description,
          currentVersion: newVersionNumber,
          tags: request.tags || currentDocument.tags,
          metadata: request.metadata || currentDocument.metadata,
          updatedBy,
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId))
        .returning();

      return updatedDocument[0];
    });
  }

  /**
   * Get all versions of a document
   */
  async getDocumentVersions(
    documentId: string,
    tenantId: string
  ): Promise<DocumentVersion[]> {
    const versions = await this.db
      .select({
        id: documentVersions.id,
        documentId: documentVersions.document_id,
        versionNumber: documentVersions.version_number,
        fileName: sql<string>`COALESCE(${documents.name}, 'Untitled') || ' v' || ${documentVersions.version_number}`,
        fileSize: documentVersions.file_size,
        mimeType: documentVersions.mime_type,
        uploadDate: documentVersions.upload_date,
        uploadedBy: documentVersions.uploaded_by,
        changeDescription: documentVersions.change_description,
        isLatest: documentVersions.is_latest,
        downloadCount: documentVersions.download_count
      })
      .from(documentVersions)
      .leftJoin(documents, eq(documentVersions.document_id, documents.id))
      .where(and(
        eq(documentVersions.document_id, documentId),
        eq(documentVersions.tenant_id, tenantId)
      ))
      .orderBy(desc(documentVersions.version_number));

    return versions.map(v => ({
      id: v.id,
      documentId: v.documentId,
      versionNumber: v.versionNumber,
      fileName: v.fileName,
      fileSize: v.fileSize,
      mimeType: v.mimeType,
      uploadDate: v.uploadDate,
      uploadedBy: v.uploadedBy,
      changeDescription: v.changeDescription,
      isLatest: v.isLatest,
      downloadCount: v.downloadCount
    }));
  }

  /**
   * Get specific version of a document
   */
  async getDocumentVersion(
    documentId: string,
    versionNumber: number,
    tenantId: string
  ): Promise<DocumentVersion | null> {
    const version = await this.db
      .select({
        id: documentVersions.id,
        documentId: documentVersions.document_id,
        versionNumber: documentVersions.version_number,
        fileName: sql<string>`COALESCE(${documents.name}, 'Untitled') || ' v' || ${documentVersions.version_number}`,
        fileSize: documentVersions.file_size,
        mimeType: documentVersions.mime_type,
        uploadDate: documentVersions.upload_date,
        uploadedBy: documentVersions.uploaded_by,
        changeDescription: documentVersions.change_description,
        isLatest: documentVersions.is_latest,
        downloadCount: documentVersions.download_count
      })
      .from(documentVersions)
      .leftJoin(documents, eq(documentVersions.document_id, documents.id))
      .where(and(
        eq(documentVersions.document_id, documentId),
        eq(documentVersions.version_number, versionNumber),
        eq(documentVersions.tenant_id, tenantId)
      ))
      .limit(1);

    return version[0] ? {
      id: version[0].id,
      documentId: version[0].documentId,
      versionNumber: version[0].versionNumber,
      fileName: version[0].fileName,
      fileSize: version[0].fileSize,
      mimeType: version[0].mime_type,
      uploadDate: version[0].upload_date,
      uploadedBy: version[0].uploadedBy,
      changeDescription: version[0].changeDescription,
      isLatest: version[0].is_latest,
      downloadCount: version[0].downloadCount
    } : null;
  }

  /**
   * Download a specific version of a document
   */
  async downloadDocumentVersion(
    documentId: string,
    versionNumber: number,
    tenantId: string,
    userId?: string,
    clientId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ stream: NodeJS.ReadableStream; fileName: string; mimeType: string }> {
    const version = await this.getDocumentVersion(documentId, versionNumber, tenantId);

    if (!version) {
      throw new DocumentNotFoundError('Document version not found');
    }

    // Get file from storage
    const fileStream = await this.storageService.getFileStream(version.id);

    // Log access
    await this.logVersionAccess({
      tenantId,
      documentId,
      versionId: version.id,
      userId,
      clientId,
      accessType: 'download',
      ipAddress,
      userAgent
    });

    // Increment download count
    await this.db.update(documentVersions)
      .set({
        downloadCount: sql`${documentVersions.download_count} + 1`
      })
      .where(eq(documentVersions.id, version.id));

    return {
      stream: fileStream,
      fileName: version.fileName,
      mimeType: version.mimeType
    };
  }

  /**
   * Soft delete a document (mark as inactive, delete all versions)
   */
  async deleteDocument(
    documentId: string,
    tenantId: string,
    deletedBy: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Get document
      const document = await tx
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId),
          eq(documents.is_active, true)
        ))
        .limit(1);

      if (!document[0]) {
        throw new DocumentNotFoundError('Document not found');
      }

      // Mark document as inactive
      await tx.update(documents)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: deletedBy
        })
        .where(eq(documents.id, documentId));

      // Get all versions to delete from storage
      const versions = await tx
        .select({ filePath: documentVersions.file_path })
        .from(documentVersions)
        .where(eq(documentVersions.document_id, documentId));

      // Delete files from storage
      for (const version of versions) {
        await this.storageService.deleteFile(version.filePath);
      }

      // Delete version records
      await tx.delete(documentVersions)
        .where(eq(documentVersions.document_id, documentId));

      // Emit domain event
      await this.emitEvent('DocumentDeleted', {
        documentId,
        deletedBy,
        versionCount: versions.length
      });
    });
  }

  /**
   * Restore a document version (create new document from version)
   */
  async restoreDocumentVersion(
    versionId: string,
    newName: string,
    tenantId: string,
    restoredBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Get version details
      const version = await tx
        .select({
          documentId: documentVersions.document_id,
          versionNumber: documentVersions.version_number,
          filePath: documentVersions.file_path,
          fileSize: documentVersions.file_size,
          fileHash: documentVersions.file_hash,
          mimeType: documentVersions.mime_type,
          originalDocument: sql<any>`
            (
              SELECT ${documents}
              FROM ${documents}
              WHERE ${documents.id} = ${documentVersions.document_id}
            )
          `
        })
        .from(documentVersions)
        .where(and(
          eq(documentVersions.id, versionId),
          eq(documentVersions.tenant_id, tenantId)
        ))
        .limit(1);

      if (!version[0]) {
        throw new DocumentNotFoundError('Document version not found');
      }

      // Create new document
      const newDocument = await tx.insert(documents).values({
        tenantId,
        name: newName,
        description: `Restored from version ${version[0].versionNumber}`,
        fileType: this.getFileTypeFromMimeType(version[0].mimeType),
        currentVersion: 1,
        tags: version[0].originalDocument?.tags || [],
        metadata: {
          restoredFrom: {
            documentId: version[0].documentId,
            versionId: versionId,
            versionNumber: version[0].versionNumber,
            restoredAt: new Date(),
            restoredBy
          }
        },
        createdBy: restoredBy
      }).returning();

      const createdDocument = newDocument[0];

      // Copy file in storage
      const newFilePath = await this.storageService.copyFile(
        version[0].filePath,
        tenantId,
        createdDocument.id,
        1
      );

      // Create new version
      const newVersion = await tx.insert(documentVersions).values({
        tenantId,
        documentId: createdDocument.id,
        versionNumber: 1,
        filePath: newFilePath,
        fileSize: version[0].fileSize,
        fileHash: version[0].fileHash,
        mimeType: version[0].mimeType,
        uploadedBy: restoredBy,
        changeDescription: `Restored from document ${version[0].documentId} version ${version[0].versionNumber}`,
        isLatest: true,
        storageMetadata: await this.storageService.getFileMetadata(newFilePath)
      }).returning();

      // Update document with latest version reference
      await tx.update(documents)
        .set({
          latestVersionId: newVersion[0].id,
          updatedAt: new Date()
        })
        .where(eq(documents.id, createdDocument.id));

      return createdDocument;
    });
  }

  /**
   * Calculate SHA-256 hash of file buffer
   */
  private calculateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  /**
   * Get file type from MIME type
   */
  private getFileTypeFromMimeType(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif'
    };

    return typeMap[mimeType] || 'unknown';
  }

  /**
   * Log version access
   */
  private async logVersionAccess(logData: {
    tenantId: string;
    documentId: string;
    versionId: string;
    userId?: string;
    clientId?: string;
    accessType: 'view' | 'download' | 'preview';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.db.insert(documentVersionAccessLog).values({
      tenantId: logData.tenantId,
      documentId: logData.documentId,
      versionId: logData.versionId,
      userId: logData.userId,
      clientId: logData.clientId,
      accessType: logData.accessType,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent
    });
  }

  /**
   * Emit domain events
   */
  private async emitEvent(eventName: string, data: any): Promise<void> {
    // Implementation depends on your event system
    console.log(`Emitting event: ${eventName}`, data);
  }
}
```

### 3. API Endpoints

```typescript
// src/routes/documents.ts
import { Router } from 'express';
import { DocumentVersionService } from '../services/DocumentVersionService';
import { validateRequest } from '../middleware/validation';
import { createDocumentSchema, updateDocumentSchema } from '../schemas/documents';

const router = Router();

// POST /api/documents - Create document with version
router.post('/', validateRequest(createDocumentSchema), async (req, res, next) => {
  try {
    const document = await documentVersionService.createDocument(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

// PUT /api/documents/:id - Update document with new version
router.put('/:id', validateRequest(updateDocumentSchema), async (req, res, next) => {
  try {
    const document = await documentVersionService.updateDocument(
      req.params.id,
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.json({ document });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/versions - Get all versions of a document
router.get('/:id/versions', async (req, res, next) => {
  try {
    const versions = await documentVersionService.getDocumentVersions(
      req.params.id,
      req.tenant.id
    );

    res.json({ versions });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/versions/:version - Get specific version
router.get('/:id/versions/:version', async (req, res, next) => {
  try {
    const version = await documentVersionService.getDocumentVersion(
      req.params.id,
      parseInt(req.params.version),
      req.tenant.id
    );

    if (!version) {
      return res.status(404).json({ error: 'Document version not found' });
    }

    res.json({ version });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/versions/:version/download - Download specific version
router.get('/:id/versions/:version/download', async (req, res, next) => {
  try {
    const { stream, fileName, mimeType } = await documentVersionService.downloadDocumentVersion(
      req.params.id,
      parseInt(req.params.version),
      req.tenant.id,
      req.user?.id,
      req.portalClient?.id,
      req.ip,
      req.get('User-Agent')
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// POST /api/documents/versions/:version/restore - Restore document from version
router.post('/versions/:versionId/restore', async (req, res, next) => {
  try {
    const document = await documentVersionService.restoreDocumentVersion(
      req.params.versionId,
      req.body.name,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id - Delete document and all versions
router.delete('/:id', async (req, res, next) => {
  try {
    await documentVersionService.deleteDocument(
      req.params.id,
      req.tenant.id,
      req.user.id
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
```

## Implementation Checklist

- [ ] Create document versioning database schema
- [ ] Implement DocumentVersionService with all core methods
- [ ] Add file hash calculation for duplicate detection
- [ ] Implement storage service integration
- [ ] Create version access logging
- [ ] Add document restoration functionality
- [ ] Create API endpoints for version management
- [ ] Add comprehensive error handling
- [ ] Implement file type detection
- [ ] Add audit logging for version changes
- [ ] Create integration tests for all scenarios
- [ ] Add monitoring for version operations

## Testing Requirements

### Unit Tests
- Test version creation and increment logic
- Test file hash calculation and duplicate detection
- Test version access logging
- Test document restoration

### Integration Tests
- Test end-to-end document versioning
- Test file upload and storage integration
- Test version download functionality
- Test concurrent version creation

### Edge Cases
- Test duplicate file upload handling
- Test storage failure scenarios
- Test version restoration with conflicts
- Test access control for different user types

## Security Considerations

- File hash verification prevents duplicate uploads
- Access logging for audit trails
- Proper authorization checks for all operations
- File type validation and malware scanning
- Tenant isolation enforced at database level
- Secure file storage with proper permissions

## Performance Optimizations

- Efficient file hash calculation
- Storage provider optimization
- Database indexes on version queries
- Streaming for large file downloads
- Caching for frequently accessed metadata

## Monitoring

- Track version creation success rates
- Monitor storage usage and performance
- Alert on duplicate file detection
- Track download patterns and access
- Monitor file upload processing times
