---
name: frontend-api-integration
description: Replace static mock data with React Query hooks across all 10 business pages
---

# Frontend API Integration

This skill guides you through replacing static mock data with React Query hooks across all 10 business pages in the Apex Unified Suite, enabling real-time data synchronization and proper state management.

## Current State Assessment

**Frontend Data Status**: All pages use only static mock data from `src/data/mockData.ts`.

**Issues Identified**:
- Zero React Query usage despite being configured
- Zero `@workspace/api-client-react` imports
- All pages import from `mockData.ts` only
- No loading states, error handling, or data mutations
- React Query infrastructure exists but is unused

## Integration Architecture

### **Data Flow Transformation**
```
Current Flow:
Component → mockData.ts → Static UI

Target Flow:
Component → React Query Hook → API Client → Backend API → Database
                ↓
        Loading/Error States + Optimistic Updates + Caching
```

### **Component Integration Pattern**
```typescript
// Before (Mock Data)
import { crmContacts } from '@/data/mockData';

export function CRMPage() {
  const contacts = crmContacts;
  return <ContactList contacts={contacts} />;
}

// After (React Query)
import { useContactsQuery, useCreateContactMutation } from '@workspace/api-client-react';

export function CRMPage() {
  const { data: contacts, isLoading, error } = useContactsQuery();
  const createContact = useCreateContactMutation();
  
  if (isLoading) return <ContactListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <ContactList 
      contacts={contacts || []}
      onCreateContact={createContact.mutate}
    />
  );
}
```

## Step-by-Step Integration

### **Step 1: Update Custom Fetch Integration**

**File**: `artifacts/apex-os/src/App.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WouterRouter } from '@/components/WouterRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configure QueryClient with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Don't retry on validation errors
        if (error?.status === 400) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch on reconnect
    },
    mutations: {
      retry: 1, // Retry mutations once
      onError: (error) => {
        // Global mutation error handling
        console.error('Mutation error:', error);
      },
    },
  },
});

function App() {
  // Set up token getter for custom fetch
  React.useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem('accessToken');
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter>
            <Toaster />
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### **Step 2: Create Data Hooks Utilities**

**File**: `artifacts/apex-os/src/hooks/useApiData.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Generic hook for API data with loading states
export function useApiData<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime || 5 * 60 * 1000,
  });
}

// Generic mutation hook with optimistic updates
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccessMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[][];
    optimisticUpdate?: {
      queryKey: string[];
      updateFn: (oldData: any, variables: TVariables) => any;
    };
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      if (options?.optimisticUpdate) {
        await Promise.all(
          options.optimisticUpdate.queryKey.map(key => 
            queryClient.cancelQueries({ queryKey: key })
          )
        );

        // Snapshot previous value
        const previousData = options.optimisticUpdate.queryKey.map(key => 
          queryClient.getQueryData(key)
        );

        // Optimistically update
        options.optimisticUpdate.queryKey.forEach((key, index) => {
          queryClient.setQueryData(key, (old: any) => 
            options.optimisticUpdate!.updateFn(old, variables)
          );
        });

        return { previousData };
      }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach((data: any, index: number) => {
          const queryKey = options?.optimisticUpdate?.queryKey[index];
          if (queryKey) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }

      toast.error(options?.errorMessage || 'Operation failed');
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      if (options?.onSuccessMessage) {
        toast.success(options.onSuccessMessage);
      }
    },
  });
}

// Hook for paginated data
export function usePaginatedData<T>(
  queryKey: string[],
  fetchFn: (params: { page: number; limit: number; search?: string }) => Promise<{
    data: T[];
    meta: { total: number; page: number; limit: number; hasNext: boolean; hasPrev: boolean };
  }>,
  initialParams: { page?: number; limit?: number; search?: string } = {}
) {
  const [params, setParams] = React.useState({
    page: 1,
    limit: 20,
    search: '',
    ...initialParams,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => fetchFn(params),
    keepPreviousData: true, // Keep previous data while loading new page
  });

  const updateParams = (newParams: Partial<typeof params>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  return {
    data: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
    params,
    updateParams,
    hasNextPage: data?.meta?.hasNext,
    hasPrevPage: data?.meta?.hasPrev,
    nextPage: () => updateParams({ page: params.page + 1 }),
    prevPage: () => updateParams({ page: params.page - 1 }),
    goToPage: (page: number) => updateParams({ page }),
    search: (search: string) => updateParams({ search, page: 1 }),
  };
}
```

### **Step 3: CRM Page Integration**

**File**: `artifacts/apex-os/src/pages/CRM.tsx`
```typescript
import React, { useState } from 'react';
import { useContactsQuery, useCreateContactMutation, useUpdateContactMutation, useDeleteContactMutation } from '@workspace/api-client-react';
import { usePaginatedData } from '@/hooks/useApiData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Plus, Edit2, Trash2, Phone, Mail, Building } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: 'active' | 'inactive';
  assignedTo?: string;
  tags?: string[];
  notes?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function CRMPage() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Contacts data with pagination
  const {
    data: contacts,
    meta,
    isLoading,
    error,
    params,
    updateParams,
    search,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedData<Contact>(
    ['contacts'],
    async ({ page, limit, search }) => {
      const response = await fetch(`/api/crm/contacts?page=${page}&limit=${limit}&search=${search || ''}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
    { page: 1, limit: 20 }
  );

  // Mutations
  const createContactMutation = useCreateContactMutation({
    onSuccess: () => {
      toast.success('Contact created successfully');
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create contact');
    },
  });

  const updateContactMutation = useUpdateContactMutation({
    onSuccess: () => {
      toast.success('Contact updated successfully');
      setSelectedContact(null);
    },
    onError: (error) => {
      toast.error('Failed to update contact');
    },
  });

  const deleteContactMutation = useDeleteContactMutation({
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      setSelectedContact(null);
    },
    onError: (error) => {
      toast.error('Failed to delete contact');
    },
  });

  // Handle search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, search]);

  // Loading state
  if (isLoading && contacts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">CRM</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex space-x-4 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">CRM</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error loading contacts</h3>
              <p className="text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CRM</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {['contacts', 'leads', 'deals', 'email', 'engagements'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          Filters
        </Button>
      </div>

      {/* Main Content */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {contacts.length} of {meta?.total || 0} contacts
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={!hasPrevPage}
              >
                Previous
              </Button>
              <span>
                Page {params.page} of {Math.ceil((meta?.total || 0) / params.limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={!hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Contact List */}
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={undefined} />
                        <AvatarFallback>
                          {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {contact.firstName} {contact.lastName}
                          </h3>
                          <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                            {contact.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {contact.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.company && (
                            <div className="flex items-center space-x-1">
                              <Building className="h-3 w-3" />
                              <span>{contact.company}</span>
                            </div>
                          )}
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {contact.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {contact.firstName} {contact.lastName}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteContactMutation.mutate(contact.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {contacts.length === 0 && (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first contact'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Other tabs - placeholder for now */}
      {activeTab !== 'contacts' && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} coming soon
              </h3>
              <p className="text-muted-foreground">
                This feature is currently under development.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Contact Modal */}
      {isCreateModalOpen && selectedContact && (
        <ContactModal
          contact={selectedContact}
          isOpen={true}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedContact(null);
          }}
          onSubmit={(data) => {
            if (selectedContact) {
              updateContactMutation.mutate({ id: selectedContact.id, data });
            } else {
              createContactMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}

// Contact Modal Component
function ContactModal({ 
  contact, 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  contact: Contact | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = React.useState({
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    title: contact?.title || '',
    status: contact?.status || 'active',
    notes: contact?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            {contact ? 'Edit Contact' : 'Create Contact'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full p-2 border rounded"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {contact ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### **Step 4: Dashboard Integration**

**File**: `artifacts/apex-os/src/pages/Dashboard.tsx`
```typescript
import React from 'react';
import { useMetricsQuery, useActivitiesQuery } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';

interface Metrics {
  revenueMTD: number;
  activeProjects: number;
  leadsCount: number;
  overdueTasks: number;
  revenueGrowth: number;
  projectsGrowth: number;
  leadsGrowth: number;
  tasksGrowth: number;
}

interface Activity {
  id: string;
  type: 'contact_created' | 'deal_won' | 'task_completed' | 'invoice_paid';
  description: string;
  timestamp: string;
  user: string;
}

export function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useMetricsQuery();
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useActivitiesQuery();

  if (metricsLoading || activitiesLoading) {
    return <DashboardSkeleton />;
  }

  if (metricsError || activitiesError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error loading dashboard</h3>
              <p className="text-muted-foreground mt-2">
                Failed to load dashboard data. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue MTD"
          value={`$${metrics?.revenueMTD.toLocaleString() || 0}`}
          change={metrics?.revenueGrowth || 0}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Active Projects"
          value={metrics?.activeProjects || 0}
          change={metrics?.projectsGrowth || 0}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <MetricCard
          title="New Leads"
          value={metrics?.leadsCount || 0}
          change={metrics?.leadsGrowth || 0}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Overdue Tasks"
          value={metrics?.overdueTasks || 0}
          change={metrics?.tasksGrowth || 0}
          icon={<Clock className="h-4 w-4" />}
          inverse={true}
        />
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities?.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {(!activities || activities.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  inverse = false 
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  icon: React.ReactNode; 
  inverse?: boolean;
}) {
  const isPositive = inverse ? change < 0 : change > 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="flex items-center space-x-2">
            {icon}
            <div className={`flex items-center text-sm ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(change)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### **Step 5: Error Boundary Implementation**

**File**: `artifacts/apex-os/src/components/ErrorBoundary.tsx`
```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or other monitoring service
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex space-x-2">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### **Step 6: Update App.tsx with Error Boundary**

**Update**: `artifacts/apex-os/src/App.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WouterRouter } from '@/components/WouterRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ... (QueryClient configuration remains the same)

function App() {
  // Set up token getter for custom fetch
  React.useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem('accessToken');
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter>
              <Toaster />
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </WouterRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
```

## Integration Checklist

### **Component Updates Required**
- [ ] CRM page - Replace mock data with React Query
- [ ] Dashboard page - Use real metrics and activities
- [ ] Projects page - Real project and task data
- [ ] Documents page - Real document management
- [ ] Finance page - Real invoices and payments
- [ ] Assets page - Real asset tracking
- [ ] Portal page - Real client data
- [ ] Analytics page - Real analytics data
- [ ] Settings page - Real settings management

### **Common Patterns to Apply**
- [ ] Loading states with Skeleton components
- [ ] Error handling with user-friendly messages
- [ ] Optimistic updates for better UX
- [ ] Pagination for large datasets
- [ ] Search and filtering functionality
- [ ] Real-time updates with WebSocket (future)

### **Testing Requirements**
- [ ] Unit tests for custom hooks
- [ ] Component tests with React Testing Library
- [ ] Integration tests for API flows
- [ ] Error boundary testing
- [ ] Loading state testing

### **Performance Optimizations**
- [ ] Implement proper caching strategies
- [ ] Use React.memo for expensive components
- [ ] Implement virtual scrolling for large lists
- [ ] Add image lazy loading
- [ ] Optimize bundle size with code splitting

This comprehensive frontend API integration replaces static mock data with real-time, type-safe API integration across all business pages, providing a complete production-ready user experience with proper loading states, error handling, and optimistic updates.
