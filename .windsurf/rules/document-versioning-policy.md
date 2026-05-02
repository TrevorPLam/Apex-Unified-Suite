---
trigger: model_decision
description: When a document is updated, version must increment; soft-delete of a document also marks all its versions as deleted.
---

# Document Versioning Policy Rule

## Purpose

Enforce that document updates automatically increment the version number and maintain complete version history. Additionally, ensure that soft-deleting a document marks all associated versions as deleted to maintain referential integrity.

## Core Versioning Requirements

### Version Increment Logic

**When a document is updated with new file content:**

1. **Content Comparison**: Check if new file content differs from current version
2. **Version Increment**: If content differs, increment version number
3. **Version History**: Preserve all previous versions with metadata
4. **Latest Reference**: Update document's latest_version_id reference
5. **Change Description**: Record reason for version change

### Soft Delete Propagation

**When a document is soft-deleted:**

1. **Document Status**: Mark document as inactive
2. **Version Status**: Mark all versions as inactive
3. **Access Control**: Prevent access to all versions of deleted document
4. **Audit Trail**: Log deletion event with affected versions

## Implementation Requirements

### Service Layer Implementation

```typescript
// src/services/DocumentVersioningService.ts
export class DocumentVersioningService {
  constructor(private db: Database) {}

  async updateDocument(
    documentId: string,
    updateData: UpdateDocumentRequest,
    tenantId: string,
    updatedBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Get current document and latest version
      const currentDocument = await this.getDocumentWithLatestVersion(
        tx,
        documentId,
        tenantId
      );

      if (!currentDocument) {
        throw new DocumentNotFoundError('Document not found');
      }

      let newVersionNumber = currentDocument.current_version;
      let shouldCreateNewVersion = false;

      // Check if file content changed
      if (updateData.file) {
        const newFileHash = this.calculateFileHash(updateData.file.buffer);
        const currentFileHash = currentDocument.latestVersion?.file_hash;

        if (currentFileHash !== newFileHash) {
          newVersionNumber = currentDocument.current_version + 1;
          shouldCreateNewVersion = true;

          // Mark previous version as not latest
          await tx.update(documentVersions)
            .set({ is_latest: false })
            .where(and(
              eq(documentVersions.document_id, documentId),
              eq(documentVersions.is_latest, true)
            ));

          // Create new version
          const filePath = await this.storageService.uploadFile(
            tenantId,
            documentId,
            newVersionNumber,
            updateData.file.buffer,
            updateData.file.originalName
          );

          await tx.insert(documentVersions).values({
            tenantId,
            documentId,
            versionNumber: newVersionNumber,
            filePath,
            fileSize: updateData.file.size,
            fileHash: newFileHash,
            mimeType: updateData.file.mimeType,
            uploadedBy: updatedBy,
            changeDescription: updateData.changeDescription || `Version ${newVersionNumber}`,
            isLatest: true,
            storageMetadata: await this.storageService.getFileMetadata(filePath)
          });
        }
      }

      // Update document metadata
      const updatedDocument = await tx.update(documents)
        .set({
          name: updateData.name || currentDocument.name,
          description: updateData.description !== undefined 
            ? updateData.description 
            : currentDocument.description,
          currentVersion: newVersionNumber,
          latestVersionId: shouldCreateNewVersion 
            ? sql`(
              SELECT id FROM document_versions 
              WHERE document_id = ${documentId} AND version_number = ${newVersionNumber}
            )`
            : currentDocument.latest_version_id,
          tags: updateData.tags || currentDocument.tags,
          metadata: updateData.metadata || currentDocument.metadata,
          updatedBy,
          updatedAt: new Date()
        })
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId)
        ))
        .returning();

      // Emit domain event
      await this.emitEvent(shouldCreateNewVersion ? 'DocumentVersionCreated' : 'DocumentUpdated', {
        documentId,
        versionNumber: newVersionNumber,
        updatedBy,
        changeDescription: updateData.changeDescription
      });

      return updatedDocument[0];
    });
  }

  async softDeleteDocument(
    documentId: string,
    tenantId: string,
    deletedBy: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Get document to verify existence
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
        throw new DocumentNotFoundError('Document not found or already deleted');
      }

      // Mark document as inactive
      await tx.update(documents)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: deletedBy
        })
        .where(eq(documents.id, documentId));

      // Mark all versions as inactive
      await tx.update(documentVersions)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(documentVersions.document_id, documentId),
          eq(documentVersions.tenant_id, tenantId),
          eq(documentVersions.is_active, true)
        ));

      // Get affected version count for audit
      const affectedVersions = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(documentVersions)
        .where(and(
          eq(documentVersions.document_id, documentId),
          eq(documentVersions.tenant_id, tenantId)
        ));

      // Emit domain event
      await this.emitEvent('DocumentDeleted', {
        documentId,
        deletedBy,
        affectedVersionCount: affectedVersions[0].count
      });
    });
  }

  async restoreDocument(
    documentId: string,
    tenantId: string,
    restoredBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Mark document as active
      await tx.update(documents)
        .set({
          isActive: true,
          updatedAt: new Date(),
          updatedBy: restoredBy
        })
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId),
          eq(documents.is_active, false)
        ));

      // Mark all versions as active
      await tx.update(documentVersions)
        .set({
          isActive: true,
          updatedAt: new Date()
        })
        .where(and(
          eq(documentVersions.document_id, documentId),
          eq(documentVersions.tenant_id, tenantId),
          eq(documentVersions.is_active, false)
        ));

      // Get restored document
      const restoredDocument = await tx
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      // Emit domain event
      await this.emitEvent('DocumentRestored', {
        documentId,
        restoredBy
      });

      return restoredDocument[0];
    });
  }

  private async getDocumentWithLatestVersion(
    tx: Database,
    documentId: string,
    tenantId: string
  ): Promise<any> {
    const result = await tx
      .select({
        id: documents.id,
        name: documents.name,
        description: documents.description,
        currentVersion: documents.current_version,
        isActive: documents.is_active,
        tags: documents.tags,
        metadata: documents.metadata,
        latestVersion: {
          id: documentVersions.id,
          versionNumber: documentVersions.version_number,
          fileHash: documentVersions.file_hash,
          filePath: documentVersions.file_path,
          fileSize: documentVersions.file_size,
          mimeType: documentVersions.mime_type,
          isLatest: documentVersions.is_latest
        }
      })
      .from(documents)
      .leftJoin(
        documentVersions,
        and(
          eq(documentVersions.document_id, documents.id),
          eq(documentVersions.is_latest, true)
        )
      )
      .where(and(
        eq(documents.id, documentId),
        eq(documents.tenant_id, tenantId)
      ))
      .limit(1);

    return result[0];
  }

  private calculateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
```

### Database Schema Constraints

```sql
-- Documents table with versioning support
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  folder_id UUID REFERENCES document_folders(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_type VARCHAR(50) NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  latest_version_id UUID REFERENCES document_versions(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Document versions table
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  change_description TEXT,
  is_latest BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  storage_provider VARCHAR(50) DEFAULT 'local',
  storage_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Constraints to ensure data integrity
ALTER TABLE documents 
  ADD CONSTRAINT fk_documents_latest_version 
    FOREIGN KEY (latest_version_id) REFERENCES document_versions(id);

CREATE UNIQUE INDEX idx_document_versions_unique ON document_versions(document_id, version_number);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_latest ON document_versions(document_id, is_latest);
CREATE INDEX idx_document_versions_active ON document_versions(is_active);
CREATE INDEX idx_document_versions_hash ON document_versions(file_hash);
```

### API Endpoint Implementation

```typescript
// PUT /api/documents/:id
router.put('/:id', 
  upload.single('file'),
  validateRequest(updateDocumentSchema),
  async (req, res, next) => {
    try {
      const updateData = {
        ...req.body,
        file: req.file ? {
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        } : undefined
      };

      const document = await documentVersioningService.updateDocument(
        req.params.id,
        updateData,
        req.tenant.id,
        req.user.id
      );

      res.json({ document });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/documents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await documentVersioningService.softDeleteDocument(
      req.params.id,
      req.tenant.id,
      req.user.id
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/documents/:id/restore
router.post('/:id/restore', async (req, res, next) => {
  try {
    const document = await documentVersioningService.restoreDocument(
      req.params.id,
      req.tenant.id,
      req.user.id
    );

    res.json({ document });
  } catch (error) {
    next(error);
  }
});
```

### Domain Error Classes

```typescript
export class DocumentVersioningError extends DomainError {
  constructor(message: string, public readonly details?: any) {
    super('DOCUMENT_VERSIONING_ERROR', message, details);
  }
}

export class DuplicateContentError extends DocumentVersioningError {
  constructor(documentId: string) {
    super('Document with identical content already exists', { documentId });
  }
}

export class VersionLimitExceededError extends DocumentVersioningError {
  constructor(currentVersion: number, maxVersions: number) {
    super('Maximum version limit exceeded', {
      currentVersion,
      maxVersions
    });
  }
}
```

### Frontend Integration

```typescript
// React component for document upload with versioning
export const DocumentUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [versionHistory, setVersionHistory] = useState<DocumentVersion[]>([]);

  const handleFileUpload = async (file: File, changeDescription?: string) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('changeDescription', changeDescription || '');

      const response = await updateDocument(documentId, formData);
      
      // Refresh version history
      await fetchVersionHistory();
      
      showSuccessMessage(`Document updated to version ${response.current_version}`);
    } catch (error) {
      if (error instanceof DuplicateContentError) {
        showWarningMessage('No changes detected - file content is identical to current version');
      } else {
        showErrorMessage('Failed to upload document');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('This will delete the document and all its versions. Continue?')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      showSuccessMessage('Document deleted successfully');
      onDocumentDeleted();
    } catch (error) {
      showErrorMessage('Failed to delete document');
    }
  };

  return (
    <div>
      <div className="version-info">
        <h3>Current Version: {document.currentVersion}</h3>
        <p>Updated: {formatDate(document.updatedAt)}</p>
      </div>

      <FileUpload
        onUpload={handleFileUpload}
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        disabled={uploading}
      />

      <div className="version-history">
        <h4>Version History</h4>
        {versionHistory.map(version => (
          <VersionCard
            key={version.id}
            version={version}
            onDownload={() => downloadVersion(version.id)}
          />
        ))}
      </div>

      <div className="document-actions">
        <button onClick={handleDelete} className="danger">
          Delete Document
        </button>
      </div>
    </div>
  );
};
```

## Testing Requirements

### Unit Tests

**Test version increment logic:**

```typescript
describe('Document Versioning', () => {
  test('should increment version when content changes', async () => {
    const document = await createDocument();
    const newFile = createMockFile('New content');

    const updated = await updateDocument(document.id, {
      file: newFile,
      changeDescription: 'Updated content'
    });

    expect(updated.currentVersion).toBe(2);
  });

  test('should not increment version when content is identical', async () => {
    const document = await createDocument();
    const sameFile = document.file; // Same content

    await expect(
      updateDocument(document.id, { file: sameFile })
    ).rejects.toThrow(DuplicateContentError);
  });

  test('should mark all versions as inactive when document is deleted', async () => {
    const document = await createDocument();
    // Create multiple versions
    await createVersion(document.id, 2);
    await createVersion(document.id, 3);

    await softDeleteDocument(document.id);

    const versions = await getDocumentVersions(document.id);
    expect(versions.every(v => !v.isActive)).toBe(true);
  });
});
```

### Integration Tests

**Test end-to-end versioning workflow:**

1. **Document Creation**: Initial version creation
2. **Multiple Updates**: Sequential version increments
3. **Version History**: Complete version history tracking
4. **Soft Delete**: Version status propagation
5. **Document Restoration**: Version restoration

### Edge Cases

**Test these scenarios:**

1. **Concurrent Updates**: Handle simultaneous document updates
2. **Large Files**: Version management for large file uploads
3. **Version Limits**: Maximum version count enforcement
4. **Storage Failures**: Handle storage provider failures

## Performance Considerations

### Efficient Version Queries

```typescript
// Optimized query for document with latest version
private async getDocumentWithLatestVersionOptimized(
  tx: Database,
  documentId: string,
  tenantId: string
): Promise<any> {
  return await tx
    .select({
      id: documents.id,
      name: documents.name,
      currentVersion: documents.current_version,
      latestVersion: {
        id: documentVersions.id,
        versionNumber: documentVersions.version_number,
        fileHash: documentVersions.file_hash
      }
    })
    .from(documents)
    .innerJoin(
      documentVersions,
      sql`${documentVersions.id} = (
        SELECT id FROM document_versions 
        WHERE document_id = ${documentId} AND is_latest = true
      )`
    )
    .where(and(
      eq(documents.id, documentId),
      eq(documents.tenant_id, tenantId)
    ))
    .limit(1);
}
```

## Enforcement Checklist

- [ ] Document updates increment version number when content changes
- [ ] Duplicate content detection prevents unnecessary version creation
- [ ] Soft delete marks all versions as inactive
- [ ] Version history is maintained with complete metadata
- [ ] Latest version reference is always accurate
- [ ] Database constraints ensure referential integrity
- [ ] API endpoints enforce versioning policies
- [ ] Frontend shows clear version information
- [ ] Comprehensive test coverage for versioning scenarios
- [ ] Performance optimization for version queries
- [ ] Audit logging for all versioning operations
- [ ] Error handling for versioning edge cases
- [ ] Storage provider integration for version files
