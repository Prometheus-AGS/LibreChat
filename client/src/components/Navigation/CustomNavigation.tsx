import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Settings,
  Database,
  Code,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import type { NavigationItem } from 'librechat-data-provider';

interface CustomNavigationProps {
  items: NavigationItem[];
  onNavigate?: (item: NavigationItem) => void;
  className?: string;
}

/**
 * Custom navigation component for shadcn-ui stable builds
 * Provides a collapsible navigation menu with mobile support
 */
export const CustomNavigation: React.FC<CustomNavigationProps> = ({
  items,
  onNavigate,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleItemClick = (item: NavigationItem) => {
    onNavigate?.(item);
    // Close mobile menu after navigation
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const paddingLeft = `${(depth + 1) * 16}px`;

    return (
      <div key={item.id} className="w-full">
        <div className="flex items-center">
          <button
            onClick={() => handleItemClick(item)}
            className={`flex flex-1 items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${item.isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'} ${!item.isEnabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
            style={{ paddingLeft }}
            disabled={!item.isEnabled}
            title={item.description}
          >
            {getIcon(item.icon)}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {item.badge}
              </span>
            )}
          </button>

          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700">
            {item.children?.map((child) => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        <Database className="mx-auto mb-3 h-12 w-12 opacity-50" />
        <p className="text-sm font-medium">No navigation items available</p>
        <p className="mt-1 text-xs">Check your Supabase configuration</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Mobile Menu Button */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700 md:hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation Content */}
      <div
        className={` ${isOpen ? 'block' : 'hidden'} absolute left-0 right-0 top-full z-50 border-r border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 md:relative md:block md:shadow-none`}
      >
        <div className="p-4">
          <div className="mb-4 hidden md:block">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Navigation
            </h2>
          </div>

          <div className="space-y-1">{items.map((item) => renderNavigationItem(item))}</div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
