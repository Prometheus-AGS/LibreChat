const { logger } = require('~/config');

/**
 * Artifact Registry Controller
 *
 * Backend for Frontend (BFF) API for artifact registry component fetching.
 * This controller enables the containment system by providing component code
 * only at runtime, preventing LLMs from seeing implementation details during
 * composition.
 */

/**
 * Mock artifact registry data
 * In production, this would come from MongoDB or external registry
 */
const mockArtifacts = new Map([
  [
    'user-card',
    {
      id: 'user-card',
      name: 'User Card',
      version: '1.0.0',
      description: 'A reusable user profile card component',
      author: 'LibreChat Team',
      tags: ['user', 'profile', 'card'],
      category: 'display',
      dependencies: [],
      supabaseConfig: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      isPublic: true,
      downloadCount: 150,
    },
  ],
  [
    'data-table',
    {
      id: 'data-table',
      name: 'Data Table',
      version: '2.1.0',
      description: 'Advanced data table with sorting, filtering, and pagination',
      author: 'LibreChat Team',
      tags: ['table', 'data', 'sorting', 'pagination'],
      category: 'data-display',
      dependencies: [{ id: 'user-card', name: 'User Card', version: '1.0.0', required: false }],
      supabaseConfig: {
        url: 'https://example.supabase.co',
        anonKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
        tables: ['users', 'profiles'],
        functions: ['get_user_stats'],
        storage: true,
        realtime: true,
      },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-02-01'),
      isPublic: true,
      downloadCount: 89,
    },
  ],
]);

/**
 * Mock component code storage
 * In production, this would be stored in a secure location
 */
const mockComponentCode = new Map([
  [
    'user-card@1.0.0',
    `
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  showRole?: boolean;
}

export default function UserCard({ user, showRole = true }: UserCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <CardTitle className="text-sm font-medium">{user.name}</CardTitle>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>
      {showRole && user.role && (
        <CardContent>
          <div className="text-xs text-muted-foreground">
            Role: {user.role}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
`,
  ],
  [
    'data-table@2.1.0',
    `
import React, { useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UserCard from './UserCard';

interface DataTableProps {
  supabaseConfig: {
    url: string;
    anonKey: string;
    tables?: string[];
  };
  tableName: string;
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
  }>;
  showUserCards?: boolean;
}

export default function DataTable({ 
  supabaseConfig, 
  tableName, 
  columns,
  showUserCards = false 
}: DataTableProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  const supabase = useMemo(() => 
    createClient(supabaseConfig.url, supabaseConfig.anonKey), 
    [supabaseConfig]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [tableName, supabase]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={fetchData} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  {column.label}
                  {sortConfig.key === column.key && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {showUserCards && column.key === 'user' && row[column.key] ? (
                      <UserCard user={row[column.key]} />
                    ) : (
                      String(row[column.key] || '')
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
`,
  ],
]);

/**
 * Get artifact registry - list all available artifacts
 */
const getArtifactRegistry = async (req, res) => {
  try {
    const artifacts = Array.from(mockArtifacts.values());

    res.json({
      success: true,
      artifacts,
      total: artifacts.length,
    });
  } catch (error) {
    logger.error('Error fetching artifact registry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch artifact registry',
      error: error.message,
    });
  }
};

/**
 * Search artifacts in registry
 */
const searchArtifacts = async (req, res) => {
  try {
    const { query, category, tags, author, limit = 20, offset = 0 } = req.query;

    let artifacts = Array.from(mockArtifacts.values());

    // Apply filters
    if (query) {
      const searchTerm = query.toLowerCase();
      artifacts = artifacts.filter(
        (artifact) =>
          artifact.name.toLowerCase().includes(searchTerm) ||
          artifact.description.toLowerCase().includes(searchTerm) ||
          artifact.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      );
    }

    if (category) {
      artifacts = artifacts.filter((artifact) => artifact.category === category);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      artifacts = artifacts.filter((artifact) =>
        tagArray.some((tag) => artifact.tags.includes(tag)),
      );
    }

    if (author) {
      artifacts = artifacts.filter((artifact) => artifact.author === author);
    }

    // Apply pagination
    const total = artifacts.length;
    const paginatedArtifacts = artifacts.slice(offset, offset + limit);

    res.json({
      success: true,
      artifacts: paginatedArtifacts,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    logger.error('Error searching artifacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search artifacts',
      error: error.message,
    });
  }
};

/**
 * Fetch component code - BFF endpoint for runtime component loading
 * This is the key to the containment system - LLMs never see this code
 */
const fetchComponent = async (req, res) => {
  try {
    const { id, version = 'latest', includeDependencies = true } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Component ID is required',
      });
    }

    // Get artifact metadata
    const artifact = mockArtifacts.get(id);
    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: 'Artifact not found',
      });
    }

    // Resolve version (in production, this would handle semantic versioning)
    const resolvedVersion = version === 'latest' ? artifact.version : version;
    const codeKey = `${id}@${resolvedVersion}`;

    // Get component code
    const code = mockComponentCode.get(codeKey);
    if (!code) {
      return res.status(404).json({
        success: false,
        message: 'Component code not found for specified version',
      });
    }

    // Prepare response
    const response = {
      success: true,
      artifact,
      code,
      resolvedVersion,
    };

    // Include dependencies if requested
    if (includeDependencies && artifact.dependencies.length > 0) {
      response.dependencies = [];

      for (const dep of artifact.dependencies) {
        const depArtifact = mockArtifacts.get(dep.id);
        const depCodeKey = `${dep.id}@${dep.version}`;
        const depCode = mockComponentCode.get(depCodeKey);

        if (depArtifact && depCode) {
          response.dependencies.push({
            artifact: depArtifact,
            code: depCode,
            resolvedVersion: dep.version,
          });
        }
      }
    }

    res.json(response);
  } catch (error) {
    logger.error('Error fetching component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch component',
      error: error.message,
    });
  }
};

/**
 * Load dynamic navigation from Supabase
 */
const loadDynamicNavigation = async (req, res) => {
  try {
    const { supabaseConfig } = req.body;

    if (!supabaseConfig || !supabaseConfig.url || !supabaseConfig.anonKey) {
      return res.status(400).json({
        success: false,
        message: 'Valid Supabase configuration is required',
      });
    }

    // Mock navigation items (in production, this would query Supabase)
    const navigationItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        children: [],
        supabaseQuery: {
          table: 'dashboard_stats',
          select: 'count',
          where: { active: true },
        },
      },
      {
        id: 'users',
        label: 'Users',
        href: '/users',
        icon: 'Users',
        children: [
          {
            id: 'all-users',
            label: 'All Users',
            href: '/users/all',
            supabaseQuery: {
              table: 'users',
              select: '*',
              orderBy: 'created_at desc',
            },
          },
          {
            id: 'active-users',
            label: 'Active Users',
            href: '/users/active',
            supabaseQuery: {
              table: 'users',
              select: '*',
              where: { status: 'active' },
            },
          },
        ],
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: 'BarChart3',
        children: [],
        requiresAuth: true,
      },
    ];

    res.json({
      success: true,
      items: navigationItems,
      supabaseConfig: {
        url: supabaseConfig.url,
        anonKey: supabaseConfig.anonKey,
        // Don't expose sensitive keys
      },
      refreshInterval: 300000, // 5 minutes
    });
  } catch (error) {
    logger.error('Error loading dynamic navigation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load navigation',
      error: error.message,
    });
  }
};

/**
 * Detect shadcn-ui version and capabilities
 */
const detectShadcnVersion = async (req, res) => {
  try {
    // Mock detection (in production, this would analyze package.json and config files)
    const detection = {
      detected: true,
      version: {
        version: '0.8.0',
        isCanary: true,
        hasSidebar: true,
        features: ['sidebar', 'breadcrumb', 'app-sidebar', 'sidebar-provider'],
      },
      packageJson: {
        dependencies: {
          '@radix-ui/react-slot': '^1.0.2',
          'class-variance-authority': '^0.7.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^2.0.0',
        },
      },
      configFiles: ['components.json', 'tailwind.config.js'],
    };

    res.json(detection.version);
  } catch (error) {
    logger.error('Error detecting shadcn version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect shadcn version',
      error: error.message,
    });
  }
};

/**
 * Save a new artifact or create a new version of existing artifact
 */
const saveArtifact = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      id: existingId,
      name,
      description,
      category,
      tags = [],
      version,
      content,
      type,
      isPublic = true,
      repositoryUrl,
      documentation,
    } = req.body;

    // Validation
    if (!name || !description || !content || !type || !version) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, content, type, version',
      });
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      return res.status(400).json({
        error: 'Version must be in format x.y.z (e.g., 1.0.0)',
      });
    }

    // Generate artifact ID if not updating existing
    const artifactId = existingId || generateArtifactId(name);

    // Prepare artifact data
    const artifactData = {
      id: artifactId,
      name: name.trim(),
      description: description.trim(),
      category,
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      version,
      content,
      type,
      isPublic,
      repositoryUrl: repositoryUrl || null,
      documentation: documentation || null,
      userId,
      author: req.user.name || req.user.email || 'Unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // For now, store in memory (in production, this would go to Supabase)
    mockArtifacts.set(artifactId, {
      ...artifactData,
      analytics: {
        downloads: 0,
        views: 0,
        likes: 0,
        averageRating: 0,
        ratingCount: 0,
      },
    });

    res.status(201).json({
      id: artifactId,
      version,
      message: existingId ? 'Artifact updated successfully' : 'Artifact saved successfully',
      artifact: artifactData,
    });
  } catch (error) {
    logger.error('Error in saveArtifact:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Update an existing artifact
 */
const updateArtifact = async (req, res) => {
  try {
    const userId = req.user.id;
    const artifactId = req.params.id;
    const updateData = req.body;

    const existingArtifact = mockArtifacts.get(artifactId);
    if (!existingArtifact || existingArtifact.userId !== userId) {
      return res.status(404).json({
        error: 'Artifact not found or you do not have permission to update it',
      });
    }

    const updatedArtifact = {
      ...existingArtifact,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    mockArtifacts.set(artifactId, updatedArtifact);

    res.json({
      message: 'Artifact updated successfully',
      artifact: updatedArtifact,
    });
  } catch (error) {
    logger.error('Error in updateArtifact:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Delete an artifact
 */
const deleteArtifact = async (req, res) => {
  try {
    const userId = req.user.id;
    const artifactId = req.params.id;

    const existingArtifact = mockArtifacts.get(artifactId);
    if (!existingArtifact) {
      return res.status(404).json({
        error: 'Artifact not found',
      });
    }

    if (existingArtifact.userId !== userId) {
      return res.status(403).json({
        error: 'You can only delete your own artifacts',
      });
    }

    mockArtifacts.delete(artifactId);

    res.json({
      message: 'Artifact deleted successfully',
    });
  } catch (error) {
    logger.error('Error in deleteArtifact:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Get artifact by ID
 */
const getArtifactById = async (req, res) => {
  try {
    const artifactId = req.params.id;
    const artifact = mockArtifacts.get(artifactId);

    if (!artifact) {
      return res.status(404).json({
        error: 'Artifact not found',
      });
    }

    res.json({
      success: true,
      artifact,
    });
  } catch (error) {
    logger.error('Error in getArtifactById:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Get all versions of an artifact
 */
const getArtifactVersions = async (req, res) => {
  try {
    const artifactId = req.params.id;

    // Filter artifacts by ID (in real implementation, this would be a proper query)
    const versions = Array.from(mockArtifacts.values())
      .filter((artifact) => artifact.id === artifactId)
      .map((artifact) => ({
        id: artifact.id,
        name: artifact.name,
        version: artifact.version,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
        author: artifact.author,
        isPublic: artifact.isPublic,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      versions,
    });
  } catch (error) {
    logger.error('Error in getArtifactVersions:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Get artifacts by category
 */
const getArtifactsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const limit = parseInt(req.query.limit) || 50;

    const artifacts = Array.from(mockArtifacts.values())
      .filter((artifact) => artifact.category === category && artifact.isPublic)
      .slice(0, limit);

    res.json({
      artifacts,
      category,
      total: artifacts.length,
    });
  } catch (error) {
    logger.error('Error in getArtifactsByCategory:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Get artifacts by tags
 */
const getArtifactsByTag = async (req, res) => {
  try {
    const tagsParam = req.query.tags;
    const limit = parseInt(req.query.limit) || 50;

    if (!tagsParam) {
      return res.status(400).json({
        error: 'Tags parameter is required',
      });
    }

    const tags = tagsParam.split(',').map((tag) => tag.trim());

    const artifacts = Array.from(mockArtifacts.values())
      .filter(
        (artifact) =>
          artifact.isPublic && artifact.tags && artifact.tags.some((tag) => tags.includes(tag)),
      )
      .slice(0, limit);

    res.json({
      artifacts,
      tags,
      total: artifacts.length,
    });
  } catch (error) {
    logger.error('Error in getArtifactsByTag:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Get component code - alias for fetchComponent
 */
const getComponentCode = fetchComponent;

/**
 * Get dynamic navigation - alias for loadDynamicNavigation
 */
const getDynamicNavigation = loadDynamicNavigation;

/**
 * Generate a unique artifact ID based on name
 */
function generateArtifactId(name) {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);

  return `${cleanName}-${timestamp}-${random}`;
}

module.exports = {
  getArtifactRegistry,
  searchArtifacts,
  fetchComponent,
  loadDynamicNavigation,
  detectShadcnVersion,
  saveArtifact,
  updateArtifact,
  deleteArtifact,
  getArtifactById,
  getArtifactVersions,
  getArtifactsByCategory,
  getArtifactsByTag,
  getComponentCode,
  getDynamicNavigation,
};
