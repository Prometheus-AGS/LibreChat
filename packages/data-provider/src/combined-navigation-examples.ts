// ============================================================================
// COMBINED NAVIGATION EXAMPLES
// ============================================================================

// Example 1: Dashboard Layout with Sidebar and Breadcrumbs
export const dashboardLayoutExample = `import * as React from "react"
import { 
  Home, Settings, Users, FileText, BarChart3, ChevronRight,
  Bell, Search, Menu, ChevronLeft, Plus, Filter
} from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Separator } from "./separator"
import { Badge } from "./badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"

interface NavItem {
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  badge?: string | number
}

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  current?: boolean
}

const DashboardLayout = () => {
  const [activeItem, setActiveItem] = React.useState("analytics")
  const [currentPath, setCurrentPath] = React.useState("dashboard/analytics/reports")
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      active: activeItem === "dashboard",
      onClick: () => {
        setActiveItem("dashboard")
        setCurrentPath("dashboard")
      }
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      active: activeItem === "analytics",
      badge: "New",
      onClick: () => {
        setActiveItem("analytics")
        setCurrentPath("dashboard/analytics")
      }
    },
    {
      title: "Users",
      icon: <Users className="h-4 w-4" />,
      active: activeItem === "users",
      badge: 12,
      onClick: () => {
        setActiveItem("users")
        setCurrentPath("dashboard/users")
      }
    },
    {
      title: "Reports",
      icon: <FileText className="h-4 w-4" />,
      active: activeItem === "reports",
      onClick: () => {
        setActiveItem("reports")
        setCurrentPath("dashboard/analytics/reports")
      }
    },
    {
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
      active: activeItem === "settings",
      onClick: () => {
        setActiveItem("settings")
        setCurrentPath("dashboard/settings")
      }
    }
  ]

  const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/')
    const items: BreadcrumbItem[] = []
    
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1
      const segmentPath = segments.slice(0, index + 1).join('/')
      
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        onClick: isLast ? undefined : () => setCurrentPath(segmentPath),
        current: isLast
      })
    })
    
    return items
  }

  const breadcrumbItems = generateBreadcrumbs(currentPath)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn("p-6 flex items-center", sidebarCollapsed && "justify-center")}>
        {!sidebarCollapsed && <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn("ml-auto", sidebarCollapsed && "ml-0")}
        >
          <ChevronLeft className={cn("h-4 w-4", sidebarCollapsed && "rotate-180")} />
        </Button>
      </div>
      
      <Separator />
      
      <nav className="flex-1 mt-6">
        <div className="px-3">
          {navItems.map((item, index) => (
            <Button
              key={index}
              variant={item.active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start mb-1",
                item.active && "bg-blue-600 text-white hover:bg-blue-700",
                sidebarCollapsed && "justify-center px-2"
              )}
              onClick={item.onClick}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3 flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </div>
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex bg-white shadow-lg transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Breadcrumbs */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <h1 className="text-2xl font-bold text-gray-900">
                  {breadcrumbItems[breadcrumbItems.length - 1]?.label}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." className="pl-10 w-64" />
                </div>
                <Button variant="ghost" size="sm">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
              </div>
            </div>
            
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-1 text-sm text-gray-500">
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: 2 minutes ago
              </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Total Users", value: "12,345", change: "+12%", color: "blue" },
                { title: "Revenue", value: "$45,678", change: "+8%", color: "green" },
                { title: "Orders", value: "1,234", change: "-3%", color: "red" },
                { title: "Conversion", value: "3.2%", change: "+0.5%", color: "purple" }
              ].map((metric, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {metric.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {metric.value}
                    </div>
                    <div className={cn(
                      "text-sm",
                      metric.change.startsWith('+') ? "text-green-600" : "text-red-600"
                    )}>
                      {metric.change} from last month
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Analytics Overview</CardTitle>
                  <CardDescription>
                    Performance metrics for the current period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart placeholder</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      "New user registered",
                      "Report generated",
                      "Data exported",
                      "Settings updated"
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-600">{activity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout`;

// Example 2: Admin Panel with Collapsible Sidebar and Navigation
export const adminPanelExample = `import * as React from "react"
import { 
  Home, Settings, Users, FileText, BarChart3, ChevronRight, ChevronDown,
  Shield, Database, Globe, Bell, Search, Menu, Plus, Edit, Trash2,
  MoreVertical, Eye, Download
} from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Separator } from "./separator"
import { Badge } from "./badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

interface NavItem {
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  badge?: string | number
  children?: NavItem[]
}

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  current?: boolean
}

const AdminPanel = () => {
  const [activeItem, setActiveItem] = React.useState("user-management")
  const [currentPath, setCurrentPath] = React.useState("admin/users/management")
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState<string[]>(["users", "system"])

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      active: activeItem === "dashboard",
      onClick: () => {
        setActiveItem("dashboard")
        setCurrentPath("admin/dashboard")
      }
    },
    {
      title: "Users",
      icon: <Users className="h-4 w-4" />,
      badge: 156,
      children: [
        {
          title: "User Management",
          icon: <Users className="h-3 w-3" />,
          active: activeItem === "user-management",
          onClick: () => {
            setActiveItem("user-management")
            setCurrentPath("admin/users/management")
          }
        },
        {
          title: "Roles & Permissions",
          icon: <Shield className="h-3 w-3" />,
          active: activeItem === "roles",
          onClick: () => {
            setActiveItem("roles")
            setCurrentPath("admin/users/roles")
          }
        },
        {
          title: "Activity Logs",
          icon: <FileText className="h-3 w-3" />,
          active: activeItem === "activity-logs",
          badge: "New",
          onClick: () => {
            setActiveItem("activity-logs")
            setCurrentPath("admin/users/activity")
          }
        }
      ]
    },
    {
      title: "Content",
      icon: <FileText className="h-4 w-4" />,
      children: [
        {
          title: "Posts",
          icon: <FileText className="h-3 w-3" />,
          active: activeItem === "posts",
          badge: 45,
          onClick: () => {
            setActiveItem("posts")
            setCurrentPath("admin/content/posts")
          }
        },
        {
          title: "Media Library",
          icon: <Database className="h-3 w-3" />,
          active: activeItem === "media",
          onClick: () => {
            setActiveItem("media")
            setCurrentPath("admin/content/media")
          }
        }
      ]
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      active: activeItem === "analytics",
      onClick: () => {
        setActiveItem("analytics")
        setCurrentPath("admin/analytics")
      }
    },
    {
      title: "System",
      icon: <Settings className="h-4 w-4" />,
      children: [
        {
          title: "Database",
          icon: <Database className="h-3 w-3" />,
          active: activeItem === "database",
          onClick: () => {
            setActiveItem("database")
            setCurrentPath("admin/system/database")
          }
        },
        {
          title: "API Settings",
          icon: <Globe className="h-3 w-3" />,
          active: activeItem === "api-settings",
          onClick: () => {
            setActiveItem("api-settings")
            setCurrentPath("admin/system/api")
          }
        },
        {
          title: "General Settings",
          icon: <Settings className="h-3 w-3" />,
          active: activeItem === "general-settings",
          onClick: () => {
            setActiveItem("general-settings")
            setCurrentPath("admin/system/settings")
          }
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

  const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/')
    const items: BreadcrumbItem[] = []
    
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1
      const segmentPath = segments.slice(0, index + 1).join('/')
      
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
        onClick: isLast ? undefined : () => setCurrentPath(segmentPath),
        current: isLast
      })
    })
    
    return items
  }

  const breadcrumbItems = generateBreadcrumbs(currentPath)

  const NavItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title.toLowerCase())

    return (
      <div>
        {hasChildren ? (
          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.title.toLowerCase())}>
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
            onClick={item.onClick}
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">System Management</p>
      </div>
      
      <Separator />
      
      <nav className="flex-1 p-3 overflow-y-auto">
        {navItems.map((item, index) => (
          <NavItem key={index} item={item} />
        ))}
      </nav>
    </div>
  )

  // Sample user data
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active", lastLogin: "2 hours ago" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Editor", status: "Active", lastLogin: "1 day ago" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "User", status: "Inactive", lastLogin: "1 week ago" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "Editor", status: "Active", lastLogin: "3 hours ago" },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 bg-white shadow-lg">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Breadcrumbs */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <h1 className="text-2xl font-bold text-gray-900">
                  {breadcrumbItems[breadcrumbItems.length - 1]?.label}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
                <Button variant="ghost" size="sm">
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-1 text-sm text-gray-500">
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Search and Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search users..." className="pl-10 w-64" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Filter by Role
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>All Roles</DropdownMenuItem>
                    <DropdownMenuItem>Admin</DropdownMenuItem>
                    <DropdownMenuItem>Editor</DropdownMenuItem>
                    <DropdownMenuItem>User</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-sm text-gray-500">
                Showing {users.length} of 156 users
              </div>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">{user.lastLogin}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminPanel`;

// Example 3: Multi-level Navigation with Both Components
export const multiLevelNavigationExample = `import * as React from "react"
import { 
  Home, Settings, Users, FileText, BarChart3, ChevronRight, ChevronDown,
  Building, Briefcase, Calendar, Clock, MapPin, Phone, Mail,
  Search, Bell, Menu, Plus, Filter, MoreHorizontal
} from "lucide-react"
import { cn } from "/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Separator } from "./separator"
import { Badge } from "./badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

interface NavItem {
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  badge?: string | number
  children?: NavItem[]
}

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  current?: boolean
  icon?: React.ReactNode
}

const MultiLevelNavigation = () => {
  const [activeItem, setActiveItem] = React.useState("project-alpha")
  const [currentPath, setCurrentPath] = React.useState("company/projects/project-alpha/tasks")
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState<string[]>(["projects", "project-alpha"])

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      active: activeItem === "dashboard",
      onClick: () => {
        setActiveItem("dashboard")
        setCurrentPath("company/dashboard")
      }
    },
    {
      title: "Projects",
      icon: <Briefcase className="h-4 w-4" />,
      badge: 8,
      children: [
        {
          title: "Project Alpha",
          icon: <Building className="h-3 w-3" />,
          active: activeItem === "project-alpha",
          badge: "Active",
          onClick: () => {
            setActiveItem("project-alpha")
            setCurrentPath("company/projects/project-alpha")
          },
          children: [
            {
              title: "Tasks",
              icon: <Calendar className="h-3 w-3" />,
              active: activeItem === "project-alpha-tasks",
              onClick: () => {
                setActiveItem("project-alpha-tasks")
                setCurrentPath("company/projects/project-alpha/tasks")
              }
            },
            {
              title: "Timeline",
              icon: <Clock className="h-3 w-3" />,
              active: activeItem === "project-alpha-timeline",
              onClick: () => {
                setActiveItem("project-alpha-timeline")
                setCurrentPath("company/projects/project-alpha/timeline")
              }
            },
            {
              title: "Team",
              icon: <Users className="h-3 w-3" />,
              active: activeItem === "project-alpha-team",
              badge: 5,
              onClick: () => {
                setActiveItem("project-alpha-team")
                setCurrentPath("company/projects/project-alpha/team")
              }
            }
          ]
        },
        {
          title: "Project Beta",
          icon: <Building className="h-3 w-3" />,
          active: activeItem === "project-beta",
          badge: "Planning",
          onClick: () => {
            setActiveItem("project-beta")
            setCurrentPath("company/projects/project-beta")
          }
        },
        {
          title: "Archived Projects",
          icon: <FileText className="h-3 w-3" />,
          active: activeItem === "archived-projects",
          badge: 12,
          onClick: () => {
            setActiveItem("archived-projects")
            setCurrentPath("company/projects/archived")
          }
        }
      ]
    },
    {
      title: "Team",
      icon: <Users className="h-4 w-4" />,
      badge: 24,
      children: [
        {
          title: "Directory",
          icon: <Users className="h-3 w-3" />,
          active: activeItem === "team-directory",
          onClick: () => {
            setActiveItem("team-directory")
            setCurrentPath("company/team/directory")
          }
        },
        {
          title: "Departments",
          icon: <Building className="h-3 w-3" />,
          active: activeItem === "departments",
          onClick: () => {
            setActiveItem("departments")
            setCurrentPath("company/team/departments")
          }
        }
      ]
    },
    {
      title: "Reports",
      icon: <BarChart3 className="h-4 w-4" />,
      active: activeItem === "reports",
      onClick: () => {
        setActiveItem("reports")
        setCurrentPath("company/reports")
      }
    },
    {
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
      active: activeItem === "settings",
      onClick: () => {
        setActiveItem("settings")
        setCurrentPath("company/settings")
      }
    }
  ]

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/')
    const items: BreadcrumbItem[] = []
    
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1
      const segmentPath = segments.slice(0, index + 1).join('/')
      
      // Add icons for specific segments
      let icon = undefined
      if (segment === 'company') icon = <Building className="h-4 w-4" />
      if (segment === 'projects') icon = <Briefcase className="h-4 w-4" />
      if (segment === 'team') icon = <Users className="h-4 w-4" />
      
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
        onClick: isLast ? undefined : () => setCurrentPath(segmentPath),
        current: isLast,
        icon
      })
    })
    
    return items
  }

  const breadcrumbItems = generateBreadcrumbs(currentPath)

  const NavItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title.toLowerCase().replace(' ', '-'))

    return (
      <div>
        {hasChildren ? (
          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.title.toLowerCase().replace(' ', '-'))}>
            <CollapsibleTrigger asChild>
              <Button
                variant={item.active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  item.active && "bg-blue-600 text-white hover:bg-blue-700",
                  level > 0 && "ml-4",
                  level > 1 && "ml-8"
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
              level > 0 && "ml-4",
              level > 1 && "ml-8"
            )}
            onClick={item.onClick}
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">Company Portal</h2>
        <p className="text-sm text-gray-500 mt-1">Project Management</p>
      </div>
      
      <Separator />
      
      <nav className="flex-1 p-3 overflow-y-auto">
        {navItems.map((item, index) => (
          <NavItem key={index} item={item} />
        ))}
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 bg-white shadow-lg">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Multi-level Breadcrumbs */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <h1 className="text-2xl font-bold text-gray-900">
                  {breadcrumbItems[breadcrumbItems.length - 1]?.label}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search projects..." className="pl-10 w-64" />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
                <Button variant="ghost" size="sm">
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Multi-level Breadcrumb Navigation */}
            <nav className="flex items-center space-x-1 text-sm text-gray-500">
              <Home className="h-4 w-4" />
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
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Project Overview */}
            <div className="mb-8">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  {/* Project Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { title: "Total Tasks", value: "24", change: "+3 this week", color: "blue" },
                      { title: "Completed", value: "18", change: "75% complete", color: "green" },
                      { title: "In Progress", value: "4", change: "2 due today", color: "yellow" },
                      { title: "Team Members", value: "5", change: "All active", color: "purple" }
                    ].map((stat, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {stat.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {stat.value}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stat.change}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Information</CardTitle>
                        <CardDescription>
                          Key details about Project Alpha
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Start Date</p>
                            <p className="text-sm text-gray-500">January 15, 2024</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Deadline</p>
                            <p className="text-sm text-gray-500">March 30, 2024</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Location</p>
                            <p className="text-sm text-gray-500">Remote & San Francisco</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                          Latest updates from the team
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { user: "Alice", action: "completed task 'Design Review'", time: "2 hours ago" },
                            { user: "Bob", action: "added new milestone", time: "4 hours ago" },
                            { user: "Carol", action: "updated project timeline", time: "1 day ago" },
                            { user: "David", action: "joined the project", time: "2 days ago" }
                          ].map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-medium">{activity.user}</span> {activity.action}
                                </p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="tasks">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Tasks</CardTitle>
                      <CardDescription>
                        Manage and track project tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500">Task management interface would go here...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="timeline">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Timeline</CardTitle>
                      <CardDescription>
                        Visual timeline of project milestones
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500">Timeline visualization would go here...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="team">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>
                        Project team and their roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { name: "Alice Johnson", role: "Project Manager", email: "alice@company.com" },
                          { name: "Bob Smith", role: "Lead Developer", email: "bob@company.com" },
                          { name: "Carol Davis", role: "Designer", email: "carol@company.com" },
                          { name: "David Wilson", role: "QA Engineer", email: "david@company.com" },
                          { name: "Eve Brown", role: "Business Analyst", email: "eve@company.com" }
                        ].map((member, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.role}</p>
                              <p className="text-xs text-gray-400">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MultiLevelNavigation`;

// Export all combined navigation examples
export const combinedNavigationExamples = {
  dashboardLayoutExample: `// Dashboard Layout with Sidebar and Breadcrumbs
${dashboardLayoutExample}`,

  adminPanelExample: `// Admin Panel with Collapsible Sidebar and Navigation
${adminPanelExample}`,

  multiLevelNavigationExample: `// Multi-level Navigation with Complex Hierarchy
${multiLevelNavigationExample}`,
};
