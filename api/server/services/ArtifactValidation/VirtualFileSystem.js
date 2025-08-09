const ts = require('typescript');
const path = require('path');

/**
 * Virtual File System for TypeScript compilation
 * Handles all file operations in memory without disk I/O
 */
class VirtualFileSystem {
  constructor() {
    this.files = new Map();
    this.initializeDefaultFiles();
  }

  /**
   * Initializes default type definition files for React and shadcn/ui
   */
  initializeDefaultFiles() {
    // React type definitions (simplified)
    this.files.set(
      '/node_modules/@types/react/index.d.ts',
      `
declare module 'react' {
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  export type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<any, any>);
  export type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;
  export type Key = string | number;
  export type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
  export type ReactFragment = {} & Iterable<ReactNode>;
  export type ReactPortal = {} & ReactNode;

  export interface Component<P = {}, S = {}, SS = any> {}
  export class Component<P, S> {
    constructor(props: P);
    props: Readonly<P>;
    state: Readonly<S>;
    render(): ReactNode;
  }

  export interface FunctionComponent<P = {}> {
    (props: P): ReactElement<any, any> | null;
    displayName?: string;
  }

  export interface ComponentClass<P = {}, S = ComponentState> extends StaticLifecycle<P, S> {
    new (props: P): Component<P, S>;
  }

  export interface FunctionComponentElement<P> extends ReactElement<P, string> {
    ref?: ((instance: FunctionComponent<P> | null) => void) | RefObject<FunctionComponent<P> | null> | null;
  }

  export type ComponentState = any;
  export type StaticLifecycle<P, S> = Lifecycle<P, S> & ChildContextTypes<P>;

  export interface Lifecycle<P, S, SS = any> {
    componentDidMount?(): void;
    shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
    componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: SS): void;
    componentWillUnmount?(): void;
  }

  export interface ChildContextTypes<P> {
    getChildContext?(): object;
  }

  export type RefObject<T> = {
    readonly current: T | null;
  };

  export interface JSXElementConstructor<T> {
    (props: T, ...children: ReactNode[]): ReactElement<any, any> | null;
  }

  export interface JSXIntrinsicElements {
    div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
    p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
    button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
    h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
    h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
    h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
    img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
    a: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
    ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
    li: React.DetailedHTMLProps<React.HTMLAttributes<HTMLLIElement>, HTMLLIElement>;
    form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
    label: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
    textarea: React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
    select: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
    option: React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
    table: React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>;
    thead: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
    tbody: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
    tr: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>;
    td: React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>;
    th: React.DetailedHTMLProps<React.ThHTMLAttributes<HTMLTableHeaderCellElement>, HTMLTableHeaderCellElement>;
  }

  export interface DetailedHTMLProps<E extends HTMLAttributes<T>, T> extends E {
    ref?: Ref<T>;
  }

  export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    className?: string;
    id?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  export interface DOMAttributes<T> {
    children?: ReactNode;
    dangerouslySetInnerHTML?: {
      __html: string;
    };
  }

  export interface AriaAttributes {
    'aria-activedescendant'?: string;
    'aria-atomic'?: boolean;
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
    'aria-busy'?: boolean;
    'aria-checked'?: boolean | 'mixed';
    'aria-colcount'?: number;
    'aria-colindex'?: number;
    'aria-colspan'?: number;
    'aria-controls'?: string;
    'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
    'aria-describedby'?: string;
    'aria-details'?: string;
    'aria-disabled'?: boolean;
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    'aria-errormessage'?: string;
    'aria-expanded'?: boolean;
    'aria-flowto'?: string;
    'aria-grabbed'?: boolean;
    'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    'aria-hidden'?: boolean;
    'aria-invalid'?: boolean | 'grammar' | 'spelling';
    'aria-keyshortcuts'?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-level'?: number;
    'aria-live'?: 'off' | 'assertive' | 'polite';
    'aria-modal'?: boolean;
    'aria-multiline'?: boolean;
    'aria-multiselectable'?: boolean;
    'aria-orientation'?: 'horizontal' | 'vertical';
    'aria-owns'?: string;
    'aria-placeholder'?: string;
    'aria-posinset'?: number;
    'aria-pressed'?: boolean | 'mixed';
    'aria-readonly'?: boolean;
    'aria-relevant'?: 'additions' | 'additions text' | 'all' | 'removals' | 'text';
    'aria-required'?: boolean;
    'aria-roledescription'?: string;
    'aria-rowcount'?: number;
    'aria-rowindex'?: number;
    'aria-rowspan'?: number;
    'aria-selected'?: boolean;
    'aria-setsize'?: number;
    'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
    'aria-valuemax'?: number;
    'aria-valuemin'?: number;
    'aria-valuenow'?: number;
    'aria-valuetext'?: string;
  }

  export interface CSSProperties {
    [key: string]: string | number | undefined;
  }

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    name?: string;
    type?: 'submit' | 'reset' | 'button';
    value?: string | string[] | number;
  }

  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    accept?: string;
    alt?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    capture?: boolean | string;
    checked?: boolean;
    crossOrigin?: string;
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    height?: number | string;
    list?: string;
    max?: number | string;
    maxLength?: number;
    min?: number | string;
    minLength?: number;
    multiple?: boolean;
    name?: string;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    size?: number;
    src?: string;
    step?: number | string;
    type?: string;
    value?: string | string[] | number;
    width?: number | string;
  }

  export interface Ref<T> {
    (instance: T | null): void;
  }

  const useState: <S>(initialState: S | (() => S)) => [S, Dispatch<SetStateAction<S>>];
  const useEffect: (effect: EffectCallback, deps?: DependencyList) => void;
  const useRef: <T>(initialValue: T | null) => RefObject<T>;
  const useCallback: <T extends (...args: any[]) => any>(callback: T, deps: DependencyList) => T;
  const useMemo: <T>(factory: () => T, deps: DependencyList) => T;
  const useContext: <T>(context: Context<T>) => T;
  const useReducer: <S, A>(reducer: Reducer<S, A>, initialState: S) => [S, Dispatch<A>];

  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);
  type EffectCallback = () => (() => void) | void;
  type DependencyList = ReadonlyArray<any>;
  type Context<T> = React.Context<T>;
  type Reducer<S, A> = (prevState: S, action: A) => S;

  export { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer };
}
`,
    );

    // Add TypeScript lib files
    this.files.set(
      '/node_modules/typescript/lib/lib.d.ts',
      `
/// <reference no-default-lib="true"/>
/// <reference lib="es5" />
/// <reference lib="dom" />
/// <reference lib="es2015.core" />
/// <reference lib="es2015.collection" />
/// <reference lib="es2015.iterable" />
`,
    );

    // shadcn/ui components type definitions
    this.files.set(
      '/components/ui/button.d.ts',
      `
import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
`,
    );

    this.files.set(
      '/components/ui/card.d.ts',
      `
import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardHeader: React.ForwardRefExoticComponent<CardHeaderProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardTitle: React.ForwardRefExoticComponent<CardTitleProps & React.RefAttributes<HTMLHeadingElement>>;
export declare const CardDescription: React.ForwardRefExoticComponent<CardDescriptionProps & React.RefAttributes<HTMLParagraphElement>>;
export declare const CardContent: React.ForwardRefExoticComponent<CardContentProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardFooter: React.ForwardRefExoticComponent<CardFooterProps & React.RefAttributes<HTMLDivElement>>;
`,
    );

    this.files.set(
      '/components/ui/input.d.ts',
      `
import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
`,
    );

    this.files.set(
      '/components/ui/alert.d.ts',
      `
import * as React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export declare const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;
export declare const AlertTitle: React.ForwardRefExoticComponent<AlertTitleProps & React.RefAttributes<HTMLHeadingElement>>;
export declare const AlertDescription: React.ForwardRefExoticComponent<AlertDescriptionProps & React.RefAttributes<HTMLDivElement>>;
`,
    );

    // Lucide React icons
    this.files.set(
      '/node_modules/lucide-react/index.d.ts',
      `
import * as React from 'react';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  color?: string;
  size?: string | number;
}

export declare const Camera: React.FC<IconProps>;
export declare const Check: React.FC<IconProps>;
export declare const ChevronDown: React.FC<IconProps>;
export declare const ChevronLeft: React.FC<IconProps>;
export declare const ChevronRight: React.FC<IconProps>;
export declare const ChevronUp: React.FC<IconProps>;
export declare const Copy: React.FC<IconProps>;
export declare const Download: React.FC<IconProps>;
export declare const Edit: React.FC<IconProps>;
export declare const Eye: React.FC<IconProps>;
export declare const EyeOff: React.FC<IconProps>;
export declare const Heart: React.FC<IconProps>;
export declare const Home: React.FC<IconProps>;
export declare const Mail: React.FC<IconProps>;
export declare const Menu: React.FC<IconProps>;
export declare const Plus: React.FC<IconProps>;
export declare const Search: React.FC<IconProps>;
export declare const Settings: React.FC<IconProps>;
export declare const Star: React.FC<IconProps>;
export declare const Trash: React.FC<IconProps>;
export declare const User: React.FC<IconProps>;
export declare const X: React.FC<IconProps>;
`,
    );

    // Recharts type definitions
    this.files.set(
      '/node_modules/recharts/index.d.ts',
      `
import * as React from 'react';

export interface LineChartProps {
  width?: number;
  height?: number;
  data?: any[];
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  children?: React.ReactNode;
}

export interface LineProps {
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
  dataKey?: string;
  stroke?: string;
  strokeWidth?: number;
  dot?: boolean | object;
  activeDot?: boolean | object;
  hide?: boolean;
  isAnimationActive?: boolean;
  animationDuration?: number;
  animationEasing?: string;
}

export interface XAxisProps {
  dataKey?: string;
  type?: 'category' | 'number';
  allowDuplicatedCategory?: boolean;
  angle?: number;
  interval?: number;
  tick?: object;
  tickLine?: boolean | object;
  axisLine?: boolean | object;
}

export interface YAxisProps {
  type?: 'category' | 'number';
  domain?: [number, number] | ['dataMin', 'dataMax'] | ['auto', 'auto'];
  allowDataOverflow?: boolean;
  tick?: object;
  tickLine?: boolean | object;
  axisLine?: boolean | object;
}

export interface CartesianGridProps {
  strokeDasharray?: string | number;
  stroke?: string;
  horizontal?: boolean;
  vertical?: boolean;
}

export interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string, props: any) => React.ReactNode;
  labelFormatter?: (label: any) => React.ReactNode;
}

export interface LegendProps {
  payload?: any[];
  formatter?: (value: any, entry: any, index: number) => React.ReactNode;
}

export declare const LineChart: React.FC<LineChartProps>;
export declare const Line: React.FC<LineProps>;
export declare const XAxis: React.FC<XAxisProps>;
export declare const YAxis: React.FC<YAxisProps>;
export declare const CartesianGrid: React.FC<CartesianGridProps>;
export declare const Tooltip: React.FC<TooltipProps>;
export declare const Legend: React.FC<LegendProps>;
`,
    );
  }

  /**
   * Writes a file to the virtual file system
   * @param {string} fileName - The file name
   * @param {string} content - The file content
   */
  writeFile(fileName, content) {
    this.files.set(this.normalizePath(fileName), content);
  }

  /**
   * Reads a file from the virtual file system
   * @param {string} fileName - The file name
   * @returns {string|undefined} The file content or undefined if not found
   */
  readFile(fileName) {
    return this.files.get(this.normalizePath(fileName));
  }

  /**
   * Checks if a file exists in the virtual file system
   * @param {string} fileName - The file name
   * @returns {boolean} True if the file exists
   */
  fileExists(fileName) {
    return this.files.has(this.normalizePath(fileName));
  }

  /**
   * Normalizes a file path
   * @param {string} filePath - The file path
   * @returns {string} The normalized path
   */
  normalizePath(filePath) {
    return path.normalize(filePath).replace(/\\/g, '/');
  }

  /**
   * Resolves a module name to a file path
   * @param {string} moduleName - The module name
   * @param {string} containingFile - The file that contains the import
   * @returns {string|undefined} The resolved file path
   */
  resolveModuleName(moduleName, containingFile) {
    // Handle relative imports
    if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
      const containingDir = path.dirname(containingFile);
      const resolved = path.resolve(containingDir, moduleName);

      // Try with .d.ts extension for type definitions
      if (this.fileExists(resolved + '.d.ts')) {
        return resolved + '.d.ts';
      }

      // Try with .tsx extension
      if (this.fileExists(resolved + '.tsx')) {
        return resolved + '.tsx';
      }

      // Try with .ts extension
      if (this.fileExists(resolved + '.ts')) {
        return resolved + '.ts';
      }

      return resolved;
    }

    // Handle absolute imports for artifact dependencies
    if (moduleName.startsWith('/')) {
      const resolved = this.normalizePath(moduleName);

      // Try with .d.ts extension for type definitions
      if (this.fileExists(resolved + '.d.ts')) {
        return resolved + '.d.ts';
      }

      // Try with .tsx extension
      if (this.fileExists(resolved + '.tsx')) {
        return resolved + '.tsx';
      }

      // Try with .ts extension
      if (this.fileExists(resolved + '.ts')) {
        return resolved + '.ts';
      }

      return resolved;
    }

    // Handle node_modules imports
    const nodeModulesPath = `/node_modules/${moduleName}/index.d.ts`;
    if (this.fileExists(nodeModulesPath)) {
      return nodeModulesPath;
    }

    // Handle direct type definition files
    const typeDefPath = `/node_modules/@types/${moduleName}/index.d.ts`;
    if (this.fileExists(typeDefPath)) {
      return typeDefPath;
    }

    return undefined;
  }

  /**
   * Creates a TypeScript compiler host for the virtual file system
   * @returns {ts.CompilerHost} TypeScript compiler host
   */
  createCompilerHost() {
    const host = {
      getSourceFile: (fileName, languageVersion) => {
        const content = this.readFile(fileName);
        if (content !== undefined) {
          return ts.createSourceFile(fileName, content, languageVersion, true);
        }
        return undefined;
      },

      getDefaultLibFileName: (options) => {
        return '/node_modules/typescript/lib/lib.d.ts';
      },

      writeFile: () => {
        // No-op for validation (we don't write output files)
      },

      getCurrentDirectory: () => '/',

      getDirectories: () => [],

      fileExists: (fileName) => this.fileExists(fileName),

      readFile: (fileName) => this.readFile(fileName),

      getCanonicalFileName: (fileName) => fileName,

      useCaseSensitiveFileNames: () => true,

      getNewLine: () => '\n',

      resolveModuleNames: (moduleNames, containingFile) => {
        return moduleNames.map((moduleName) => {
          const resolvedFileName = this.resolveModuleName(moduleName, containingFile);
          if (resolvedFileName) {
            return {
              resolvedFileName,
              isExternalLibraryImport: moduleName.startsWith('/node_modules/'),
            };
          }
          return undefined;
        });
      },
    };

    return host;
  }

  /**
   * Clears all files from the virtual file system except defaults
   */
  clear() {
    this.files.clear();
    this.initializeDefaultFiles();
  }

  /**
   * Gets the size of the virtual file system
   * @returns {number} Number of files stored
   */
  size() {
    return this.files.size;
  }
}

module.exports = VirtualFileSystem;