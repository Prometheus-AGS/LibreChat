# Artifact Import Path Fix

## Problem Description

LibreChat artifacts were experiencing import resolution errors when using shadcn/ui components. The error manifested as:

```
ModuleNotFoundError
Could not find module in path: ''lib/utils'' (see below for file content) relative to '/App.tsx'
```

## Root Cause

The issue was caused by inconsistent import paths across the artifact system:

1. **Component Templates**: Used relative paths `"../../lib/utils"`
2. **Shared Files Mapping**: Used absolute paths `/lib/utils.ts`
3. **AI Prompts**: Showed incorrect examples and allowed malformed imports

## Solution Implemented

### 1. Fixed Component Templates
Updated all shadcn component templates in `packages/data-provider/src/artifacts.ts`:
- **Before**: `import { cn } from "../../lib/utils"`
- **After**: `import { cn } from "/lib/utils"`

### 2. Updated AI Prompts
Enhanced `api/app/clients/prompts/artifacts.js` with:
- Explicit instructions for correct `cn` utility import
- Validation rules to prevent malformed imports
- Clear examples of proper import syntax

### 3. Added Import Validation
Added critical validation instruction:
```
CRITICAL: Import statements must be clean and properly formatted. 
Never include explanatory text, comments, or additional quotes within import statements. 
For example, use `import { cn } from "/lib/utils"` NOT `import { cn } from "'lib/utils"' (see below for file content)`.
```

## Correct Import Patterns

### For shadcn/ui Components
```typescript
import { cn } from "/lib/utils"
import { Button } from "/components/ui/button"
import { Card, CardContent, CardHeader } from "/components/ui/card"
```

### File Structure in Sandpack
```
/lib/utils.ts          <- Contains cn utility function
/components/ui/        <- Contains all shadcn components
  ├── button.tsx
  ├── card.tsx
  ├── input.tsx
  └── ...
```

## Testing

To verify the fix works:

1. Generate a React artifact that uses shadcn components
2. Ensure imports use `/lib/utils` path
3. Verify the artifact renders without module resolution errors

## Files Modified

1. `packages/data-provider/src/artifacts.ts` - Updated 42 component templates
2. `api/app/clients/prompts/artifacts.js` - Added import validation and correct examples
3. Built data-provider package to apply changes

## Impact

This fix resolves the "Module not found" errors for all React artifacts using shadcn/ui components, ensuring consistent import resolution in the Sandpack environment.