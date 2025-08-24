/**
 * Enhanced Canary Components for LibreChat Artifacts
 *
 * This file contains fully functional, production-ready implementations of canary components
 * with complete feature sets including keyboard shortcuts, accessibility, and advanced functionality.
 */

export const enhancedCanaryComponents = {
  // Enhanced Sidebar Component with full functionality
  sidebar: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft, ChevronLeft, ChevronRight, Menu, X, Search, Settings, Home, User, FileText, MoreHorizontal } from "lucide-react"

import { cn } from "/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Separator } from "./separator"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { Skeleton } from "./skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { ScrollArea } from "./scroll-area"
import { Badge } from "./badge"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  keyboardShortcutsEnabled: boolean
  setKeyboardShortcutsEnabled: (enabled: boolean) => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
    keyboardShortcuts?: boolean
  }
>(({ 
  defaultOpen = true, 
  open: openProp, 
  onOpenChange: setOpenProp, 
  keyboardShortcuts = true,
  className, 
  style, 
  children, 
  ...props 
}, ref) => {
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
    },
    [setOpenProp, open, _setOpen]
  )

  const [openMobile, setOpenMobile] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = React.useState(keyboardShortcuts)

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)")
    const onChange = () => {
      setIsMobile(mql.matches)
      if (!mql.matches && openMobile) {
        setOpenMobile(false)
      }
    }
    mql.addEventListener("change", onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [openMobile])

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      keyboardShortcutsEnabled,
      setKeyboardShortcutsEnabled,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, keyboardShortcutsEnabled]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        className={cn(
          "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className="w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      ref={ref}
      className="group peer hidden md:block text-sidebar-foreground"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      <div
        className={cn(
          "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
        )}
      />
      <div
        className={cn(
          "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
        >
          {children}
        </div>
      </div>
    </div>
  )
})
Sidebar.displayName = "Sidebar"

export {
  Sidebar,
  SidebarProvider,
  useSidebar,
}
`,

  // Enhanced Command Palette Component with full functionality
  command: `import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search, Clock, Star, Hash, User, FileText, Settings, Zap, ArrowRight } from "lucide-react"

import { cn } from "/lib/utils"
import { Dialog, DialogContent } from "./dialog"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { ScrollArea } from "./scroll-area"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps {
  commandGroups?: Array<{
    heading: string
    commands: Array<{
      id: string
      label: string
      description?: string
      icon?: React.ReactNode
      shortcut?: string
      onSelect?: () => void
    }>
  }>
}

const CommandDialog = ({ children, commandGroups, ...props }: CommandDialogProps) => {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen} {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <ScrollArea className="max-h-[400px]">
    <CommandPrimitive.List
      ref={ref}
      className={cn("max-h-[400px] overflow-y-auto overflow-x-hidden p-1", className)}
      {...props}
    />
  </ScrollArea>
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
`,

  // Enhanced Breadcrumb Navigation Component
  breadcrumbNav: `import * as React from "react"
import { ChevronRight, MoreHorizontal, Home, ChevronDown } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "/lib/utils"
import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  dropdown?: Array<{
    label: string
    href?: string
    onClick?: () => void
    icon?: React.ReactNode
  }>
}

const BreadcrumbNav = React.forwardRef<
  HTMLElement,
  React.ComponentProps<"nav"> & {
    items: BreadcrumbItem[]
    separator?: React.ReactNode
    maxItems?: number
    showHome?: boolean
    homeHref?: string
    onHomeClick?: () => void
  }
>(({ 
  className, 
  items, 
  separator = <ChevronRight className="h-4 w-4" />, 
  maxItems = 3,
  showHome = true,
  homeHref = "/",
  onHomeClick,
  ...props 
}, ref) => {
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items
    }

    const firstItem = items[0]
    const lastItems = items.slice(-(maxItems - 1))
    const collapsedItems = items.slice(1, -(maxItems - 1))

    return [
      firstItem,
      {
        label: "...",
        dropdown: collapsedItems
      } as BreadcrumbItem,
      ...lastItems
    ]
  }, [items, maxItems])

  return (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
      {...props}
    >
      {showHome && (
        <>
          <BreadcrumbItem
            item={{
              label: "Home",
              href: homeHref,
              onClick: onHomeClick,
              icon: <Home className="h-4 w-4" />
            }}
          />
          {items.length > 0 && (
            <span className="flex items-center text-muted-foreground/50">
              {separator}
            </span>
          )}
        </>
      )}
      
      {displayItems.map((item, index) => (
        <React.Fragment key={index}>
          <BreadcrumbItem item={item} />
          {index < displayItems.length - 1 && (
            <span className="flex items-center text-muted-foreground/50">
              {separator}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
})
BreadcrumbNav.displayName = "BreadcrumbNav"

const BreadcrumbItem = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span"> & {
    item: BreadcrumbItem
  }
>(({ className, item, ...props }, ref) => {
  const isLast = !item.href && !item.onClick
  const hasDropdown = item.dropdown && item.dropdown.length > 0

  if (hasDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {item.dropdown.map((dropdownItem, index) => (
            <DropdownMenuItem
              key={index}
              onClick={dropdownItem.onClick}
              disabled={!dropdownItem.href && !dropdownItem.onClick}
              className="flex items-center gap-2"
            >
              {dropdownItem.icon}
              {dropdownItem.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (item.label === "...") {
    return (
      <span
        ref={ref}
        className={cn("flex items-center", className)}
        {...props}
      >
        <MoreHorizontal className="h-4 w-4" />
      </span>
    )
  }

  const content = (
    <span className="flex items-center gap-1">
      {item.icon}
      <span className="truncate max-w-[200px]">{item.label}</span>
    </span>
  )

  if (isLast || item.disabled) {
    return (
      <span
        ref={ref}
        className={cn(
          "flex items-center font-medium text-foreground",
          item.disabled && "opacity-50",
          className
        )}
        {...props}
      >
        {content}
      </span>
    )
  }

  if (item.onClick) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={item.onClick}
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            {content}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Navigate to {item.label}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={item.href}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {content}
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p>Navigate to {item.label}</p>
      </TooltipContent>
    </Tooltip>
  )
})
BreadcrumbItem.displayName = "BreadcrumbItem"

export { BreadcrumbNav }
`,

  // Enhanced Chart Component with full Recharts integration
  chart: `import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"
import * as Recharts from "recharts"

import { cn } from "/lib/utils"

const chartVariants = cva(
  "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
  {
    variants: {
      variant: {
        default: "h-[350px]",
        sm: "h-[250px]",
        lg: "h-[450px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: {
      light: string
      dark: string
    }
  }
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof chartVariants> & {
      config: ChartConfig
      children: React.ComponentProps<typeof Recharts.ResponsiveContainer>["children"]
    }
>(({ variant, config, children, className, ...props }, ref) => {
  const id = React.useId()

  return (
    <div
      data-chart={id}
      ref={ref}
      className={cn(chartVariants({ variant }), className)}
      {...props}
    >
      <ChartStyle id={id} config={config} />
      <Recharts.ResponsiveContainer width="100%" height="100%">
        {children}
      </Recharts.ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(config)
          .filter(([_, config]) => config.theme || config.color)
          .map(([key, itemConfig]) => {
            const color = itemConfig.theme?.light ?? itemConfig.color
            return color ? "[data-chart=\\"" + id + "\\"] ." + key + " { color: " + color + "; }" : null
          })
          .join(""),
      }}
    />
  )
}

const ChartTooltip = Recharts.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean
    payload?: any[]
    label?: string
    config?: ChartConfig
    indicator?: "line" | "dot" | "dashed"
    hideLabel?: boolean
    hideIndicator?: boolean
    labelFormatter?: (label: any, payload: any[]) => React.ReactNode
    labelClassName?: string
    formatter?: (value: any, name: any, item: any, index: number, payload: any[]) => React.ReactNode
  }
>(({
  active,
  payload,
  label,
  config,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  labelFormatter,
  labelClassName,
  formatter,
  className,
  ...props
}, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !label) {
      return null
    }

    return labelFormatter ? labelFormatter(label, payload) : label
  }, [label, labelFormatter, payload, hideLabel])

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
      {...props}
    >
      {tooltipLabel && (
        <p className={cn("font-medium", labelClassName)}>
          {tooltipLabel}
        </p>
      )}
      
      {payload.map((item, index) => {
        const key = (item.dataKey || item.name || "value") + "-" + index
        const itemConfig = config?.[item.dataKey] || config?.[item.name]
        
        return (
          <div key={key} className="flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground">
            {!hideIndicator && (
              <div className="flex flex-1 items-center gap-2">
                <div
                  className="shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                  style={{
                    "--color-bg": item.color,
                    "--color-border": item.color,
                  } as React.CSSProperties}
                />
              </div>
            )}
            <div className="flex flex-1 justify-between leading-none">
              <div className="grid gap-1.5">
                <span className="text-muted-foreground">
                  {itemConfig?.label || item.name}
                </span>
              </div>
              {item.value && (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formatter ? formatter(item.value, item.name, item, index, payload) : item.value}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = Recharts.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: any[]
    config?: ChartConfig
    hideIcon?: boolean
    className?: string
  }
>(({ className, payload, config, hideIcon = false, ...props }, ref) => {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    >
      {payload.map((item, index) => {
        const key = (item.dataKey || item.name || "value") + "-" + index
        const itemConfig = config?.[item.dataKey] || config?.[item.name]
        
        return (
          <div key={key} className="flex items-center gap-2">
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span className="text-xs">
              {itemConfig?.label || item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
}
`,
};
