/**
 * Component Registry for shadcn/ui Stable and Canary Components
 *
 * This file contains the official shadcn/ui components in both stable and canary versions,
 * along with their metadata, dependencies, and compatibility information.
 */

/**
 * Component version types for shadcn/ui components
 */
export enum ComponentVersion {
  STABLE = 'stable',
  CANARY = 'canary',
}

/**
 * Component metadata for version management
 */
export interface ComponentMetadata {
  name: string;
  version: ComponentVersion;
  dependencies: string[];
  conflicts: string[];
  description: string;
  isExperimental: boolean;
  deprecatedIn?: string;
  stableIn?: string;
  breakingChanges?: string[];
}

/**
 * Version conflict information
 */
export interface VersionConflict {
  componentName: string;
  requestedVersion: ComponentVersion;
  conflictingComponents: string[];
  resolution: 'auto' | 'manual' | 'pending';
  suggestedAction: string;
}

/**
 * Migration path information
 */
export interface MigrationPath {
  fromVersion: ComponentVersion;
  toVersion: ComponentVersion;
  componentName: string;
  isBreaking: boolean;
  migrationSteps: string[];
  codeChanges?: {
    search: string;
    replace: string;
    description: string;
  }[];
}

/**
 * Official shadcn/ui canary components with their source code
 */
export const canaryComponents = {
  // Sidebar component (canary)
  sidebar: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Separator } from "./separator"
import { Sheet, SheetContent } from "./sheet"
import { Skeleton } from "./skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

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
  }
>(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
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
      document.cookie = \`\${SIDEBAR_COOKIE_NAME}=\${openState}; path=/; max-age=\${SIDEBAR_COOKIE_MAX_AGE}\`
    },
    [setOpenProp, open]
  )

  const [openMobile, setOpenMobile] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)")
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

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
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
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

  // Command component (canary)
  command: `import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "/lib/utils"
import { Dialog, DialogContent } from "./dialog"

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

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
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
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
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

  // Chart component (canary)
  chart: `import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"

import { cn } from "/lib/utils"

const chartVariants = cva(
  "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
  {
    variants: {
      variant: {
        default: "h-[350px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof chartVariants> & {
      config: Record<string, {
        label?: React.ReactNode
        icon?: React.ComponentType
      } & (
        | { color?: string; theme?: never }
        | { color?: never; theme: Record<string, string> }
      )>
      children: React.ComponentProps<
        typeof Recharts.ResponsiveContainer
      >["children"]
    }
>(({ variant, config, children, className, ...props }, ref) => {
  const id = React.useId()

  return (
    <div
      data-chart={id}
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        chartVariants({ variant }),
        className
      )}
      {...props}
    >
      <ChartStyle id={id} config={config} />
      <Recharts.ResponsiveContainer>
        {children}
      </Recharts.ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: Record<string, any> }) => {
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
            return color ? \`[data-chart="\${id}"] .\${key} { color: \${color}; }\` : null
          })
          .join(""),
      }}
    />
  )
}

export { ChartContainer, ChartStyle }
`,
};

/**
 * Component metadata registry
 */
export const componentMetadata: Record<string, ComponentMetadata> = {
  // Stable components metadata
  button: {
    name: 'button',
    version: ComponentVersion.STABLE,
    dependencies: ['@radix-ui/react-slot', 'class-variance-authority'],
    conflicts: [],
    description: 'A clickable button component with multiple variants',
    isExperimental: false,
  },
  card: {
    name: 'card',
    version: ComponentVersion.STABLE,
    dependencies: [],
    conflicts: [],
    description: 'A flexible container component',
    isExperimental: false,
  },
  dialog: {
    name: 'dialog',
    version: ComponentVersion.STABLE,
    dependencies: ['@radix-ui/react-dialog'],
    conflicts: [],
    description: 'A modal dialog component',
    isExperimental: false,
  },

  // Canary components metadata
  sidebar: {
    name: 'sidebar',
    version: ComponentVersion.CANARY,
    dependencies: [
      '@radix-ui/react-slot',
      'class-variance-authority',
      'lucide-react',
      'button',
      'input',
      'separator',
      'sheet',
      'skeleton',
      'tooltip',
    ],
    conflicts: [],
    description: 'A collapsible sidebar component with mobile support',
    isExperimental: true,
    stableIn: 'v0.9.0',
    breakingChanges: [
      'SidebarProvider context API may change',
      'CSS custom properties may be renamed',
    ],
  },
  command: {
    name: 'command',
    version: ComponentVersion.CANARY,
    dependencies: ['@radix-ui/react-dialog', 'cmdk', 'lucide-react', 'dialog'],
    conflicts: [],
    description: 'A command palette component for search and actions',
    isExperimental: true,
    stableIn: 'v0.9.0',
    breakingChanges: ['CommandDialog API may change', 'Keyboard shortcuts may be modified'],
  },
  chart: {
    name: 'chart',
    version: ComponentVersion.CANARY,
    dependencies: ['class-variance-authority', 'recharts'],
    conflicts: [],
    description: 'Chart components built on top of Recharts',
    isExperimental: true,
    stableIn: 'v0.10.0',
    breakingChanges: ['ChartContainer API may change', 'Theme configuration may be restructured'],
  },
};

/**
 * Migration paths between component versions
 */
export const migrationPaths: MigrationPath[] = [
  {
    fromVersion: ComponentVersion.CANARY,
    toVersion: ComponentVersion.STABLE,
    componentName: 'sidebar',
    isBreaking: false,
    migrationSteps: [
      'Update import statements to use stable version',
      'Review any custom CSS that depends on canary-specific classes',
      'Test responsive behavior on mobile devices',
    ],
    codeChanges: [
      {
        search: 'import { Sidebar } from "./ui/sidebar-canary"',
        replace: 'import { Sidebar } from "./ui/sidebar"',
        description: 'Update import to stable version',
      },
    ],
  },
  {
    fromVersion: ComponentVersion.STABLE,
    toVersion: ComponentVersion.CANARY,
    componentName: 'sidebar',
    isBreaking: true,
    migrationSteps: [
      'Update import statements to use canary version',
      'Wrap your app with SidebarProvider',
      'Update any custom styling to use new CSS custom properties',
      'Test new mobile behavior and keyboard shortcuts',
    ],
    codeChanges: [
      {
        search: 'import { Sidebar } from "./ui/sidebar"',
        replace: 'import { Sidebar, SidebarProvider } from "./ui/sidebar"',
        description: 'Update import to canary version with provider',
      },
    ],
  },
];

/**
 * Dependency resolution utilities
 */
export const resolveDependencies = (componentName: string, version: ComponentVersion): string[] => {
  const metadata = componentMetadata[componentName];
  if (!metadata) {
    return [];
  }

  return metadata.dependencies;
};

/**
 * Conflict detection utilities
 */
export const detectConflicts = (
  components: Array<{ name: string; version: ComponentVersion }>,
): VersionConflict[] => {
  const conflicts: VersionConflict[] = [];

  // Check for version conflicts between components
  for (const component of components) {
    const metadata = componentMetadata[component.name];
    if (!metadata) continue;

    const conflictingComponents = components.filter(
      (c) => metadata.conflicts.includes(c.name) && c.version !== component.version,
    );

    if (conflictingComponents.length > 0) {
      conflicts.push({
        componentName: component.name,
        requestedVersion: component.version,
        conflictingComponents: conflictingComponents.map((c) => c.name),
        resolution: 'pending',
        suggestedAction: `Consider using ${ComponentVersion.STABLE} version for all conflicting components`,
      });
    }
  }

  return conflicts;
};

/**
 * Get available components for a specific version
 */
export const getComponentsForVersion = (version: ComponentVersion): string[] => {
  return Object.entries(componentMetadata)
    .filter(([_, metadata]) => metadata.version === version)
    .map(([name]) => name);
};

/**
 * Check if a component has a specific version available
 */
export const hasComponentVersion = (componentName: string, version: ComponentVersion): boolean => {
  const metadata = componentMetadata[componentName];
  return metadata?.version === version || false;
};
