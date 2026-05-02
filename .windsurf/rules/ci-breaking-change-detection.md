---
trigger: model_decision
description: CI/CD breaking change detection for API contracts, database schemas, and client compatibility
---

# CI Breaking Change Detection

## Core Principle

### Automated Breaking Change Detection
All changes that could break existing functionality must be automatically detected in CI/CD pipelines. This includes API contract changes, database schema migrations, and client compatibility issues.

## Required Detection Systems

### 1. API Contract Changes
```typescript
// ✅ CORRECT - API contract change detection
export class ApiContractDetector {
  constructor(
    private oldSpec: OpenAPIDocument,
    private newSpec: OpenAPIDocument
  ) {}

  detectBreakingChanges(): BreakingChangeReport {
    const changes: BreakingChange[] = [];

    // Check for removed endpoints
    const removedEndpoints = this.detectRemovedEndpoints();
    changes.push(...removedEndpoints);

    // Check for changed HTTP methods
    const changedMethods = this.detectChangedHttpMethods();
    changes.push(...changedMethods);

    // Check for changed path parameters
    const changedPathParams = this.detectChangedPathParameters();
    changes.push(...changedPathParams);

    // Check for removed query parameters
    const removedQueryParams = this.detectRemovedQueryParameters();
    changes.push(...removedQueryParams);

    // Check for changed response schemas
    const changedSchemas = this.detectChangedResponseSchemas();
    changes.push(...changedSchemas);

    // Check for removed request properties
    const removedProperties = this.detectRemovedRequestProperties();
    changes.push(...removedProperties);

    // Check for changed response status codes
    const changedStatusCodes = this.detectChangedStatusCodes();
    changes.push(...changedStatusCodes);

    return {
      hasBreakingChanges: changes.length > 0,
      changes,
      summary: this.generateSummary(changes),
    };
  }

  private detectRemovedEndpoints(): BreakingChange[] {
    const changes: BreakingChange[] = [];
    const oldPaths = new Set(Object.keys(this.oldSpec.paths));
    const newPaths = new Set(Object.keys(this.newSpec.paths));

    for (const path of oldPaths) {
      if (!newPaths.has(path)) {
        changes.push({
          type: 'removed_endpoint',
          severity: 'major',
          path,
          description: `Endpoint ${path} was removed`,
          recommendation: 'Consider deprecating the endpoint instead of removing it',
        });
      }
    }

    return changes;
  }

  private detectChangedHttpMethods(): BreakingChange[] {
    const changes: BreakingChange[] = [];

    for (const [path, pathItem] of Object.entries(this.oldSpec.paths)) {
      const newPathItem = this.newSpec.paths[path];
      if (!newPathItem) continue;

      const oldMethods = new Set(
        Object.keys(pathItem).filter(key => ['get', 'post', 'put', 'delete', 'patch'].includes(key))
      );
      const newMethods = new Set(
        Object.keys(newPathItem).filter(key => ['get', 'post', 'put', 'delete', 'patch'].includes(key))
      );

      for (const method of oldMethods) {
        if (!newMethods.has(method)) {
          changes.push({
            type: 'removed_method',
            severity: 'major',
            path,
            method: method.toUpperCase(),
            description: `Method ${method.toUpperCase()} ${path} was removed`,
            recommendation: 'Consider deprecating the method instead of removing it',
          });
        }
      }
    }

    return changes;
  }

  private detectChangedPathParameters(): BreakingChange[] {
    const changes: BreakingChange[] = [];

    for (const [path, pathItem] of Object.entries(this.oldSpec.paths)) {
      const newPathItem = this.newSpec.paths[path];
      if (!newPathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;

        const oldParams = operation.parameters?.filter(p => p.in === 'path') || [];
        const newOperation = newPathItem[method];
        const newParams = newOperation?.parameters?.filter(p => p.in === 'path') || [];

        const oldParamNames = new Set(oldParams.map(p => p.name));
        const newParamNames = new Set(newParams.map(p => p.name));

        for (const paramName of oldParamNames) {
          if (!newParamNames.has(paramName)) {
            changes.push({
              type: 'removed_path_parameter',
              severity: 'major',
              path,
              method: method.toUpperCase(),
              parameter: paramName,
              description: `Path parameter ${paramName} was removed from ${method.toUpperCase()} ${path}`,
              recommendation: 'Consider making the parameter optional instead of removing it',
            });
          }
        }

        for (const paramName of oldParamNames) {
          const oldParam = oldParams.find(p => p.name === paramName);
          const newParam = newParams.find(p => p.name === paramName);
          
          if (oldParam && newParam && oldParam.required && !newParam.required) {
            changes.push({
              type: 'path_parameter_optional',
              severity: 'minor',
              path,
              method: method.toUpperCase(),
              parameter: paramName,
              description: `Path parameter ${paramName} became optional in ${method.toUpperCase()} ${path}`,
              recommendation: 'This is a minor change but ensure clients handle the optional parameter',
            });
          }
        }
      }
    }

    return changes;
  }

  private detectRemovedQueryParameters(): BreakingChange[] {
    const changes: BreakingChange[] = [];

    for (const [path, pathItem] of Object.entries(this.oldSpec.paths)) {
      const newPathItem = this.newSpec.paths[path];
      if (!newPathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;

        const oldParams = operation.parameters?.filter(p => p.in === 'query') || [];
        const newOperation = newPathItem[method];
        const newParams = newOperation?.parameters?.filter(p => p.in === 'query') || [];

        const oldParamNames = new Set(oldParams.map(p => p.name));
        const newParamNames = new Set(newParams.map(p => p.name));

        for (const paramName of oldParamNames) {
          if (!newParamNames.has(paramName)) {
            const oldParam = oldParams.find(p => p.name === paramName);
            if (oldParam?.required) {
              changes.push({
                type: 'removed_required_query_parameter',
                severity: 'major',
                path,
                method: method.toUpperCase(),
                parameter: paramName,
                description: `Required query parameter ${paramName} was removed from ${method.toUpperCase()} ${path}`,
                recommendation: 'Consider making the parameter optional instead of removing it',
              });
            } else {
              changes.push({
                type: 'removed_optional_query_parameter',
                severity: 'minor',
                path,
                method: method.toUpperCase(),
                parameter: paramName,
                description: `Optional query parameter ${paramName} was removed from ${method.toUpperCase()} ${path}`,
                recommendation: 'This is a minor change but ensure clients don\'t rely on this parameter',
              });
            }
          }
        }
      }
    }

    return changes;
  }

  private detectChangedResponseSchemas(): BreakingChange[] {
    const changes: BreakingChange[] = [];

    for (const [path, pathItem] of Object.entries(this.oldSpec.paths)) {
      const newPathItem = this.newSpec.paths[path];
      if (!newPathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;

        const newOperation = newPathItem[method];
        
        // Check 200 responses
        const oldResponse = operation.responses?.['200'];
        const newResponse = newOperation?.responses?.['200'];
        
        if (oldResponse && newResponse) {
          const schemaChanges = this.compareSchemas(
            oldResponse.content?.['application/json']?.schema,
            newResponse.content?.['application/json']?.schema,
            `${method.toUpperCase()} ${path} response`
          );
          changes.push(...schemaChanges);
        }
      }
    }

    return changes;
  }

  private detectRemovedRequestProperties(): BreakingChange[] {
    const changes: BreakingChange[] = [];

    for (const [path, pathItem] of Object.entries(this.oldSpec.paths)) {
      const newPathItem = this.newSpec.paths[path];
      if (!newPathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['post', 'put', 'patch'].includes(method)) continue;

        const newOperation = newPathItem[method];
        
        const oldRequest = operation.requestBody?.content?.['application/json']?.schema;
        const newRequest = newOperation?.requestBody?.content?.['application/json']?.schema;
        
        if (oldRequest && newRequest) {
          const schemaChanges = this.compareSchemas(
            oldRequest,
            newRequest,
            `${method.toUpperCase()} ${path} request`
          );
          changes.push(...schemaChanges);
        }
      }
    }

    return changes;
  }

  private detectChangedStatusCodes(): BreakingChange[] {
    const changes: BreakingChange[] = [];

    for (const [path, pathItem] of Object.entries(this.oldSpec.paths)) {
      const newPathItem = this.newSpec.paths[path];
      if (!newPathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;

        const newOperation = newPathItem[method];
        
        const oldResponses = new Set(Object.keys(operation.responses || {}));
        const newResponses = new Set(Object.keys(newOperation?.responses || {}));

        for (const statusCode of oldResponses) {
          if (!newResponses.has(statusCode)) {
            changes.push({
              type: 'removed_response_status',
              severity: 'major',
              path,
              method: method.toUpperCase(),
              statusCode,
              description: `Response status ${statusCode} was removed from ${method.toUpperCase()} ${path}`,
              recommendation: 'Consider keeping the status code or providing a migration path',
            });
          }
        }
      }
    }

    return changes;
  }

  private compareSchemas(
    oldSchema: any,
    newSchema: any,
    context: string
  ): BreakingChange[] {
    const changes: BreakingChange[] = [];

    if (!oldSchema || !newSchema) return changes;

    // Check for removed properties
    if (oldSchema.properties && newSchema.properties) {
      const oldProps = new Set(Object.keys(oldSchema.properties));
      const newProps = new Set(Object.keys(newSchema.properties));

      for (const propName of oldProps) {
        if (!newProps.has(propName)) {
          const wasRequired = oldSchema.required?.includes(propName);
          changes.push({
            type: wasRequired ? 'removed_required_property' : 'removed_optional_property',
            severity: wasRequired ? 'major' : 'minor',
            context,
            property: propName,
            description: `Property ${propName} was ${wasRequired ? 'required' : 'optional'} and was removed from ${context}`,
            recommendation: wasRequired 
              ? 'Consider making the property optional instead of removing it'
              : 'This is a minor change but ensure clients don\'t rely on this property',
          });
        }
      }
    }

    return changes;
  }

  private generateSummary(changes: BreakingChange[]): string {
    const major = changes.filter(c => c.severity === 'major').length;
    const minor = changes.filter(c => c.severity === 'minor').length;
    
    if (major === 0 && minor === 0) {
      return 'No breaking changes detected';
    }
    
    const parts = [];
    if (major > 0) parts.push(`${major} major breaking change${major > 1 ? 's' : ''}`);
    if (minor > 0) parts.push(`${minor} minor breaking change${minor > 1 ? 's' : ''}`);
    
    return `Detected ${parts.join(' and ')}`;
  }
}

interface BreakingChange {
  type: string;
  severity: 'major' | 'minor';
  path?: string;
  method?: string;
  parameter?: string;
  property?: string;
  statusCode?: string;
  context?: string;
  description: string;
  recommendation: string;
}

interface BreakingChangeReport {
  hasBreakingChanges: boolean;
  changes: BreakingChange[];
  summary: string;
}

// ❌ INCORRECT - No breaking change detection
function checkApiChanges(oldSpec: any, newSpec: any) {
  // No actual comparison - manual review required
  return { hasChanges: false, changes: [] };
}
```

### 2. Database Schema Changes
```typescript
// ✅ CORRECT - Database schema change detection
export class DatabaseSchemaDetector {
  constructor(
    private oldSchema: DrizzleSchema,
    private newSchema: DrizzleSchema
  ) {}

  detectBreakingChanges(): DatabaseBreakingChangeReport {
    const changes: DatabaseBreakingChange[] = [];

    // Check for removed tables
    const removedTables = this.detectRemovedTables();
    changes.push(...removedTables);

    // Check for removed columns
    const removedColumns = this.detectRemovedColumns();
    changes.push(...removedColumns);

    // Check for column type changes
    const columnTypeChanges = this.detectColumnTypeChanges();
    changes.push(...columnTypeChanges);

    // Check for constraint changes
    const constraintChanges = this.detectConstraintChanges();
    changes.push(...constraintChanges);

    // Check for index changes
    const indexChanges = this.detectIndexChanges();
    changes.push(...indexChanges);

    return {
      hasBreakingChanges: changes.length > 0,
      changes,
      summary: this.generateSummary(changes),
      migrationRequired: changes.some(c => c.requiresMigration),
    };
  }

  private detectRemovedTables(): DatabaseBreakingChange[] {
    const changes: DatabaseBreakingChange[] = [];
    const oldTables = new Set(Object.keys(this.oldSchema));
    const newTables = new Set(Object.keys(this.newSchema));

    for (const tableName of oldTables) {
      if (!newTables.has(tableName)) {
        changes.push({
          type: 'removed_table',
          severity: 'major',
          table: tableName,
          description: `Table ${tableName} was removed`,
          recommendation: 'Consider deprecating the table instead of removing it',
          requiresMigration: true,
        });
      }
    }

    return changes;
  }

  private detectRemovedColumns(): DatabaseBreakingChange[] {
    const changes: DatabaseBreakingChange[] = [];

    for (const [tableName, oldTable] of Object.entries(this.oldSchema)) {
      const newTable = this.newSchema[tableName];
      if (!newTable) continue;

      const oldColumns = new Set(Object.keys(oldTable.columns));
      const newColumns = new Set(Object.keys(newTable.columns));

      for (const columnName of oldColumns) {
        if (!newColumns.has(columnName)) {
          const oldColumn = oldTable.columns[columnName];
          changes.push({
            type: 'removed_column',
            severity: oldColumn.notNull ? 'major' : 'minor',
            table: tableName,
            column: columnName,
            description: `Column ${tableName}.${columnName} was removed${oldColumn.notNull ? ' (NOT NULL)' : ''}`,
            recommendation: oldColumn.notNull 
              ? 'Consider making the column nullable before removing it'
              : 'This is a minor change but ensure no code relies on this column',
            requiresMigration: true,
          });
        }
      }
    }

    return changes;
  }

  private detectColumnTypeChanges(): DatabaseBreakingChange[] {
    const changes: DatabaseBreakingChange[] = [];

    for (const [tableName, oldTable] of Object.entries(this.oldSchema)) {
      const newTable = this.newSchema[tableName];
      if (!newTable) continue;

      for (const [columnName, oldColumn] of Object.entries(oldTable.columns)) {
        const newColumn = newTable.columns[columnName];
        if (!newColumn) continue;

        // Check for type changes
        if (oldColumn.type !== newColumn.type) {
          changes.push({
            type: 'column_type_change',
            severity: 'major',
            table: tableName,
            column: columnName,
            description: `Column ${tableName}.${columnName} type changed from ${oldColumn.type} to ${newColumn.type}`,
            recommendation: 'Ensure data migration handles the type conversion',
            requiresMigration: true,
            oldType: oldColumn.type,
            newType: newColumn.type,
          });
        }

        // Check for NOT NULL changes
        if (!oldColumn.notNull && newColumn.notNull) {
          changes.push({
            type: 'column_not_null_added',
            severity: 'major',
            table: tableName,
            column: columnName,
            description: `Column ${tableName}.${columnName} became NOT NULL`,
            recommendation: 'Ensure all existing rows have values for this column',
            requiresMigration: true,
          });
        }

        // Check for default value changes
        if (JSON.stringify(oldColumn.default) !== JSON.stringify(newColumn.default)) {
          changes.push({
            type: 'column_default_change',
            severity: 'minor',
            table: tableName,
            column: columnName,
            description: `Column ${tableName}.${columnName} default value changed`,
            recommendation: 'Ensure applications handle the new default value',
            requiresMigration: false,
            oldDefault: oldColumn.default,
            newDefault: newColumn.default,
          });
        }
      }
    }

    return changes;
  }

  private detectConstraintChanges(): DatabaseBreakingChange[] {
    const changes: DatabaseBreakingChange[] = [];

    for (const [tableName, oldTable] of Object.entries(this.oldSchema)) {
      const newTable = this.newSchema[tableName];
      if (!newTable) continue;

      // Check for removed primary keys
      if (oldTable.primaryKey && !newTable.primaryKey) {
        changes.push({
          type: 'removed_primary_key',
          severity: 'major',
          table: tableName,
          description: `Primary key was removed from table ${tableName}`,
          recommendation: 'Primary keys should not be removed',
          requiresMigration: true,
        });
      }

      // Check for changed primary keys
      if (oldTable.primaryKey && newTable.primaryKey) {
        const oldPK = oldTable.primaryKey.columns.join(',');
        const newPK = newTable.primaryKey.columns.join(',');
        
        if (oldPK !== newPK) {
          changes.push({
            type: 'changed_primary_key',
            severity: 'major',
            table: tableName,
            description: `Primary key changed from ${oldPK} to ${newPK} in table ${tableName}`,
            recommendation: 'Primary keys should not be changed',
            requiresMigration: true,
          });
        }
      }

      // Check for removed foreign keys
      const oldFKs = oldTable.foreignKeys || [];
      const newFKs = newTable.foreignKeys || [];
      const oldFKNames = new Set(oldFKs.map(fk => fk.name));
      const newFKNames = new Set(newFKs.map(fk => fk.name));

      for (const fkName of oldFKNames) {
        if (!newFKNames.has(fkName)) {
          changes.push({
            type: 'removed_foreign_key',
            severity: 'major',
            table: tableName,
            constraint: fkName,
            description: `Foreign key ${fkName} was removed from table ${tableName}`,
            recommendation: 'Consider keeping the foreign key for data integrity',
            requiresMigration: true,
          });
        }
      }
    }

    return changes;
  }

  private detectIndexChanges(): DatabaseBreakingChange[] {
    const changes: DatabaseBreakingChange[] = [];

    for (const [tableName, oldTable] of Object.entries(this.oldSchema)) {
      const newTable = this.newSchema[tableName];
      if (!newTable) continue;

      // Check for removed indexes
      const oldIndexes = oldTable.indexes || [];
      const newIndexes = newTable.indexes || [];
      const oldIndexNames = new Set(oldIndexes.map(idx => idx.name));
      const newIndexNames = new Set(newIndexes.map(idx => idx.name));

      for (const indexName of oldIndexNames) {
        if (!newIndexNames.has(indexName)) {
          changes.push({
            type: 'removed_index',
            severity: 'minor',
            table: tableName,
            constraint: indexName,
            description: `Index ${indexName} was removed from table ${tableName}`,
            recommendation: 'This may affect query performance',
            requiresMigration: false,
          });
        }
      }
    }

    return changes;
  }

  private generateSummary(changes: DatabaseBreakingChange[]): string {
    const major = changes.filter(c => c.severity === 'major').length;
    const minor = changes.filter(c => c.severity === 'minor').length;
    const migrationRequired = changes.filter(c => c.requiresMigration).length;
    
    if (major === 0 && minor === 0) {
      return 'No database breaking changes detected';
    }
    
    const parts = [];
    if (major > 0) parts.push(`${major} major breaking change${major > 1 ? 's' : ''}`);
    if (minor > 0) parts.push(`${minor} minor breaking change${minor > 1 ? 's' : ''}`);
    
    let summary = `Detected ${parts.join(' and ')}`;
    if (migrationRequired > 0) {
      summary += ` (${migrationRequired} require migration${migrationRequired > 1 ? 's' : ''})`;
    }
    
    return summary;
  }
}

interface DatabaseBreakingChange {
  type: string;
  severity: 'major' | 'minor';
  table: string;
  column?: string;
  constraint?: string;
  description: string;
  recommendation: string;
  requiresMigration: boolean;
  oldType?: string;
  newType?: string;
  oldDefault?: any;
  newDefault?: any;
}

interface DatabaseBreakingChangeReport {
  hasBreakingChanges: boolean;
  changes: DatabaseBreakingChange[];
  summary: string;
  migrationRequired: boolean;
}

// ❌ INCORRECT - No database schema detection
function checkDatabaseChanges(oldSchema: any, newSchema: any) {
  // No actual comparison - manual review required
  return { hasChanges: false, changes: [] };
}
```

### 3. Client Compatibility Changes
```typescript
// ✅ CORRECT - Client compatibility change detection
export class ClientCompatibilityDetector {
  constructor(
    private oldClientCode: string,
    private newClientCode: string,
    private oldApiSpec: OpenAPIDocument,
    private newApiSpec: OpenAPIDocument
  ) {}

  detectBreakingChanges(): ClientBreakingChangeReport {
    const changes: ClientBreakingChange[] = [];

    // Check for removed API usage
    const removedApiUsage = this.detectRemovedApiUsage();
    changes.push(...removedApiUsage);

    // Check for changed component props
    const changedProps = this.detectChangedComponentProps();
    changes.push(...changedProps);

    // Check for removed hooks
    const removedHooks = this.detectRemovedHooks();
    changes.push(...removedHooks);

    // Check for changed utility functions
    const changedUtils = this.detectChangedUtilityFunctions();
    changes.push(...changedUtils);

    return {
      hasBreakingChanges: changes.length > 0,
      changes,
      summary: this.generateSummary(changes),
    };
  }

  private detectRemovedApiUsage(): ClientBreakingChange[] {
    const changes: ClientBreakingChange[] = [];

    // Extract API calls from old code
    const oldApiCalls = this.extractApiCalls(this.oldClientCode);
    const newApiCalls = this.extractApiCalls(this.newClientCode);

    // Check for removed endpoints
    for (const apiCall of oldApiCalls) {
      const isStillUsed = newApiCalls.some(call => 
        call.method === apiCall.method && call.path === apiCall.path
      );
      
      if (!isStillUsed) {
        const isEndpointRemoved = !this.newApiSpec.paths[apiCall.path];
        const isMethodRemoved = !this.newApiSpec.paths[apiCall.path]?.[apiCall.method.toLowerCase()];
        
        if (isEndpointRemoved || isMethodRemoved) {
          changes.push({
            type: 'removed_api_usage',
            severity: 'major',
            apiCall: `${apiCall.method} ${apiCall.path}`,
            description: `API call ${apiCall.method} ${apiCall.path} was removed`,
            recommendation: 'Update client code to use alternative API or handle removal gracefully',
            location: apiCall.location,
          });
        }
      }
    }

    return changes;
  }

  private detectChangedComponentProps(): ClientBreakingChange[] {
    const changes: ClientBreakingChange[] = [];

    // Extract React components from old and new code
    const oldComponents = this.extractReactComponents(this.oldClientCode);
    const newComponents = this.extractReactComponents(this.newClientCode);

    for (const [componentName, oldComponent] of Object.entries(oldComponents)) {
      const newComponent = newComponents[componentName];
      if (!newComponent) continue;

      // Check for removed props
      for (const propName of oldComponent.props) {
        if (!newComponent.props.includes(propName)) {
          changes.push({
            type: 'removed_component_prop',
            severity: 'major',
            component: componentName,
            prop: propName,
            description: `Prop ${propName} was removed from component ${componentName}`,
            recommendation: 'Update component usage or provide default value',
          });
        }
      }

      // Check for prop type changes
      for (const propName of oldComponent.props) {
        if (newComponent.props.includes(propName)) {
          const oldProp = oldComponent.propTypes[propName];
          const newProp = newComponent.propTypes[propName];
          
          if (oldProp && newProp && oldProp !== newProp) {
            changes.push({
              type: 'changed_prop_type',
              severity: 'minor',
              component: componentName,
              prop: propName,
              description: `Prop ${propName} type changed in component ${componentName}`,
              recommendation: 'Update prop usage to handle new type',
              oldType: oldProp,
              newType: newProp,
            });
          }
        }
      }
    }

    return changes;
  }

  private detectRemovedHooks(): ClientBreakingChange[] {
    const changes: ClientBreakingChange[] = [];

    // Extract React hooks from old and new code
    const oldHooks = this.extractReactHooks(this.oldClientCode);
    const newHooks = this.extractReactHooks(this.newClientCode);

    for (const hookName of oldHooks) {
      if (!newHooks.includes(hookName)) {
        changes.push({
          type: 'removed_hook',
          severity: 'major',
          hook: hookName,
          description: `React hook ${hookName} was removed`,
          recommendation: 'Update code to use alternative hook or implement replacement',
        });
      }
    }

    return changes;
  }

  private detectChangedUtilityFunctions(): ClientBreakingChange[] {
    const changes: ClientBreakingChange[] = [];

    // Extract utility functions from old and new code
    const oldUtils = this.extractUtilityFunctions(this.oldClientCode);
    const newUtils = this.extractUtilityFunctions(this.newClientCode);

    for (const [utilName, oldUtil] of Object.entries(oldUtils)) {
      const newUtil = newUtils[utilName];
      if (!newUtil) continue;

      // Check for removed parameters
      for (const paramName of oldUtil.parameters) {
        if (!newUtil.parameters.includes(paramName)) {
          changes.push({
            type: 'removed_utility_parameter',
            severity: 'major',
            utility: utilName,
            parameter: paramName,
            description: `Parameter ${paramName} was removed from utility function ${utilName}`,
            recommendation: 'Update function calls or provide default value',
          });
        }
      }

      // Check for changed return types
      if (oldUtil.returnType !== newUtil.returnType) {
        changes.push({
          type: 'changed_utility_return_type',
          severity: 'major',
          utility: utilName,
          description: `Return type changed for utility function ${utilName}`,
          recommendation: 'Update code to handle new return type',
          oldType: oldUtil.returnType,
          newType: newUtil.returnType,
        });
      }
    }

    return changes;
  }

  private extractApiCalls(code: string): ApiCall[] {
    const apiCalls: ApiCall[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match API calls like fetch('/api/users', { method: 'POST' })
      const fetchMatch = line.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (fetchMatch) {
        const pathMatch = fetchMatch[1];
        const methodMatch = line.match(/method\s*:\s*['"`]([^'"`]+)['"`]/);
        const method = methodMatch ? methodMatch[1] : 'GET';
        
        apiCalls.push({
          method,
          path: pathMatch,
          location: `line ${i + 1}`,
        });
      }

      // Match useQuery calls like useQuery(['users'], fetchUsers)
      const useQueryMatch = line.match(/useQuery\s*\(\s*\[([^\]]+)\]/);
      if (useQueryMatch) {
        const queryKey = useQueryMatch[1];
        apiCalls.push({
          method: 'GET',
          path: queryKey,
          location: `line ${i + 1}`,
        });
      }
    }

    return apiCalls;
  }

  private extractReactComponents(code: string): Record<string, ReactComponent> {
    const components: Record<string, ReactComponent> = {};
    
    // Match React component definitions
    const componentMatches = code.matchAll(/function\s+(\w+)\s*\([^)]*\)\s*:\s*React\.FC[^{]*{([^}]+)}/g);
    
    for (const match of componentMatches) {
      const componentName = match[1];
      const propsInterface = match[2];
      
      // Extract props from interface
      const props = this.extractPropsFromInterface(propsInterface);
      
      components[componentName] = {
        name: componentName,
        props,
        propTypes: this.extractPropTypesFromInterface(propsInterface),
      };
    }

    return components;
  }

  private extractReactHooks(code: string): string[] {
    const hooks: string[] = [];
    
    // Match custom hooks (functions starting with 'use')
    const hookMatches = code.matchAll(/function\s+(use\w+)\s*\(/g);
    
    for (const match of hookMatches) {
      hooks.push(match[1]);
    }

    return hooks;
  }

  private extractUtilityFunctions(code: string): Record<string, UtilityFunction> {
    const utils: Record<string, UtilityFunction> = {};
    
    // Match utility function definitions
    const utilMatches = code.matchAll(/export\s+function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^;]+)/g);
    
    for (const match of utilMatches) {
      const functionName = match[1];
      const parameters = this.extractParameters(match[2]);
      const returnType = match[3].trim();
      
      utils[functionName] = {
        name: functionName,
        parameters,
        returnType,
      };
    }

    return utils;
  }

  private extractPropsFromInterface(interfaceString: string): string[] {
    const props: string[] = [];
    
    // Extract property names from interface
    const propMatches = interfaceString.matchAll(/(\w+)\s*:/g);
    
    for (const match of propMatches) {
      props.push(match[1]);
    }

    return props;
  }

  private extractPropTypesFromInterface(interfaceString: string): Record<string, string> {
    const propTypes: Record<string, string> = {};
    
    // Extract property types from interface
    const propMatches = interfaceString.matchAll(/(\w+)\s*:\s*([^;]+)/g);
    
    for (const match of propMatches) {
      propTypes[match[1]] = match[2].trim();
    }

    return propTypes;
  }

  private extractParameters(paramString: string): string[] {
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map(param => param.trim().split(':')[0]);
  }

  private generateSummary(changes: ClientBreakingChange[]): string {
    const major = changes.filter(c => c.severity === 'major').length;
    const minor = changes.filter(c => c.severity === 'minor').length;
    
    if (major === 0 && minor === 0) {
      return 'No client breaking changes detected';
    }
    
    const parts = [];
    if (major > 0) parts.push(`${major} major breaking change${major > 1 ? 's' : ''}`);
    if (minor > 0) parts.push(`${minor} minor breaking change${minor > 1 ? 's' : ''}`);
    
    return `Detected ${parts.join(' and ')}`;
  }
}

interface ApiCall {
  method: string;
  path: string;
  location: string;
}

interface ReactComponent {
  name: string;
  props: string[];
  propTypes: Record<string, string>;
}

interface UtilityFunction {
  name: string;
  parameters: string[];
  returnType: string;
}

interface ClientBreakingChange {
  type: string;
  severity: 'major' | 'minor';
  component?: string;
  prop?: string;
  hook?: string;
  utility?: string;
  parameter?: string;
  apiCall?: string;
  location?: string;
  description: string;
  recommendation: string;
  oldType?: string;
  newType?: string;
}

interface ClientBreakingChangeReport {
  hasBreakingChanges: boolean;
  changes: ClientBreakingChange[];
  summary: string;
}

// ❌ INCORRECT - No client compatibility detection
function checkClientChanges(oldCode: string, newCode: string) {
  // No actual comparison - manual review required
  return { hasChanges: false, changes: [] };
}
```

## CI/CD Integration

### 1. GitHub Actions Workflow
```yaml
# ✅ CORRECT - Breaking change detection in CI
name: Breaking Change Detection

on:
  pull_request:
    branches: [main]

jobs:
  detect-breaking-changes:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Detect API breaking changes
      run: |
        # Compare OpenAPI specs
        npx breaking-change-detector api \
          --old-spec lib/api-spec/openapi.yaml \
          --new-spec lib/api-spec/openapi.yaml \
          --output api-breaking-changes.json

    - name: Detect database breaking changes
      run: |
        # Compare database schemas
        npx breaking-change-detector db \
          --old-schema lib/db/schema-old.ts \
          --new-schema lib/db/schema.ts \
          --output db-breaking-changes.json

    - name: Detect client breaking changes
      run: |
        # Compare client code
        npx breaking-change-detector client \
          --old-client artifacts/apex-os/src \
          --new-client artifacts/apex-os/src \
          --output client-breaking-changes.json

    - name: Generate breaking change report
      run: |
        npx breaking-change-detector report \
          --api-changes api-breaking-changes.json \
          --db-changes db-breaking-changes.json \
          --client-changes client-breaking-changes.json \
          --output breaking-change-report.md

    - name: Comment on PR
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const report = fs.readFileSync('breaking-change-report.md', 'utf8');
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: report
          });

    - name: Check for major breaking changes
      run: |
        const report = JSON.parse(fs.readFileSync('breaking-change-report.json', 'utf8'));
        
        if (report.hasMajorBreakingChanges) {
          echo "::error::Major breaking changes detected. Please review and update version accordingly."
          exit 1;
        }

    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      with:
        name: breaking-change-reports
        path: |
          api-breaking-changes.json
          db-breaking-changes.json
          client-breaking-changes.json
          breaking-change-report.md
```

### 2. Breaking Change Detector CLI
```typescript
// ✅ CORRECT - CLI tool for breaking change detection
#!/usr/bin/env node

import { Command } from 'commander';
import { ApiContractDetector } from './detectors/api-contract-detector';
import { DatabaseSchemaDetector } from './detectors/database-schema-detector';
import { ClientCompatibilityDetector } from './detectors/client-compatibility-detector';

const program = new Command();

program
  .name('breaking-change-detector')
  .description('Detect breaking changes in API contracts, database schemas, and client code')
  .version('1.0.0');

program
  .command('api')
  .description('Detect API breaking changes')
  .requiredOption('--old-spec <path>', 'Path to old OpenAPI spec')
  .requiredOption('--new-spec <path>', 'Path to new OpenAPI spec')
  .option('--output <path>', 'Output file path', 'api-breaking-changes.json')
  .action(async (options) => {
    const oldSpec = await loadOpenAPISpec(options.oldSpec);
    const newSpec = await loadOpenAPISpec(options.newSpec);
    
    const detector = new ApiContractDetector(oldSpec, newSpec);
    const report = detector.detectBreakingChanges();
    
    await writeJsonFile(options.output, report);
    
    if (report.hasBreakingChanges) {
      console.error(`❌ ${report.summary}`);
      process.exit(1);
    } else {
      console.log(`✅ ${report.summary}`);
    }
  });

program
  .command('db')
  .description('Detect database breaking changes')
  .requiredOption('--old-schema <path>', 'Path to old database schema')
  .requiredOption('--new-schema <path>', 'Path to new database schema')
  .option('--output <path>', 'Output file path', 'db-breaking-changes.json')
  .action(async (options) => {
    const oldSchema = await loadDatabaseSchema(options.oldSchema);
    const newSchema = await loadDatabaseSchema(options.newSchema);
    
    const detector = new DatabaseSchemaDetector(oldSchema, newSchema);
    const report = detector.detectBreakingChanges();
    
    await writeJsonFile(options.output, report);
    
    if (report.hasBreakingChanges) {
      console.error(`❌ ${report.summary}`);
      process.exit(1);
    } else {
      console.log(`✅ ${report.summary}`);
    }
  });

program
  .command('client')
  .description('Detect client breaking changes')
  .requiredOption('--old-client <path>', 'Path to old client code')
  .requiredOption('--new-client <path>', 'Path to new client code')
  .option('--old-api-spec <path>', 'Path to old API spec')
  .option('--new-api-spec <path>', 'Path to new API spec')
  .option('--output <path>', 'Output file path', 'client-breaking-changes.json')
  .action(async (options) => {
    const oldClientCode = await loadClientCode(options.oldClient);
    const newClientCode = await loadClientCode(options.newClient);
    const oldApiSpec = options.oldApiSpec ? await loadOpenAPISpec(options.oldApiSpec) : null;
    const newApiSpec = options.newApiSpec ? await loadOpenAPISpec(options.newApiSpec) : null;
    
    const detector = new ClientCompatibilityDetector(
      oldClientCode,
      newClientCode,
      oldApiSpec,
      newApiSpec
    );
    const report = detector.detectBreakingChanges();
    
    await writeJsonFile(options.output, report);
    
    if (report.hasBreakingChanges) {
      console.error(`❌ ${report.summary}`);
      process.exit(1);
    } else {
      console.log(`✅ ${report.summary}`);
    }
  });

program
  .command('report')
  .description('Generate comprehensive breaking change report')
  .option('--api-changes <path>', 'Path to API changes JSON')
  .option('--db-changes <path>', 'Path to database changes JSON')
  .option('--client-changes <path>', 'Path to client changes JSON')
  .option('--output <path>', 'Output file path', 'breaking-change-report.md')
  .action(async (options) => {
    const apiChanges = options.apiChanges ? await readJsonFile(options.apiChanges) : null;
    const dbChanges = options.dbChanges ? await readJsonFile(options.dbChanges) : null;
    const clientChanges = options.clientChanges ? await readJsonFile(options.clientChanges) : null;
    
    const report = generateReport(apiChanges, dbChanges, clientChanges);
    await writeFile(options.output, report);
    
    console.log(`📊 Report generated: ${options.output}`);
  });

async function loadOpenAPISpec(path: string): Promise<any> {
  const content = await readFile(path, 'utf8');
  return JSON.parse(content);
}

async function loadDatabaseSchema(path: string): Promise<any> {
  const content = await readFile(path, 'utf8');
  return eval(content); // Drizzle schema
}

async function loadClientCode(path: string): Promise<string> {
  return await readFile(path, 'utf8');
}

async function writeJsonFile(path: string, data: any): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2));
}

async function readJsonFile(path: string): Promise<any> {
  const content = await readFile(path, 'utf8');
  return JSON.parse(content);
}

async function writeFile(path: string, content: string): Promise<void> {
  await fs.promises.writeFile(path, content);
}

async function readFile(path: string): Promise<string> {
  return await fs.promises.readFile(path, 'utf8');
}

function generateReport(
  apiChanges: any,
  dbChanges: any,
  clientChanges: any
): string {
  const hasMajorChanges = [
    apiChanges?.hasBreakingChanges && apiChanges?.changes?.some(c => c.severity === 'major'),
    dbChanges?.hasBreakingChanges && dbChanges?.changes?.some(c => c.severity === 'major'),
    clientChanges?.hasBreakingChanges && clientChanges?.changes?.some(c => c.severity === 'major'),
  ].some(Boolean);

  let report = '# Breaking Change Report\n\n';
  
  if (hasMajorChanges) {
    report += '⚠️ **Major breaking changes detected**\n\n';
  } else {
    report += '✅ No major breaking changes detected\n\n';
  }

  if (apiChanges) {
    report += '## API Changes\n\n';
    report += `**Summary:** ${apiChanges.summary}\n\n`;
    
    if (apiChanges.changes.length > 0) {
      report += '### Changes:\n\n';
      for (const change of apiChanges.changes) {
        report += `- **${change.severity.toUpperCase()}** ${change.description}\n`;
        report += `  **Recommendation:** ${change.recommendation}\n\n`;
      }
    }
  }

  if (dbChanges) {
    report += '## Database Changes\n\n';
    report += `**Summary:** ${dbChanges.summary}\n\n`;
    
    if (dbChanges.changes.length > 0) {
      report += '### Changes:\n\n';
      for (const change of dbChanges.changes) {
        report += `- **${change.severity.toUpperCase()}** ${change.description}\n`;
        report += `  **Recommendation:** ${change.recommendation}\n`;
        if (change.requiresMigration) {
          report += `  **Migration Required:** Yes\n`;
        }
        report += '\n';
      }
    }
  }

  if (clientChanges) {
    report += '## Client Changes\n\n';
    report += `**Summary:** ${clientChanges.summary}\n\n`;
    
    if (clientChanges.changes.length > 0) {
      report += '### Changes:\n\n';
      for (const change of clientChanges.changes) {
        report += `- **${change.severity.toUpperCase()}** ${change.description}\n`;
        report += `  **Recommendation:** ${change.recommendation}\n\n`;
      }
    }
  }

  return report;
}

program.parse();
```

## Testing Breaking Change Detection

### 1. Unit Tests
```typescript
// ✅ CORRECT - Breaking change detection tests
describe('ApiContractDetector', () => {
  let detector: ApiContractDetector;
  let oldSpec: OpenAPIDocument;
  let newSpec: OpenAPIDocument;

  beforeEach(() => {
    oldSpec = createMockOpenAPISpec();
    newSpec = createMockOpenAPISpec();
    detector = new ApiContractDetector(oldSpec, newSpec);
  });

  describe('when endpoint is removed', () => {
    it('should detect breaking change', () => {
      // Remove endpoint from new spec
      delete newSpec.paths['/api/users'];
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed_endpoint');
      expect(report.changes[0].path).toBe('/api/users');
      expect(report.changes[0].severity).toBe('major');
    });
  });

  describe('when HTTP method is removed', () => {
    it('should detect breaking change', () => {
      // Remove POST method from endpoint
      delete newSpec.paths['/api/users'].post;
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed_method');
      expect(report.changes[0].path).toBe('/api/users');
      expect(report.changes[0].method).toBe('POST');
      expect(report.changes[0].severity).toBe('major');
    });
  });

  describe('when required query parameter is removed', () => {
    it('should detect breaking change', () => {
      // Remove required query parameter
      newSpec.paths['/api/users'].get.parameters = 
        newSpec.paths['/api/users'].get.parameters?.filter(p => p.name !== 'page');
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed_required_query_parameter');
      expect(report.changes[0].parameter).toBe('page');
      expect(report.changes[0].severity).toBe('major');
    });
  });

  describe('when response schema changes', () => {
    it('should detect breaking change', () => {
      // Remove property from response schema
      delete newSpec.paths['/api/users'].get.responses['200'].content['application/json'].schema.properties.email;
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed_required_property');
      expect(report.changes[0].property).toBe('email');
      expect(report.changes[0].severity).toBe('major');
    });
  });
});

describe('DatabaseSchemaDetector', () => {
  let detector: DatabaseSchemaDetector;
  let oldSchema: DrizzleSchema;
  let newSchema: DrizzleSchema;

  beforeEach(() => {
    oldSchema = createMockDatabaseSchema();
    newSchema = createMockDatabaseSchema();
    detector = new DatabaseSchemaDetector(oldSchema, newSchema);
  });

  describe('when table is removed', () => {
    it('should detect breaking change', () => {
      // Remove table from new schema
      delete newSchema.users;
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed_table');
      expect(report.changes[0].table).toBe('users');
      expect(report.changes[0].severity).toBe('major');
      expect(report.changes[0].requiresMigration).toBe(true);
    });
  });

  describe('when NOT NULL column is removed', () => {
    it('should detect breaking change', () => {
      // Remove NOT NULL column
      delete newSchema.users.columns.email;
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed_column');
      expect(report.changes[0].table).toBe('users');
      expect(report.changes[0].column).toBe('email');
      expect(report.changes[0].severity).toBe('major');
      expect(report.changes[0].requiresMigration).toBe(true);
    });
  });

  describe('when column type changes', () => {
    it('should detect breaking change', () => {
      // Change column type
      newSchema.users.columns.age.type = 'text';
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('column_type_change');
      expect(report.changes[0].table).toBe('users');
      expect(report.changes[0].column).toBe('age');
      expect(report.changes[0].severity).toBe('major');
      expect(report.changes[0].requiresMigration).toBe(true);
    });
  });
});

describe('ClientCompatibilityDetector', () => {
  let detector: ClientCompatibilityDetector;
  let oldClientCode: string;
  let newClientCode: string;
  let oldApiSpec: OpenAPIDocument;
  let newApiSpec: OpenAPIDocument;

  beforeEach(() => {
    oldClientCode = createMockClientCode();
    newClientCode = createMockClientCode();
    oldApiSpec = createMockOpenAPISpec();
    newApiSpec = createMockOpenAPISpec();
    detector = new ClientCompatibilityDetector(oldClientCode, newClientCode, oldApiSpec, newApiSpec);
  });

  describe('when API call is removed', () => {
    it('should detect breaking change', () => {
      // Remove API call from new client code
      newClientCode = newClientCode.replace("fetch('/api/users', { method: 'GET' })", "");
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed_api_usage');
      expect(report.changes[0].apiCall).toBe('GET /api/users');
      expect(report.changes[0].severity).toBe('major');
    });
  });

  describe('when component prop is removed', () => {
    it('should detect breaking change', () => {
      // Remove prop from component
      newClientCode = newClientCode.replace(
        "interface UserCardProps { name: string; email: string; }",
        "interface UserCardProps { name: string; }"
      );
      
      const report = detector.detectBreakingChanges();
      
      expect(report.hasBreakingChanges).toBe(true);
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].type).toBe('removed_component_prop');
      expect(report.changes[0].component).toBe('UserCard');
      expect(report.changes[0].prop).toBe('email');
      expect(report.changes[0].severity).toBe('major');
    });
  });
});
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't skip breaking change detection**: All changes must be automatically detected
- **Don't rely on manual review**: Automated detection is required for consistency
- **Don't ignore minor changes**: Minor changes can still break functionality
- **Don't skip database schema checks**: Schema changes can break applications
- **Don't skip client compatibility checks**: Client code changes can break integrations

### 2. Common Mistakes
```typescript
// ❌ WRONG - No breaking change detection
function checkChanges() {
  // No actual detection - manual review required
  return { hasChanges: false, changes: [] };
}

// ❌ WRONG - Only checks one type of change
function checkApiChanges(oldSpec: any, newSpec: any) {
  // Only checks API changes, ignores database and client
  const detector = new ApiContractDetector(oldSpec, newSpec);
  return detector.detectBreakingChanges();
}

// ❌ WRONG - No CI integration
// Changes only detected locally, not in CI/CD pipeline

// ❌ WRONG - No reporting
function checkBreakingChanges() {
  const changes = detectChanges();
  // No reporting or action taken
  return changes;
}
```

## Compliance Checklist

- [ ] API contract changes are detected automatically
- [ ] Database schema changes are detected automatically
- [ ] Client compatibility changes are detected automatically
- [ ] Breaking change detection is integrated into CI/CD pipeline
- [ ] Major breaking changes block merges
- [ ] Minor breaking changes are documented
- [ ] Breaking change reports are generated
- [ ] Reports are commented on pull requests
- [ ] Version bumping is automated based on breaking changes
- [ ] Migration requirements are identified
- [ ] Recommendations are provided for each breaking change
- [ ] Detection tools are tested and maintained
- [ ] False positives are minimized
- [ ] Performance impact is minimal
- [ ] Detection covers all change types
- [ ] Historical change tracking is maintained
- [ ] Rollback strategies are documented
- [ ] Communication channels are established
- [ ] Stakeholder approval process is defined
- [ ] Documentation is updated automatically
- [ ] Monitoring is in place for breaking changes
- [ ] Alerting is configured for breaking changes
- [ ] Rollback procedures are tested
- [ ] Change impact analysis is comprehensive
- [ ] Client migration paths are provided
- [ ] Database migration scripts are generated
- [ ] API versioning strategy is followed
- [ ] Deprecation periods are enforced
- [ ] Backward compatibility is maintained where possible
- [ ] Forward compatibility is considered
- [ ] Breaking change documentation is comprehensive
- [ ] Change approval workflow is enforced
- [ ] Quality gates are in place
- [ ] Automated testing validates compatibility
- [ ] Manual review is supplemented by automation
- [ ] Change impact is communicated to stakeholders
- [ ] Rollback plans are tested and documented
