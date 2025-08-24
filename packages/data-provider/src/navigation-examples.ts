// ============================================================================
// NAVIGATION COMPONENT EXAMPLES
// ============================================================================

// Example 1: Basic Sidebar with Navigation Items
export const basicSidebarExample = `import * as React from "react"
import { Home, Settings, Users, FileText, BarChart3 } from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Separator } from "./separator"

interface NavItem {
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
}

const BasicSidebar = () => {
  const [activeItem, setActiveItem] = React.useState("dashboard")

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      href: "/dashboard",
      active: activeItem === "dashboard"
    },
    {
      title: "Users",
      icon: <Users className="h-4 w-4" />,
      href: "/users",
      active: activeItem === "users"
    },
    {
      title: "Documents",
      icon: <FileText className="h-4 w-4" />,
      href: "/documents",
      active: activeItem === "documents"
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      href: "/analytics",
      active: activeItem === "analytics"
    },
    {
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
      href: "/settings",
      active: activeItem === "settings"
    }
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800">My App</h2>
        </div>
        <Separator />
        <nav className="mt-6">
          <div className="px-3">
            {navItems.map((item, index) => (
              <Button
                key={index}
                variant={item.active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  item.active && "bg-blue-600 text-white hover:bg-blue-700"
                )}
                onClick={() => {
                  setActiveItem(item.title.toLowerCase())
                  item.onClick?.()
                }}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Button>
            ))}
          </div>
        </nav>
      </div>
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 capitalize">
          {activeItem} Page
        </h1>
        <p className="mt-4 text-gray-600">
          This is the {activeItem} page content. Click on sidebar items to navigate.
        </p>
      </div>
    </div>
  )
}

export default BasicSidebar`;

// Example 2: Collapsible Sidebar with State Persistence
export const collapsibleSidebarExample = `import * as React from "react"
import { 
  Home, Settings, Users, FileText, BarChart3, 
  ChevronLeft, ChevronRight, Menu 
} from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Separator } from "./separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

interface NavItem {
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  badge?: string
}

const CollapsibleSidebar = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [activeItem, setActiveItem] = React.useState("dashboard")

  // Persist sidebar state in localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      href: "/dashboard",
      active: activeItem === "dashboard"
    },
    {
      title: "Users",
      icon: <Users className="h-4 w-4" />,
      href: "/users",
      active: activeItem === "users",
      badge: "12"
    },
    {
      title: "Documents",
      icon: <FileText className="h-4 w-4" />,
      href: "/documents",
      active: activeItem === "documents"
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      href: "/analytics",
      active: activeItem === "analytics"
    },
    {
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
      href: "/settings",
      active: activeItem === "settings"
    }
  ]

  const NavButton = ({ item }: { item: NavItem }) => {
    const button = (
      <Button
        variant={item.active ? "default" : "ghost"}
        className={cn(
          "w-full justify-start mb-1 relative",
          item.active && "bg-blue-600 text-white hover:bg-blue-700",
          isCollapsed && "justify-center px-2"
        )}
        onClick={() => {
          setActiveItem(item.title.toLowerCase())
          item.onClick?.()
        }}
      >
        {item.icon}
        {!isCollapsed && <span className="ml-3">{item.title}</span>}
        {!isCollapsed && item.badge && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
            {item.badge}
          </span>
        )}
      </Button>
    )

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={cn(
        "bg-white shadow-lg transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && <h2 className="text-xl font-semibold text-gray-800">My App</h2>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <Separator />
        <nav className="mt-6">
          <div className="px-3">
            {navItems.map((item, index) => (
              <NavButton key={index} item={item} />
            ))}
          </div>
        </nav>
      </div>
      <div className="flex-1 p-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mr-4 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {activeItem} Page
          </h1>
        </div>
        <p className="text-gray-600">
          This collapsible sidebar persists its state in localStorage. 
          Try refreshing the page to see the state maintained.
        </p>
      </div>
    </div>
  )
}

export default CollapsibleSidebar`;

// Example 3: Mobile-Responsive Sidebar with Sheet Behavior
export const mobileSidebarExample = `import * as React from "react"
import { 
  Home, Settings, Users, FileText, BarChart3, 
  Menu, X, Bell, Search 
} from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Separator } from "./separator"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { Badge } from "./badge"

interface NavItem {
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  badge?: number
}

const MobileSidebar = () => {
  const [activeItem, setActiveItem] = React.useState("dashboard")
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
      active: activeItem === "dashboard"
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      href: "/users",
      active: activeItem === "users",
      badge: 12
    },
    {
      title: "Documents",
      icon: <FileText className="h-5 w-5" />,
      href: "/documents",
      active: activeItem === "documents",
      badge: 3
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/analytics",
      active: activeItem === "analytics"
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
      active: activeItem === "settings"
    }
  ]

  const handleNavClick = (item: NavItem) => {
    setActiveItem(item.title.toLowerCase())
    if (isMobile) {
      setIsOpen(false)
    }
    item.onClick?.()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">My App</h2>
        <p className="text-sm text-gray-500 mt-1">Welcome back!</p>
      </div>
      
      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-10"
          />
        </div>
      </div>

      <Separator />
      
      <nav className="flex-1 mt-6">
        <div className="px-3">
          {navItems.map((item, index) => (
            <Button
              key={index}
              variant={item.active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start mb-1 h-12",
                item.active && "bg-blue-600 text-white hover:bg-blue-700"
              )}
              onClick={() => handleNavClick(item)}
            >
              {item.icon}
              <span className="ml-3 flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-6 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-gray-500">john@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-white shadow-lg">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {activeItem}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 capitalize">
              {activeItem} Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              This is a mobile-responsive sidebar that transforms into a sheet on smaller screens.
              Try resizing your browser window to see the responsive behavior.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="font-semibold text-gray-900 mb-2">Card {i}</h3>
                  <p className="text-gray-600 text-sm">
                    Sample content for card {i}. This demonstrates the responsive layout.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MobileSidebar`;

// Example 4: Sidebar with Keyboard Shortcuts (Ctrl/Cmd + B)
export const keyboardSidebarExample = `import * as React from "react"
import { 
  Home, Settings, Users, FileText, BarChart3, 
  ChevronLeft, ChevronRight, Keyboard, Command 
} from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Separator } from "./separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"
import { Badge } from "./badge"

interface NavItem {
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  shortcut?: string
}

const KeyboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [activeItem, setActiveItem] = React.useState("dashboard")
  const [showShortcuts, setShowShortcuts] = React.useState(false)

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      href: "/dashboard",
      active: activeItem === "dashboard",
      shortcut: "⌘1"
    },
    {
      title: "Users",
      icon: <Users className="h-4 w-4" />,
      href: "/users",
      active: activeItem === "users",
      shortcut: "⌘2"
    },
    {
      title: "Documents",
      icon: <FileText className="h-4 w-4" />,
      href: "/documents",
      active: activeItem === "documents",
      shortcut: "⌘3"
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      href: "/analytics",
      active: activeItem === "analytics",
      shortcut: "⌘4"
    },
    {
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
      href: "/settings",
      active: activeItem === "settings",
      shortcut: "⌘5"
    }
  ]

  // Keyboard shortcuts handler
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? event.metaKey : event.ctrlKey

      // Toggle sidebar with Ctrl/Cmd + B
      if (modifierKey && event.key === 'b') {
        event.preventDefault()
        setIsCollapsed(!isCollapsed)
        return
      }

      // Show/hide shortcuts with Ctrl/Cmd + K
      if (modifierKey && event.key === 'k') {
        event.preventDefault()
        setShowShortcuts(!showShortcuts)
        return
      }

      // Navigation shortcuts
      if (modifierKey && event.key >= '1' && event.key <= '5') {
        event.preventDefault()
        const index = parseInt(event.key) - 1
        if (navItems[index]) {
          setActiveItem(navItems[index].title.toLowerCase())
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed, showShortcuts, navItems])

  const NavButton = ({ item }: { item: NavItem }) => {
    const button = (
      <Button
        variant={item.active ? "default" : "ghost"}
        className={cn(
          "w-full justify-start mb-1 relative group",
          item.active && "bg-blue-600 text-white hover:bg-blue-700",
          isCollapsed && "justify-center px-2"
        )}
        onClick={() => {
          setActiveItem(item.title.toLowerCase())
          item.onClick?.()
        }}
      >
        {item.icon}
        {!isCollapsed && (
          <>
            <span className="ml-3 flex-1 text-left">{item.title}</span>
            {(showShortcuts || item.active) && item.shortcut && (
              <Badge variant="outline" className="ml-auto text-xs opacity-70">
                {item.shortcut}
              </Badge>
            )}
          </>
        )}
      </Button>
    )

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>{item.title}</span>
            {item.shortcut && (
              <Badge variant="outline" className="text-xs">
                {item.shortcut}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={cn(
        "bg-white shadow-lg transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && <h2 className="text-xl font-semibold text-gray-800">My App</h2>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <Separator />
        
        {!isCollapsed && (
          <div className="px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="w-full justify-start"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              {showShortcuts ? "Hide" : "Show"} Shortcuts
            </Button>
          </div>
        )}

        <nav className="mt-6">
          <div className="px-3">
            {navItems.map((item, index) => (
              <NavButton key={index} item={item} />
            ))}
          </div>
        </nav>

        {!isCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <div className="flex items-center mb-2">
                <Command className="h-3 w-3 mr-1" />
                <span className="font-medium">Keyboard Shortcuts</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Toggle Sidebar</span>
                  <Badge variant="outline" className="text-xs">⌘B</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Show Shortcuts</span>
                  <Badge variant="outline" className="text-xs">⌘K</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 capitalize mb-2">
            {activeItem} Page
          </h1>
          <p className="text-gray-600">
            Try these keyboard shortcuts:
          </p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li><strong>⌘B</strong> - Toggle sidebar</li>
            <li><strong>⌘K</strong> - Show/hide shortcuts</li>
            <li><strong>⌘1-5</strong> - Navigate to pages</li>
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Keyboard Navigation Demo</h2>
          <p className="text-gray-600">
            This sidebar supports full keyboard navigation. The shortcuts work on both Mac (⌘) and PC (Ctrl).
            Try pressing <strong>⌘B</strong> or <strong>Ctrl+B</strong> to toggle the sidebar!
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeyboardSidebar`;

// Example 5: Advanced Sidebar with Nested Navigation and Icons
export const advancedSidebarExample = `import * as React from "react"
import { 
  Home, Settings, Users, FileText, BarChart3, 
  ChevronDown, ChevronRight, Folder, FolderOpen,
  Plus, Search, Bell, User, LogOut, HelpCircle,
  Shield, Database, Globe, Zap, Star
} from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Separator } from "./separator"
import { Badge } from "./badge"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"

interface NavItem {
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  badge?: string | number
  children?: NavItem[]
  expanded?: boolean
}

const AdvancedSidebar = () => {
  const [activeItem, setActiveItem] = React.useState("dashboard")
  const [expandedItems, setExpandedItems] = React.useState<string[]>(["analytics"])
  const [searchQuery, setSearchQuery] = React.useState("")

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      href: "/dashboard",
      active: activeItem === "dashboard"
    },
    {
      title: "Users",
      icon: <Users className="h-4 w-4" />,
      href: "/users",
      active: activeItem === "users",
      badge: "12",
      children: [
        {
          title: "All Users",
          icon: <Users className="h-3 w-3" />,
          href: "/users/all",
          active: activeItem === "all-users"
        },
        {
          title: "Admins",
          icon: <Shield className="h-3 w-3" />,
          href: "/users/admins",
          active: activeItem === "admins",
          badge: "3"
        },
        {
          title: "Pending",
          icon: <User className="h-3 w-3" />,
          href: "/users/pending",
          active: activeItem === "pending",
          badge: "5"
        }
      ]
    },
    {
      title: "Content",
      icon: <FileText className="h-4 w-4" />,
      href: "/content",
      active: activeItem === "content",
      children: [
        {
          title: "Documents",
          icon: <FileText className="h-3 w-3" />,
          href: "/content/documents",
          active: activeItem === "documents"
        },
        {
          title: "Media",
          icon: <Folder className="h-3 w-3" />,
          href: "/content/media",
          active: activeItem === "media"
        },
        {
          title: "Templates",
          icon: <Star className="h-3 w-3" />,
          href: "/content/templates",
          active: activeItem === "templates",
          badge: "New"
        }
      ]
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      href: "/analytics",
      active: activeItem === "analytics",
      expanded: expandedItems.includes("analytics"),
      children: [
        {
          title: "Overview",
          icon: <BarChart3 className="h-3 w-3" />,
          href: "/analytics/overview",
          active: activeItem === "overview"
        },
        {
          title: "Reports",
          icon: <FileText className="h-3 w-3" />,
          href: "/analytics/reports",
          active: activeItem === "reports"
        },
        {
          title: "Real-time",
          icon: <Zap className="h-3 w-3" />,
          href: "/analytics/realtime",
          active: activeItem === "realtime",
          badge: "Live"
        }
      ]
    },
    {
      title: "System",
      icon: <Settings className="h-4 w-4" />,
      href: "/system",
      active: activeItem === "system",
      children: [
        {
          title: "Database",
          icon: <Database className="h-3 w-3" />,
          href: "/system/database",
          active: activeItem === "database"
        },
        {
          title: "API",
          icon: <Globe className="h-3 w-3" />,
          href: "/system/api",
          active: activeItem === "api"
        },
        {
          title: "Settings",
          icon: <Settings className="h-3 w-3" />,
          href: "/system/settings",
          active: activeItem === "settings"
        }
      ]
    }
  ]

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const handleNavClick = (item: NavItem) => {
    setActiveItem(item.title.toLowerCase().replace(/\s+/g, '-'))
    item.onClick?.()
  }

  const filteredNavItems = React.useMemo(() => {
    if (!searchQuery) return navItems
    
    return navItems.filter(item => {
      const matchesParent = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesChild = item.children?.some(child => 
        child.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchesParent || matchesChild
    })
  }, [searchQuery, navItems])

  const NavItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)

    return (
      <div>
        {hasChildren ? (
          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.title)}>
            <CollapsibleTrigger asChild>
              <Button
                variant={item.active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  item.active && "bg-blue-600 text-white hover:bg-blue-700",
                  level > 0 && "ml-4"
                )}
              >
                {item.icon}
                <span className="ml-3 flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="mr-2">
                    {item.badge}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {item.children?.map((child, index) => (
                <NavItem key={index} item={child} level={level + 1} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Button
            variant={item.active ? "default" : "ghost"}
            className={cn(
              "w-full justify-start mb-1",
              item.active && "bg-blue-600 text-white hover:bg-blue-700",
              level > 0 && "ml-4"
            )}
            onClick={() => handleNavClick(item)}
          >
            {item.icon}
            <span className="ml-3 flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {filteredNavItems.map((item, index) => (
            <NavItem key={index} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src="/avatar.jpg" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 capitalize mb-2">
            {activeItem.replace('-', ' ')} Page
          </h1>
          <p className="text-gray-600">
            This advanced sidebar features nested navigation, search functionality,
            user dropdown, and collapsible sections. Try searching or expanding the menu items.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">Metric {i}</h3>
                  <p className="text-sm text-gray-500">Sample data</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.floor(Math.random() * 1000)}
              </div>
              <div className="text-sm text-green-600">
                +{Math.floor(Math.random() * 20)}% from last month
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdvancedSidebar`;
