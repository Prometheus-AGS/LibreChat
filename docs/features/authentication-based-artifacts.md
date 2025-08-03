# Authentication-Based Artifact Access in Shared Conversations

This document describes the authentication-based artifact system implemented for LibreChat's shared conversations, which provides different artifact experiences based on user authentication status.

## Overview

The authentication-based artifact system enables a dual-mode approach for artifacts in shared conversations:

- **Authenticated Users**: Full interactive artifact functionality
- **Anonymous Users**: Static previews with login prompts (configurable)

This approach balances security with user accessibility, encouraging authentication while still providing value to anonymous users.

## Architecture

### Frontend Components

#### ShareContext Provider
- **Location**: `client/src/Providers/ShareContext.tsx`
- **Purpose**: Manages authentication state and artifact permissions for shared conversations
- **Key Features**:
  - Detects user authentication status
  - Determines artifact access permissions based on configuration
  - Provides configuration-driven behavior

#### StaticArtifactPreview Component
- **Location**: `client/src/components/Artifacts/StaticArtifactPreview.tsx`
- **Purpose**: Renders read-only artifact previews for anonymous users
- **Features**:
  - HTML iframe previews with security sandboxing
  - Syntax-highlighted code previews
  - Content truncation for large artifacts
  - Login prompts with customizable messaging
  - Support for multiple artifact types (HTML, JavaScript, CSS, JSON, SVG, etc.)

#### Enhanced Artifact Components
- **ArtifactButton**: Modified to support shared conversation paths with authentication-based behavior
- **Artifacts**: Updated to conditionally render interactive vs static views based on authentication status

### Backend Integration

#### Shared Messages API
- **Location**: `api/server/routes/share.js`
- **Enhancement**: Modified to include authentication context in API responses
- **Authentication Context**: Includes `isAuthenticated`, `userId`, and `username` fields

#### Configuration System
- **Location**: `packages/data-provider/src/config.ts`
- **Purpose**: Comprehensive artifact configuration with Zod validation
- **Features**: Supports shared conversation settings, processing controls, and security parameters

## Configuration

### YAML Configuration

Add the following configuration to your `librechat.yaml` file:

```yaml
# Artifact configuration for shared conversations
artifacts:
  # Enable/disable artifacts functionality globally (default: true)
  enabled: true
  
  # Shared conversation artifact access configuration
  sharedConversations:
    # Allow anonymous users to view static artifact previews (default: true)
    allowAnonymousPreview: true
    
    # Require authentication for any artifact access - overrides allowAnonymousPreview (default: false)
    requireAuthentication: false
    
    # Maximum content length for static previews in characters (default: 5000, min: 100, max: 50000)
    previewMaxLength: 5000
    
    # Show login prompt for anonymous users (default: true)
    showLoginPrompt: true
    
    # Custom message for anonymous users (optional)
    anonymousMessage: "Please log in to interact with artifacts"
  
  # Content processing configuration
  processing:
    # Enable syntax highlighting for code artifacts (default: true)
    enableSyntaxHighlighting: true
    
    # Enable HTML iframe previews for HTML artifacts (default: true)
    enableHtmlPreviews: true
    
    # Sanitize HTML content for security (default: true)
    sanitizeHtml: true
    
    # Maximum file size for artifact processing in bytes (default: 1048576 = 1MB, min: 1024, max: 10485760)
    maxFileSize: 1048576
```

### Environment Variable Overrides

You can override configuration settings using environment variables:

```bash
# Disable artifacts globally
ARTIFACTS_ENABLED=false

# Require authentication for all artifact access
ARTIFACTS_SHARED_CONVERSATIONS_REQUIRE_AUTHENTICATION=true

# Disable anonymous previews
ARTIFACTS_SHARED_CONVERSATIONS_ALLOW_ANONYMOUS_PREVIEW=false

# Set custom preview length
ARTIFACTS_SHARED_CONVERSATIONS_PREVIEW_MAX_LENGTH=3000

# Custom anonymous message
ARTIFACTS_SHARED_CONVERSATIONS_ANONYMOUS_MESSAGE="Sign up to interact with code examples"
```

## Security Considerations

### Content Sanitization
- HTML content is sanitized by default to prevent XSS attacks
- Configurable through `processing.sanitizeHtml` setting

### Iframe Sandboxing
- HTML artifacts are rendered in sandboxed iframes
- Sandbox attributes: `allow-scripts allow-same-origin`
- Prevents malicious code execution in the parent context

### Read-Only Mode
- Anonymous users receive read-only artifact previews
- No execution or modification capabilities for unauthenticated users

### Content Truncation
- Large artifacts are truncated for anonymous users
- Configurable maximum length prevents resource abuse

## Usage Scenarios

### Scenario 1: Open Access (Default)
```yaml
artifacts:
  sharedConversations:
    allowAnonymousPreview: true
    requireAuthentication: false
    showLoginPrompt: true
```

**Behavior**:
- Anonymous users see static previews with login prompts
- Authenticated users get full interactive functionality
- Encourages registration while providing value to all users

### Scenario 2: Authentication Required
```yaml
artifacts:
  sharedConversations:
    requireAuthentication: true
    allowAnonymousPreview: false
```

**Behavior**:
- Anonymous users cannot view artifacts at all
- Only authenticated users can access artifact functionality
- Maximum security but may reduce engagement

### Scenario 3: Preview Only
```yaml
artifacts:
  sharedConversations:
    allowAnonymousPreview: true
    requireAuthentication: false
    showLoginPrompt: false
```

**Behavior**:
- Anonymous users see static previews without login prompts
- Authenticated users get full functionality
- Good for public documentation or educational content

## Implementation Details

### Authentication Detection
The system detects authentication status through:
1. JWT token validation in API requests
2. User context in shared message responses
3. ShareContext provider state management

### Artifact Mode Determination
The system determines artifact mode based on:
1. Global artifact enablement
2. User authentication status
3. Configuration settings for shared conversations
4. Explicit mode overrides (if provided)

### Content Processing
Static previews are generated with:
1. Content truncation based on configured limits
2. Syntax highlighting for code artifacts
3. Safe HTML rendering with sanitization
4. Iframe embedding for HTML content

## Testing

### Test Coverage
The implementation includes comprehensive tests covering:

#### Frontend Tests
- **StaticArtifactPreview**: Tests for different artifact types, content truncation, login prompts, and configuration handling
- **ShareContext**: Tests for authentication detection, permission calculation, and configuration integration

#### Backend Tests
- **Share Routes**: Tests for authentication context inclusion, error handling, and API response structure

### Running Tests
```bash
# Run client tests
npm run test:client

# Run API tests
npm run test:api

# Run specific test files
npm test -- --testPathPattern="StaticArtifactPreview"
npm test -- --testPathPattern="ShareContext"
npm test -- --testPathPattern="share.test.js"
```

## Migration Guide

### From Previous Versions
If you're upgrading from a version without authentication-based artifacts:

1. **No Breaking Changes**: The system is backward compatible
2. **Default Behavior**: Anonymous users will see static previews by default
3. **Configuration**: Add artifact configuration to your `librechat.yaml` if you want to customize behavior

### Customization Steps
1. Add artifact configuration to your `librechat.yaml`
2. Restart the LibreChat server
3. Test with both authenticated and anonymous users
4. Adjust configuration based on your security requirements

## Troubleshooting

### Common Issues

#### Artifacts Not Showing for Anonymous Users
- Check `artifacts.enabled` is `true`
- Verify `artifacts.sharedConversations.allowAnonymousPreview` is `true`
- Ensure `artifacts.sharedConversations.requireAuthentication` is `false`

#### Login Prompts Not Appearing
- Verify `artifacts.sharedConversations.showLoginPrompt` is `true`
- Check that the user is actually anonymous (not authenticated)

#### Content Truncation Issues
- Adjust `artifacts.sharedConversations.previewMaxLength` setting
- Check artifact content length against configured limits

#### HTML Previews Not Working
- Ensure `artifacts.processing.enableHtmlPreviews` is `true`
- Check browser console for iframe loading errors
- Verify HTML content is valid and not blocked by CSP

### Debug Information
Enable debug logging to troubleshoot issues:
```bash
DEBUG=librechat:* npm run backend:dev
```

## Best Practices

### Security
1. Always keep `processing.sanitizeHtml` enabled
2. Use `requireAuthentication: true` for sensitive content
3. Set appropriate `previewMaxLength` limits
4. Regularly review and update security settings

### User Experience
1. Use clear and encouraging `anonymousMessage` text
2. Set reasonable `previewMaxLength` for your content
3. Enable `showLoginPrompt` to encourage registration
4. Test with both user types regularly

### Performance
1. Set appropriate `maxFileSize` limits
2. Monitor artifact processing performance
3. Consider caching for frequently accessed shared conversations
4. Use content truncation to manage large artifacts

## API Reference

### Authentication Context
The shared messages API now includes an `authContext` field:

```typescript
interface AuthContext {
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
}

interface SharedMessagesResult {
  messages: TMessage[];
  conversation: TConversation;
  authContext: AuthContext;
}
```

### Configuration Schema
The artifact configuration follows this TypeScript interface:

```typescript
interface ArtifactConfig {
  enabled?: boolean;
  sharedConversations?: {
    allowAnonymousPreview?: boolean;
    requireAuthentication?: boolean;
    previewMaxLength?: number;
    showLoginPrompt?: boolean;
    anonymousMessage?: string;
  };
  processing?: {
    enableSyntaxHighlighting?: boolean;
    enableHtmlPreviews?: boolean;
    sanitizeHtml?: boolean;
    maxFileSize?: number;
  };
}
```

## Contributing

When contributing to the authentication-based artifact system:

1. **Tests**: Add tests for new functionality
2. **Documentation**: Update this document for any changes
3. **Security**: Consider security implications of changes
4. **Backward Compatibility**: Maintain compatibility with existing configurations
5. **Performance**: Consider impact on shared conversation loading times

## Support

For issues related to authentication-based artifacts:

1. Check this documentation first
2. Review the troubleshooting section
3. Check existing GitHub issues
4. Create a new issue with detailed reproduction steps

---

*This documentation covers the authentication-based artifact access system implemented in LibreChat. For general artifact documentation, see the main artifacts documentation.*