# Supabase + Zustand Artifact Examples

This directory contains example artifacts that demonstrate how to use Supabase and Zustand in LibreChat artifacts. These examples show real-world patterns and best practices for building data-driven applications within the artifact system.

## Available Examples

### 1. SupabaseTodoApp.tsx
A complete todo application demonstrating:
- **Supabase Integration**: CRUD operations with PostgreSQL
- **Zustand State Management**: Local state management with persistence
- **Error Handling**: Comprehensive error handling and user feedback
- **Configuration Validation**: Graceful handling of missing configuration

**Required Supabase Setup:**
```sql
-- Create todos table
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on todos" ON todos FOR ALL USING (true);
```

### 2. SupabaseUserProfile.tsx
A user profile management component showing:
- **User Authentication**: Integration with Supabase Auth
- **Profile Management**: CRUD operations for user profiles
- **Form Handling**: Inline editing with validation
- **Image Handling**: Avatar URL management with fallbacks

**Required Supabase Setup:**
```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3. SupabaseRealtimeChat.tsx
A real-time chat application demonstrating:
- **Realtime Subscriptions**: Live updates using Supabase Realtime
- **Message Broadcasting**: Real-time message delivery
- **User Management**: Simple user identification system
- **UI Patterns**: Chat interface with message bubbles and timestamps

**Required Supabase Setup:**
```sql
-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 4. SupabaseDashboard.tsx
A data dashboard showing:
- **Complex Queries**: Multiple data sources and aggregations
- **Data Visualization**: Simple charts and metrics
- **Refresh Patterns**: Manual and automatic data refreshing
- **Loading States**: Skeleton loading and error states

**Required Supabase Setup:**
```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Allow read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read access to posts" ON posts FOR SELECT USING (true);
```

## How to Use These Examples

### 1. Configure Supabase
1. Go to your artifact settings
2. Enable "Use Supabase"
3. Enter your Supabase URL and Anonymous Key
4. Optionally add your Service Key for admin operations

### 2. Set Up Database Tables
Run the SQL commands provided for each example in your Supabase SQL editor.

### 3. Copy and Modify
These examples are designed to be copied and modified for your specific use cases. The patterns shown can be adapted for different data models and business logic.

## Key Patterns and Best Practices

### Configuration Validation
All examples check for Supabase configuration and show helpful error messages:

```tsx
if (!supabase) {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Configuration Required</h2>
      <p className="text-red-600">This artifact requires Supabase configuration...</p>
    </div>
  );
}
```

### Error Handling
Comprehensive error handling with user-friendly messages:

```tsx
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  // Handle success
} catch (err) {
  setError(err instanceof Error ? err.message : 'Operation failed');
}
```

### State Management with Zustand
Clean separation of concerns using Zustand stores:

```tsx
const {
  data,
  loading,
  error,
  setData,
  setLoading,
  setError,
} = useDataStore();
```

### Loading States
Proper loading states and skeleton screens:

```tsx
if (loading && !data) {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}
```

### Realtime Subscriptions
Proper setup and cleanup of Supabase realtime subscriptions:

```tsx
useEffect(() => {
  const channel = supabase
    .channel('table-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'table' }, handleInsert)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Available Zustand Stores

The shared `/lib/stores.ts` file provides several pre-configured stores:

- `useTodoStore`: For todo list management
- `useUserStore`: For user profile management  
- `useChatStore`: For chat message management
- `useDashboardStore`: For dashboard data management
- `useGenericStore`: For general-purpose data management

## Available Utilities

The shared `/lib/supabase.ts` file provides:

- `createSupabase()`: Creates a configured Supabase client
- Type definitions for common Supabase operations
- Helper functions for common patterns

## Tips for AI-Generated Artifacts

When creating artifacts that use Supabase and Zustand:

1. **Always check configuration first**: Use the configuration validation pattern
2. **Use appropriate stores**: Choose the right Zustand store for your data type
3. **Handle loading states**: Provide feedback during async operations
4. **Include error handling**: Show meaningful error messages to users
5. **Follow the patterns**: Use the established patterns from these examples
6. **Document database requirements**: Clearly specify required tables and setup

## Troubleshooting

### Common Issues

1. **"Supabase is not configured"**: Enable Supabase in artifact settings and provide credentials
2. **"Table doesn't exist"**: Run the SQL setup commands in your Supabase project
3. **"Row Level Security policy violation"**: Adjust RLS policies or disable RLS for testing
4. **"Realtime not working"**: Ensure Realtime is enabled for your tables
5. **"CORS errors"**: Check your Supabase project's CORS settings

### Database Setup Checklist

- [ ] Tables created with correct schema
- [ ] Row Level Security configured (if needed)
- [ ] Policies created for data access
- [ ] Realtime enabled (for real-time features)
- [ ] Supabase URL and keys configured in artifact settings

## Next Steps

These examples provide a foundation for building more complex applications. Consider extending them with:

- Authentication flows
- File upload handling
- Advanced querying and filtering
- Data validation and sanitization
- Performance optimizations
- Offline support
- Push notifications

For more information, see the [Supabase documentation](https://supabase.com/docs) and [Zustand documentation](https://github.com/pmndrs/zustand).