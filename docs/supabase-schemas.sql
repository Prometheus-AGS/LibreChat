-- =====================================================
-- LibreChat Artifact Registry - Supabase Database Schema
-- =====================================================
-- This file contains the complete database schema for the
-- artifact registry and dynamic navigation system.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ARTIFACT REGISTRY TABLES
-- =====================================================

-- Artifacts table - stores metadata about React components
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    category VARCHAR(100),
    tags TEXT[], -- Array of tags for searching
    
    -- Component metadata
    framework VARCHAR(50) DEFAULT 'react',
    ui_library VARCHAR(50), -- 'shadcn-ui', 'tailwind', etc.
    typescript BOOLEAN DEFAULT true,
    
    -- Registry information
    author VARCHAR(255),
    license VARCHAR(100) DEFAULT 'MIT',
    repository_url TEXT,
    documentation_url TEXT,
    demo_url TEXT,
    
    -- Component code and assets
    component_code TEXT NOT NULL, -- The actual React component code
    styles TEXT, -- CSS/Tailwind styles
    props_schema JSONB, -- JSON schema for component props
    examples JSONB, -- Array of usage examples
    
    -- Dependencies
    dependencies JSONB DEFAULT '[]'::jsonb, -- NPM dependencies
    peer_dependencies JSONB DEFAULT '[]'::jsonb,
    artifact_dependencies JSONB DEFAULT '[]'::jsonb, -- Other artifacts this depends on
    
    -- Usage and quality metrics
    download_count INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'private', 'draft')),
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(name, '') || ' ' || 
            coalesce(description, '') || ' ' || 
            coalesce(category, '') || ' ' ||
            array_to_string(coalesce(tags, '{}'), ' ')
        )
    ) STORED
);

-- Artifact versions table - for version history
CREATE TABLE artifact_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    component_code TEXT NOT NULL,
    styles TEXT,
    props_schema JSONB,
    changelog TEXT,
    is_breaking_change BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(artifact_id, version)
);

-- Artifact dependencies table - explicit dependency tracking
CREATE TABLE artifact_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    depends_on_artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'runtime' CHECK (dependency_type IN ('runtime', 'dev', 'peer', 'optional')),
    version_constraint VARCHAR(100), -- Semver constraint like "^1.0.0"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(artifact_id, depends_on_artifact_id)
);

-- Artifact collections - curated groups of artifacts
CREATE TABLE artifact_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_by VARCHAR(255), -- User identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection items - artifacts within collections
CREATE TABLE collection_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES artifact_collections(id) ON DELETE CASCADE,
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(collection_id, artifact_id)
);

-- =====================================================
-- DYNAMIC NAVIGATION TABLES
-- =====================================================

-- Navigation items table - dynamic menu structure
CREATE TABLE navigation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
    
    -- Display properties
    label VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- Icon name (lucide-react icons)
    badge VARCHAR(50), -- Optional badge text
    
    -- Navigation behavior
    route VARCHAR(500), -- URL route or path
    external_url TEXT, -- External link
    action_type VARCHAR(50) DEFAULT 'navigate' CHECK (action_type IN ('navigate', 'external', 'action', 'divider')),
    
    -- Conditional display
    requires_auth BOOLEAN DEFAULT false,
    required_permissions TEXT[], -- Array of required permissions
    visible_roles TEXT[], -- Array of roles that can see this item
    
    -- Supabase integration
    supabase_table VARCHAR(255), -- Table to query for dynamic items
    supabase_query TEXT, -- Custom query for dynamic content
    supabase_filter JSONB, -- Filter conditions
    
    -- State and ordering
    is_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation configurations - different nav setups
CREATE TABLE navigation_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- Configuration settings
    config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Supabase connection settings
    supabase_url TEXT,
    supabase_anon_key TEXT,
    supabase_service_key TEXT, -- Encrypted
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ARTIFACT COMPOSITION TABLES
-- =====================================================

-- Composed artifacts - artifacts that embed other artifacts
CREATE TABLE composed_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Composition structure
    composition_data JSONB NOT NULL, -- Tree structure of embedded artifacts
    layout_config JSONB, -- Layout and positioning data
    
    -- Metadata
    created_by VARCHAR(255),
    is_public BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artifact embeds - tracking which artifacts are embedded where
CREATE TABLE artifact_embeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_artifact_id UUID REFERENCES composed_artifacts(id) ON DELETE CASCADE,
    embedded_artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    
    -- Embed configuration
    embed_config JSONB DEFAULT '{}'::jsonb,
    position_data JSONB, -- X, Y, width, height, etc.
    
    -- State
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USAGE ANALYTICS TABLES
-- =====================================================

-- Artifact usage tracking
CREATE TABLE artifact_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    
    -- Usage context
    user_id VARCHAR(255), -- Optional user identifier
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Usage details
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'embed', 'copy'
    context_data JSONB, -- Additional context
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation analytics
CREATE TABLE navigation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    navigation_item_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
    
    -- Analytics data
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    action VARCHAR(50) NOT NULL, -- 'click', 'hover', 'view'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Artifacts indexes
CREATE INDEX idx_artifacts_component_id ON artifacts(component_id);
CREATE INDEX idx_artifacts_category ON artifacts(category);
CREATE INDEX idx_artifacts_status ON artifacts(status);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at DESC);
CREATE INDEX idx_artifacts_search_vector ON artifacts USING GIN(search_vector);
CREATE INDEX idx_artifacts_tags ON artifacts USING GIN(tags);
CREATE INDEX idx_artifacts_featured ON artifacts(is_featured) WHERE is_featured = true;

-- Navigation indexes
CREATE INDEX idx_navigation_items_parent_id ON navigation_items(parent_id);
CREATE INDEX idx_navigation_items_sort_order ON navigation_items(sort_order);
CREATE INDEX idx_navigation_items_enabled ON navigation_items(is_enabled) WHERE is_enabled = true;

-- Dependencies indexes
CREATE INDEX idx_artifact_dependencies_artifact_id ON artifact_dependencies(artifact_id);
CREATE INDEX idx_artifact_dependencies_depends_on ON artifact_dependencies(depends_on_artifact_id);

-- Usage analytics indexes
CREATE INDEX idx_artifact_usage_artifact_id ON artifact_usage(artifact_id);
CREATE INDEX idx_artifact_usage_created_at ON artifact_usage(created_at DESC);
CREATE INDEX idx_navigation_analytics_item_id ON navigation_analytics(navigation_item_id);
CREATE INDEX idx_navigation_analytics_created_at ON navigation_analytics(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE composed_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_analytics ENABLE ROW LEVEL SECURITY;

-- Public read access for active artifacts
CREATE POLICY "Public artifacts are viewable by everyone" ON artifacts
    FOR SELECT USING (status = 'active');

-- Public read access for navigation items
CREATE POLICY "Enabled navigation items are viewable by everyone" ON navigation_items
    FOR SELECT USING (is_enabled = true);

-- Usage tracking policies (insert only)
CREATE POLICY "Anyone can insert usage data" ON artifact_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert navigation analytics" ON navigation_analytics
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_items_updated_at BEFORE UPDATE ON navigation_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_configs_updated_at BEFORE UPDATE ON navigation_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_composed_artifacts_updated_at BEFORE UPDATE ON composed_artifacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_artifact_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action = 'download' OR NEW.action = 'embed' THEN
        UPDATE artifacts 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.artifact_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-increment usage count
CREATE TRIGGER increment_usage_on_artifact_usage AFTER INSERT ON artifact_usage
    FOR EACH ROW EXECUTE FUNCTION increment_artifact_usage();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample navigation configuration
INSERT INTO navigation_configs (name, slug, description, is_default, config_data) VALUES
('Default Navigation', 'default', 'Default navigation configuration for LibreChat', true, '{
    "theme": "default",
    "collapsible": true,
    "showIcons": true,
    "maxDepth": 3
}'::jsonb);

-- Insert sample navigation items
INSERT INTO navigation_items (label, description, icon, route, sort_order) VALUES
('Dashboard', 'Main dashboard view', 'home', '/dashboard', 1),
('Artifacts', 'Browse and manage artifacts', 'code', '/artifacts', 2),
('Collections', 'Curated artifact collections', 'folder', '/collections', 3),
('Settings', 'Application settings', 'settings', '/settings', 4);

-- Insert sample artifact
INSERT INTO artifacts (
    component_id, name, description, category, tags, 
    component_code, props_schema, framework, ui_library
) VALUES (
    'user-card', 
    'User Card', 
    'A reusable user card component with avatar and details',
    'ui-components',
    ARRAY['card', 'user', 'profile', 'avatar'],
    'import React from "react";

interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  name, email, avatar, role 
}) => {
  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="flex items-center space-x-3">
        {avatar && (
          <img 
            src={avatar} 
            alt={name}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-gray-600">{email}</p>
          {role && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {role}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};',
    '{
      "type": "object",
      "properties": {
        "name": {"type": "string", "description": "User full name"},
        "email": {"type": "string", "description": "User email address"},
        "avatar": {"type": "string", "description": "Avatar image URL"},
        "role": {"type": "string", "description": "User role or title"}
      },
      "required": ["name", "email"]
    }'::jsonb,
    'react',
    'tailwind'
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for artifact search with dependencies
CREATE VIEW artifact_search_view AS
SELECT 
    a.*,
    COALESCE(dep_count.count, 0) as dependency_count,
    COALESCE(usage_stats.recent_usage, 0) as recent_usage_count
FROM artifacts a
LEFT JOIN (
    SELECT artifact_id, COUNT(*) as count
    FROM artifact_dependencies
    GROUP BY artifact_id
) dep_count ON a.id = dep_count.artifact_id
LEFT JOIN (
    SELECT artifact_id, COUNT(*) as recent_usage
    FROM artifact_usage
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY artifact_id
) usage_stats ON a.id = usage_stats.artifact_id
WHERE a.status = 'active';

-- View for navigation tree structure
CREATE VIEW navigation_tree_view AS
WITH RECURSIVE nav_tree AS (
    -- Base case: root items
    SELECT 
        id, parent_id, label, description, icon, badge,
        route, external_url, action_type, is_enabled, sort_order,
        0 as depth, ARRAY[sort_order] as path
    FROM navigation_items 
    WHERE parent_id IS NULL AND is_enabled = true
    
    UNION ALL
    
    -- Recursive case: child items
    SELECT 
        ni.id, ni.parent_id, ni.label, ni.description, ni.icon, ni.badge,
        ni.route, ni.external_url, ni.action_type, ni.is_enabled, ni.sort_order,
        nt.depth + 1, nt.path || ni.sort_order
    FROM navigation_items ni
    JOIN nav_tree nt ON ni.parent_id = nt.id
    WHERE ni.is_enabled = true
)
SELECT * FROM nav_tree ORDER BY path;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE artifacts IS 'Stores metadata and code for reusable React components';
COMMENT ON TABLE navigation_items IS 'Dynamic navigation menu structure loaded from Supabase';
COMMENT ON TABLE artifact_dependencies IS 'Tracks dependencies between artifacts for proper loading order';
COMMENT ON TABLE composed_artifacts IS 'Artifacts that embed other artifacts in complex layouts';
COMMENT ON TABLE artifact_usage IS 'Analytics tracking for artifact usage patterns';

COMMENT ON COLUMN artifacts.search_vector IS 'Full-text search vector for efficient artifact discovery';
COMMENT ON COLUMN artifacts.component_code IS 'The actual React component source code';
COMMENT ON COLUMN artifacts.props_schema IS 'JSON Schema defining component props for validation and documentation';
COMMENT ON COLUMN navigation_items.supabase_query IS 'Custom SQL query for dynamic navigation items';