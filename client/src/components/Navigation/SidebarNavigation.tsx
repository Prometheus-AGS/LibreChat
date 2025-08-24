import React from 'react';
import { ChevronRight, Home, Settings, Database, Code, FileText } from 'lucide-react';
import type { NavigationItem } from 'librechat-data-provider';

interface SidebarNavigationProps {
  items: NavigationItem[];
  onNavigate?: (item: NavigationItem) => void;
  className?: string;
}

/**
 * Sidebar navigation component for shadcn-ui canary builds
 * Uses the built-in sidebar components and styling
 */
export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  items,
  onNavigate,
  className = '',
}) => {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'settings':
        return <Settings className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'file-text':
        return <FileText className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const handleItemClick = (item: NavigationItem) => {
    onNavigate?.(item);
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const paddingLeft = `${(depth + 1) * 12}px`;

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => handleItemClick(item)}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200 hover:bg-accent hover:text-accent-foreground ${item.isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} ${!item.isEnabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
          style={{ paddingLeft }}
          disabled={!item.isEnabled}
          title={item.description}
        >
          {getIcon(item.icon)}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
              {item.badge}
            </span>
          )}
          {hasChildren && <ChevronRight className="h-3 w-3 opacity-50" />}
        </button>

        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className={`p-4 text-center text-muted-foreground ${className}`}>
        <Database className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No navigation items available</p>
        <p className="mt-1 text-xs">Check your Supabase configuration</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-1 p-2 ${className}`}>
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Navigation
      </div>
      {items.map((item) => renderNavigationItem(item))}
    </div>
  );
};
