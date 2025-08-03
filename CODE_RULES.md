# LibreChat Development Code Rules

This document establishes development practices and rules for the LibreChat codebase to ensure consistency, quality, and knowledge retention.

## Core Development Rules

### Rule 1: Post-Bug Resolution Memory Documentation
**TRIGGER**: Immediately after successfully resolving any bug that results in zero errors/warnings
**REQUIRED ACTION**: Create a comprehensive memory entry using the memory MCP server

**Memory Entry Must Include**:
- **Error Symptoms**: Exact error messages, visual symptoms, or behavioral issues observed
- **Root Cause Analysis**: The underlying technical reason for the bug
- **Solution Implementation**: Specific code changes, configuration updates, or architectural modifications made
- **Files Modified**: Complete list of files changed with brief description of changes
- **Verification Method**: Testing approach used to confirm the fix works
- **Prevention Notes**: How to avoid this issue in the future

**Memory Title Format**: `"Fixed [Component/Module] [Error Type]: [Brief Description]"`

**Examples**:
- `"Fixed React Component State Management: useEffect dependency array causing infinite re-renders"`
- `"Fixed MongoDB Connection: Authentication timeout due to incorrect connection string format"`
- `"Fixed TypeScript Build: Missing type definitions for custom hooks"`

### Rule 2: Pre-Development Context Research
**TRIGGER**: Before implementing any new feature, bug fix, or architectural change
**REQUIRED ACTION**: Query the memory MCP server for relevant historical context

**Research Areas**:
- **Similar Issues**: Search for previously resolved bugs with similar symptoms or components
- **Related Features**: Look for existing implementations of comparable functionality
- **Architectural Patterns**: Identify established patterns used in similar areas of the codebase
- **Known Pitfalls**: Find documented challenges or considerations for the specific component/area
- **Dependencies**: Understand existing integrations and their requirements

**Search Strategy**:
- Use specific component names (e.g., "AdminSettings", "Chat", "Authentication")
- Include error types or feature categories (e.g., "state management", "API integration", "UI rendering")
- Search for technology-specific terms (e.g., "React", "MongoDB", "TypeScript", "Express")

**Documentation Requirement**: 
If relevant context is found, reference it in commit messages or code comments to maintain traceability.

## Implementation Guidelines

### Memory Creation Best Practices
1. **Be Specific**: Include exact error messages, file paths, and line numbers when relevant
2. **Include Context**: Explain why the bug occurred, not just how it was fixed
3. **Add Keywords**: Use searchable terms that future developers might use
4. **Link Related Issues**: Reference any GitHub issues, documentation, or external resources

### Memory Search Best Practices
1. **Start Broad**: Begin with general component or feature terms
2. **Narrow Down**: Use more specific error messages or technical terms
3. **Check Multiple Angles**: Search for both the problem and the solution approach
4. **Document Findings**: Note what context was found and how it influenced the implementation

## Enforcement and Compliance

### For AI Assistants and Automated Tools
- These rules are **mandatory** and must be followed for every bug fix and feature implementation
- Memory creation is not optional - it's a required step in the development process
- Context research must be performed before beginning any significant code changes

### For Human Developers
- These rules represent best practices for knowledge management and should be followed when possible
- Consider using similar memory/documentation practices in your development workflow
- When working with AI assistants, ensure they follow these rules consistently

## Benefits

### Knowledge Retention
- Prevents repeating the same debugging process for similar issues
- Builds institutional knowledge that survives team changes
- Creates searchable documentation of solutions and patterns

### Development Efficiency
- Reduces time spent on similar problems
- Provides proven solutions and patterns for reuse
- Helps maintain consistency across the codebase

### Code Quality
- Encourages thorough understanding of problems before implementing solutions
- Promotes consideration of existing patterns and architectures
- Reduces introduction of conflicting or inconsistent approaches

## Related Files

- `.clinerules`: Technical setup and architecture documentation for AI assistants
- `docs/`: Comprehensive project documentation
- `README.md`: Project overview and getting started guide

---

*This document should be updated as development practices evolve and new patterns emerge.*
