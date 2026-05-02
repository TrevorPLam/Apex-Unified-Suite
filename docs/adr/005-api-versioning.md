# ADR-005: API Versioning Strategy

## Status
Accepted

## Date
2026-05-02

## Context
As the Apex Unified Suite evolves from prototype to production, we need a strategy for API versioning that enables:
- Safe evolution of API contracts without breaking existing clients
- Clear migration paths for frontend and external integrations
- Backward compatibility during transition periods

## Decision
We will implement API versioning using URL path prefixes starting with `/api/v1/` for all endpoints beginning in Phase 3.

### Versioning Policy
1. **Initial Version**: All Phase 3+ endpoints will use `/api/v1/` prefix
2. **Semantic Versioning**: Follow semver for API versions (v1.0.0, v1.1.0, v2.0.0)
3. **Backward Compatibility**: Maintain v1 endpoints for at least 6 months after v2 introduction
4. **Depreciation**: Use HTTP headers and response metadata to signal deprecation
5. **Documentation**: Each API version documented in separate OpenAPI spec files

### Implementation Strategy
- **Phase 3**: Introduce `/api/v1/` prefix for all new endpoints
- **Phase 4+**: Continue using `/api/v1/` prefix for consistency
- **Phase 6**: Implement version negotiation and multiple concurrent versions when needed

### URL Structure
```
/api/v1/auth/register
/api/v1/crm/leads
/api/v1/projects
/api/v1/portal/auth/request-link
```

### Version Negotiation (Future)
- `Accept: application/vnd.apex.v1+json` header support
- Fallback to latest stable version if no version specified
- Clear error responses for unsupported versions

## Consequences
### Positive
- Enables safe API evolution
- Clear migration path for frontend applications
- Industry-standard approach to versioning
- Supports external integrations

### Negative
- Additional URL complexity
- Need to maintain multiple OpenAPI specs
- Increased testing surface area

### Neutral
- Requires frontend updates to use versioned URLs
- Documentation overhead for multiple versions

## Implementation Notes
1. Update OpenAPI spec to include version prefix in all paths
2. Update frontend API client generation to include version prefix
3. Add version-specific middleware for future negotiation
4. Document migration strategy for external consumers

## Related Decisions
- [ADR-001](001-multi-tenancy.md): Multi-tenancy strategy
- [ADR-002](002-migration-strategy.md): Database migration strategy

## References
- [RESTful API Versioning Best Practices](https://restfulapi.net/versioning/)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md#versioning)
