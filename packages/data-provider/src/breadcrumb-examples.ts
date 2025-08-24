// ============================================================================
// BREADCRUMB NAVIGATION EXAMPLES
// ============================================================================

// Example 1: Basic Breadcrumb Navigation with Clickable Items
export const basicBreadcrumbExample = `import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  current?: boolean
}

const BasicBreadcrumb = () => {
  const [currentPath, setCurrentPath] = React.useState("products/electronics/smartphones")
  
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Home",
      href: "/",
      onClick: () => setCurrentPath("")
    },
    {
      label: "Products",
      href: "/products",
      onClick: () => setCurrentPath("products")
    },
    {
      label: "Electronics",
      href: "/products/electronics",
      onClick: () => setCurrentPath("products/electronics")
    },
    {
      label: "Smartphones",
      current: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-8">
          <Home className="h-4 w-4" />
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              {item.current ? (
                <span className="font-medium text-gray-900">{item.label}</span>
              ) : (
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-gray-500 hover:text-gray-900"
                  onClick={item.onClick}
                >
                  {item.label}
                </Button>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {breadcrumbItems[breadcrumbItems.length - 1].label}
          </h1>
          <p className="text-gray-600 mb-6">
            Current path: <code className="bg-gray-100 px-2 py-1 rounded">{currentPath || "home"}</code>
          </p>
          <p className="text-gray-600">
            This is a basic breadcrumb navigation example. Click on any breadcrumb item to navigate back.
            The breadcrumb shows the current location in the site hierarchy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BasicBreadcrumb`;

// Example 2: Breadcrumb with Dropdown for Collapsed Items
export const dropdownBreadcrumbExample = `import * as React from "react"
import { ChevronRight, Home, MoreHorizontal, ChevronDown } from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  current?: boolean
}

const DropdownBreadcrumb = () => {
  const [currentPath, setCurrentPath] = React.useState("company/departments/engineering/teams/frontend/projects/dashboard")
  
  const allBreadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", onClick: () => setCurrentPath("") },
    { label: "Company", onClick: () => setCurrentPath("company") },
    { label: "Departments", onClick: () => setCurrentPath("company/departments") },
    { label: "Engineering", onClick: () => setCurrentPath("company/departments/engineering") },
    { label: "Teams", onClick: () => setCurrentPath("company/departments/engineering/teams") },
    { label: "Frontend", onClick: () => setCurrentPath("company/departments/engineering/teams/frontend") },
    { label: "Projects", onClick: () => setCurrentPath("company/departments/engineering/teams/frontend/projects") },
    { label: "Dashboard", current: true }
  ]

  const maxVisibleItems = 4
  const shouldCollapse = allBreadcrumbItems.length > maxVisibleItems

  const visibleItems = shouldCollapse 
    ? [
        allBreadcrumbItems[0], // Always show home
        ...allBreadcrumbItems.slice(-(maxVisibleItems - 1)) // Show last few items
      ]
    : allBreadcrumbItems

  const collapsedItems = shouldCollapse 
    ? allBreadcrumbItems.slice(1, -(maxVisibleItems - 1))
    : []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation with Dropdown */}
        <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-8">
          <Home className="h-4 w-4" />
          
          {visibleItems.map((item, index) => (
            <React.Fragment key={index}>
              {/* Show collapsed items dropdown after home */}
              {index === 1 && shouldCollapse && collapsedItems.length > 0 && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-gray-500 hover:text-gray-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {collapsedItems.map((collapsedItem, idx) => (
                        <DropdownMenuItem
                          key={idx}
                          onClick={collapsedItem.onClick}
                          className="cursor-pointer"
                        >
                          {collapsedItem.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              
              {/* Regular breadcrumb separator */}
              {index > 0 && !(index === 1 && shouldCollapse) && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              
              {/* Breadcrumb item */}
              {item.current ? (
                <span className="font-medium text-gray-900">{item.label}</span>
              ) : (
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-gray-500 hover:text-gray-900"
                  onClick={item.onClick}
                >
                  {item.label}
                </Button>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard Project
          </h1>
          <p className="text-gray-600 mb-6">
            Current path: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{currentPath || "home"}</code>
          </p>
          <p className="text-gray-600 mb-4">
            This breadcrumb automatically collapses long paths and shows collapsed items in a dropdown menu.
            This is useful for deep navigation hierarchies where showing all items would take too much space.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Automatically collapses when there are more than 4 items</li>
              <li>• Always shows the first (home) and last few items</li>
              <li>• Collapsed items are accessible via dropdown</li>
              <li>• Maintains full navigation functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DropdownBreadcrumb`;

// Example 3: Dynamic Breadcrumb with Home Button Integration
export const dynamicBreadcrumbExample = `import * as React from "react"
import { ChevronRight, Home, ArrowLeft, Bookmark, Share } from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  current?: boolean
  icon?: React.ReactNode
}

const DynamicBreadcrumb = () => {
  const [navigationHistory, setNavigationHistory] = React.useState<string[]>([""])
  const [currentPath, setCurrentPath] = React.useState("dashboard/analytics/reports/monthly")
  const [bookmarks, setBookmarks] = React.useState<string[]>(["dashboard", "dashboard/analytics"])

  const navigate = (path: string) => {
    setNavigationHistory(prev => [...prev, currentPath])
    setCurrentPath(path)
  }

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const previousPath = navigationHistory[navigationHistory.length - 1]
      setNavigationHistory(prev => prev.slice(0, -1))
      setCurrentPath(previousPath)
    }
  }

  const toggleBookmark = (path: string) => {
    setBookmarks(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    )
  }

  const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
    if (!path) return [{ label: "Home", current: true, icon: <Home className="h-4 w-4" /> }]
    
    const segments = path.split('/')
    const items: BreadcrumbItem[] = [
      { 
        label: "Home", 
        onClick: () => navigate(""),
        icon: <Home className="h-4 w-4" />
      }
    ]
    
    segments.forEach((segment, index) => {
      const segmentPath = segments.slice(0, index + 1).join('/')
      const isLast = index === segments.length - 1
      
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        onClick: isLast ? undefined : () => navigate(segmentPath),
        current: isLast
      })
    })
    
    return items
  }

  const breadcrumbItems = generateBreadcrumbs(currentPath)
  const canGoBack = navigationHistory.length > 1
  const isBookmarked = bookmarks.includes(currentPath)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Navigation Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <div className="flex items-center justify-between">
            {/* Left side - Back button and Breadcrumb */}
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goBack}
                    disabled={!canGoBack}
                    className="p-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go back</p>
                </TooltipContent>
              </Tooltip>
              
              <nav className="flex items-center space-x-1 text-sm text-gray-500">
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                    {item.current ? (
                      <div className="flex items-center space-x-1">
                        {item.icon}
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </div>
                    ) : (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal text-gray-500 hover:text-gray-900 flex items-center space-x-1"
                        onClick={item.onClick}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>
            
            {/* Right side - Actions */}
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(currentPath)}
                    className={cn(
                      "p-2",
                      isBookmarked && "text-yellow-600 hover:text-yellow-700"
                    )}
                  >
                    <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isBookmarked ? "Remove bookmark" : "Add bookmark"}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Share className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share page</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Dashboard", path: "dashboard" },
              { label: "Analytics", path: "dashboard/analytics" },
              { label: "Users", path: "users" },
              { label: "Settings", path: "settings" },
              { label: "Reports", path: "dashboard/analytics/reports" },
              { label: "Projects", path: "projects" },
              { label: "Team", path: "team" },
              { label: "Billing", path: "settings/billing" }
            ].map((item) => (
              <Button
                key={item.path}
                variant="outline"
                onClick={() => navigate(item.path)}
                className="justify-start"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Bookmarks</h3>
            <div className="flex flex-wrap gap-2">
              {bookmarks.map((bookmark) => (
                <Button
                  key={bookmark}
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(bookmark)}
                  className="flex items-center space-x-1"
                >
                  <Bookmark className="h-3 w-3 fill-current" />
                  <span>{bookmark || "Home"}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {breadcrumbItems[breadcrumbItems.length - 1].label}
          </h1>
          <p className="text-gray-600 mb-6">
            Current path: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{currentPath || "home"}</code>
          </p>
          <div className="space-y-4">
            <p className="text-gray-600">
              This dynamic breadcrumb system includes:
            </p>
            <ul className="text-gray-600 space-y-2 ml-4">
              <li>• <strong>Back navigation</strong> - Navigate to previously visited pages</li>
              <li>• <strong>Bookmarking</strong> - Save frequently visited pages</li>
              <li>• <strong>Quick navigation</strong> - Jump to common pages</li>
              <li>• <strong>Dynamic generation</strong> - Breadcrumbs update based on current path</li>
              <li>• <strong>Action buttons</strong> - Share and bookmark functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicBreadcrumb`;

// Example 4: Responsive Breadcrumb with Tooltip Support
export const responsiveBreadcrumbExample = `import * as React from "react"
import { ChevronRight, Home, MoreHorizontal } from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"

interface BreadcrumbItem {
  label: string
  fullLabel?: string
  href?: string
  onClick?: () => void
  current?: boolean
  description?: string
}

const ResponsiveBreadcrumb = () => {
  const [currentPath, setCurrentPath] = React.useState("documentation/components/navigation/breadcrumb/examples")
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const allBreadcrumbItems: BreadcrumbItem[] = [
    { 
      label: "Home", 
      onClick: () => setCurrentPath(""),
      description: "Return to homepage"
    },
    { 
      label: "Docs", 
      fullLabel: "Documentation",
      onClick: () => setCurrentPath("documentation"),
      description: "Browse documentation"
    },
    { 
      label: "Components", 
      onClick: () => setCurrentPath("documentation/components"),
      description: "UI component library"
    },
    { 
      label: "Navigation", 
      onClick: () => setCurrentPath("documentation/components/navigation"),
      description: "Navigation components"
    },
    { 
      label: "Breadcrumb", 
      onClick: () => setCurrentPath("documentation/components/navigation/breadcrumb"),
      description: "Breadcrumb navigation component"
    },
    { 
      label: "Examples", 
      current: true,
      description: "Code examples and demos"
    }
  ]

  // Responsive logic
  const getVisibleItems = () => {
    const isMobile = windowWidth < 640
    const isTablet = windowWidth < 1024
    
    if (isMobile) {
      // Mobile: Show only first, last, and collapsed middle
      if (allBreadcrumbItems.length <= 2) return allBreadcrumbItems
      return [
        allBreadcrumbItems[0],
        { label: "...", isCollapsed: true },
        allBreadcrumbItems[allBreadcrumbItems.length - 1]
      ]
    } else if (isTablet) {
      // Tablet: Show first, last 2, and collapsed middle if needed
      if (allBreadcrumbItems.length <= 3) return allBreadcrumbItems
      return [
        allBreadcrumbItems[0],
        { label: "...", isCollapsed: true },
        ...allBreadcrumbItems.slice(-2)
      ]
    } else {
      // Desktop: Show all items
      return allBreadcrumbItems
    }
  }

  const getCollapsedItems = () => {
    const isMobile = windowWidth < 640
    const isTablet = windowWidth < 1024
    
    if (isMobile && allBreadcrumbItems.length > 2) {
      return allBreadcrumbItems.slice(1, -1)
    } else if (isTablet && allBreadcrumbItems.length > 3) {
      return allBreadcrumbItems.slice(1, -2)
    }
    return []
  }

  const visibleItems = getVisibleItems()
  const collapsedItems = getCollapsedItems()

  const BreadcrumbItem = ({ item, showTooltip = true }: { item: any; showTooltip?: boolean }) => {
    if (item.isCollapsed) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-gray-500 hover:text-gray-900"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {collapsedItems.map((collapsedItem, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={collapsedItem.onClick}
                className="cursor-pointer"
              >
                <div>
                  <div className="font-medium">{collapsedItem.fullLabel || collapsedItem.label}</div>
                  {collapsedItem.description && (
                    <div className="text-xs text-gray-500">{collapsedItem.description}</div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    const content = (
      <div className="flex items-center space-x-1">
        {item.label === "Home" && <Home className="h-4 w-4" />}
        <span className={cn(
          "truncate max-w-[120px] sm:max-w-[200px]",
          windowWidth < 640 && "max-w-[80px]"
        )}>
          {windowWidth < 640 ? item.label : (item.fullLabel || item.label)}
        </span>
      </div>
    )

    if (item.current) {
      return showTooltip && item.description ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-medium text-gray-900">{content}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{item.description}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="font-medium text-gray-900">{content}</span>
      )
    }

    return showTooltip && item.description ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="link"
            className="p-0 h-auto font-normal text-gray-500 hover:text-gray-900"
            onClick={item.onClick}
          >
            {content}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{item.description}</p>
        </TooltipContent>
      </Tooltip>
    ) : (
      <Button
        variant="link"
        className="p-0 h-auto font-normal text-gray-500 hover:text-gray-900"
        onClick={item.onClick}
      >
        {content}
      </Button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Responsive Breadcrumb Navigation */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <nav className="flex items-center space-x-1 text-sm text-gray-500 overflow-hidden">
            {visibleItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                <BreadcrumbItem item={item} />
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Responsive Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Responsive Behavior</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Mobile (&lt; 640px)</h4>
              <p className="text-blue-800">Shows first + last items with collapsed middle</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Tablet (&lt; 1024px)</h4>
              <p className="text-green-800">Shows first + last 2 items with collapsed middle</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Desktop (≥ 1024px)</h4>
              <p className="text-purple-800">Shows all breadcrumb items</p>
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            Current window width: <strong>{windowWidth}px</strong>
          </p>
        </div>

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Responsive Breadcrumb Examples
          </h1>
          <p className="text-gray-600 mb-6">
            Current path: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{currentPath || "home"}</code>
          </p>
          <div className="space-y-4">
            <p className="text-gray-600">
              This responsive breadcrumb adapts to different screen sizes:
            </p>
            <ul className="text-gray-600 space-y-2 ml-4">
              <li>• <strong>Mobile optimization</strong> - Collapses to essential items</li>
              <li>• <strong>Tooltip support</strong> - Hover for additional context</li>
              <li>• <strong>Truncation</strong> - Long labels are shortened on small screens</li>
              <li>• <strong>Dropdown access</strong> - Collapsed items remain accessible</li>
              <li>• <strong>Touch-friendly</strong> - Optimized for mobile interaction</li>
            </ul>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Try it:</strong> Resize your browser window to see how the breadcrumb adapts to different screen sizes!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveBreadcrumb`;
