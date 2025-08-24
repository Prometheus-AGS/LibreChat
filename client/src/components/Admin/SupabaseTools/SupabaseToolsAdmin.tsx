import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Trash2,
  Edit,
  TestTube,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { SupabaseTool, SupabaseToolType } from 'librechat-data-provider';

interface SupabaseToolsAdminProps {
  className?: string;
}

interface ToolsResponse {
  success: boolean;
  data: {
    tools: SupabaseTool[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface ToolStatsResponse {
  success: boolean;
  data: {
    stats: {
      total: number;
      byScope: {
        user: number;
        system: number;
      };
      byType: {
        hosted: number;
        selfHosted: number;
      };
      byHealth: {
        healthy: number;
        unhealthy: number;
        unknown: number;
      };
      recent: number;
    };
  };
}

const SupabaseToolsAdmin: React.FC<SupabaseToolsAdminProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<SupabaseToolType | 'all'>('all');
  const [selectedScope, setSelectedScope] = useState<'user' | 'system' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTool, setEditingTool] = useState<SupabaseTool | null>(null);

  const queryClient = useQueryClient();

  // Fetch tools with pagination and filters
  const {
    data: toolsData,
    isLoading: toolsLoading,
    error: toolsError,
    refetch: refetchTools,
  } = useQuery<ToolsResponse>({
    queryKey: ['supabase-tools-admin', currentPage, searchTerm, selectedType, selectedScope],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedScope !== 'all' && { scope: selectedScope }),
      });

      const response = await fetch(`/api/supabase-tools?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }

      return response.json();
    },
  });

  // Fetch tool statistics
  const { data: statsData, isLoading: statsLoading } = useQuery<ToolStatsResponse>({
    queryKey: ['supabase-tools-stats'],
    queryFn: async () => {
      const response = await fetch('/api/supabase-tools/stats', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      return response.json();
    },
  });

  // Delete tool mutation
  const deleteMutation = useMutation({
    mutationFn: async (toolId: string) => {
      const response = await fetch(`/api/supabase-tools/${toolId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tool');
      }

      return response.json();
    },
    onSuccess: () => {
      console.log('Tool deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['supabase-tools-admin'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-tools-stats'] });
    },
    onError: (error: Error) => {
      console.error(`Failed to delete tool: ${error.message}`);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (toolIds: string[]) => {
      const response = await fetch('/api/supabase-tools/bulk/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ toolIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete tools');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log(`Deleted ${data.data.deletedCount} tools successfully`);
      setSelectedTools([]);
      queryClient.invalidateQueries({ queryKey: ['supabase-tools-admin'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-tools-stats'] });
    },
    onError: (error: Error) => {
      console.error(`Failed to delete tools: ${error.message}`);
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (toolId: string) => {
      const response = await fetch(`/api/supabase-tools/${toolId}/test`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to test connection');
      }

      return response.json();
    },
    onSuccess: (data, toolId) => {
      const result = data.data.connectionTest;
      if (result.success) {
        console.log(`Connection test successful (${result.responseTime}ms)`);
      } else {
        console.error(`Connection test failed: ${result.error}`);
      }
      queryClient.invalidateQueries({ queryKey: ['supabase-tools-admin'] });
    },
    onError: (error: Error) => {
      console.error(`Connection test failed: ${error.message}`);
    },
  });

  // Health check all mutation
  const healthCheckAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/supabase-tools/health/check-all', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to check health');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const summary = data.data.summary;
      console.log(
        `Health check completed: ${summary.healthy} healthy, ${summary.unhealthy} unhealthy`,
      );
      queryClient.invalidateQueries({ queryKey: ['supabase-tools-admin'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-tools-stats'] });
    },
    onError: (error: Error) => {
      console.error(`Health check failed: ${error.message}`);
    },
  });

  // Export tools
  const handleExport = async () => {
    try {
      const response = await fetch('/api/supabase-tools/export', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export tools');
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supabase-tools-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`Exported ${data.data.count} tools`);
    } catch (error) {
      console.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle tool selection
  const handleToolSelection = (toolId: string, selected: boolean) => {
    if (selected) {
      setSelectedTools([...selectedTools, toolId]);
    } else {
      setSelectedTools(selectedTools.filter((id) => id !== toolId));
    }
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected && toolsData?.data.tools) {
      setSelectedTools(toolsData.data.tools.map((tool) => tool._id));
    } else {
      setSelectedTools([]);
    }
  };

  // Get health status icon
  const getHealthIcon = (health?: { status: string; error?: string }) => {
    if (!health || health.status === 'unknown') {
      return <Clock className="h-4 w-4 text-gray-400" />;
    }

    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Get type badge color
  const getTypeBadgeColor = (type: SupabaseToolType) => {
    switch (type) {
      case 'hosted':
        return 'bg-blue-100 text-blue-800';
      case 'self-hosted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get scope badge color
  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case 'system':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tools = toolsData?.data.tools || [];
  const pagination = toolsData?.data.pagination;
  const stats = statsData?.data.stats;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Supabase Tools Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage system-wide and user Supabase tool configurations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => healthCheckAllMutation.mutate()}
            disabled={healthCheckAllMutation.isLoading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${healthCheckAllMutation.isLoading ? 'animate-spin' : ''}`}
            />
            Health Check
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Tool
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Tools
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Healthy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.byHealth.healthy}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Unhealthy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.byHealth.unhealthy}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Plus className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Recent (7d)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.recent}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm leading-5 placeholder-gray-500 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as SupabaseToolType | 'all')}
                  className="block w-full rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 sm:text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="hosted">Hosted</option>
                  <option value="self-hosted">Self-hosted</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value as 'user' | 'system' | 'all')}
                  className="block w-full rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 sm:text-sm"
                >
                  <option value="all">All Scopes</option>
                  <option value="system">System</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
          </div>

          {selectedTools.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => bulkDeleteMutation.mutate(selectedTools)}
                disabled={bulkDeleteMutation.isLoading}
                className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-1 text-sm font-medium leading-4 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tools Table */}
      <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          {toolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : toolsError ? (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Error loading tools
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {toolsError instanceof Error ? toolsError.message : 'Unknown error'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => refetchTools()}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          ) : tools.length === 0 ? (
            <div className="py-12 text-center">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No tools found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new Supabase tool configuration.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tool
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={selectedTools.length === tools.length && tools.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Tool
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Scope
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Health
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {tools.map((tool) => (
                      <tr key={tool._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="whitespace-nowrap px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTools.includes(tool._id)}
                            onChange={(e) => handleToolSelection(tool._id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {tool.name}
                              </div>
                              {tool.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {tool.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeColor(tool.type)}`}
                          >
                            {tool.type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getScopeBadgeColor(tool.scope)}`}
                          >
                            {tool.scope}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            {getHealthIcon(tool.health)}
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                              {tool.health?.status || 'unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(tool.createdAt).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => testConnectionMutation.mutate(tool._id)}
                              disabled={testConnectionMutation.isLoading}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Test Connection"
                            >
                              <TestTube className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTool(tool);
                                setShowEditModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(tool._id)}
                              disabled={deleteMutation.isLoading}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                      disabled={currentPage === pagination.pages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{' '}
                        <span className="font-medium">
                          {(currentPage - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                          }
                          disabled={currentPage === pagination.pages}
                          className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Create Tool</h3>
                <p className="mt-2 text-sm text-gray-500">Create modal content would go here</p>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTool && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Edit Tool: {editingTool.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">Edit modal content would go here</p>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTool(null);
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Import Tools</h3>
                <p className="mt-2 text-sm text-gray-500">Import modal content would go here</p>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseToolsAdmin;
