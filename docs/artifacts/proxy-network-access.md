# Artifact Network Access via Proxy

LibreChat provides unrestricted network access for artifacts through a built-in proxy system that bypasses CORS restrictions and allows artifacts to make HTTP requests to any external API or service.

## Overview

The proxy system consists of:
- **Backend Proxy Controller**: Handles HTTP forwarding without CORS restrictions
- **Client-side Proxy Utility**: Easy-to-use functions for making external requests
- **Automatic Configuration**: Proxy settings are automatically injected into artifacts

## Quick Start

Instead of using the regular `fetch()` function, use `proxyFetch()` in your artifacts:

```javascript
// ❌ This will likely fail due to CORS
const response = await fetch('https://api.example.com/data');

// ✅ This will work through LibreChat's proxy
const response = await proxyFetch('https://api.example.com/data');
const data = await response.json();
```

## Available Functions

### `proxyFetch(url, options)`

Drop-in replacement for the native `fetch()` function that routes requests through LibreChat's proxy.

```javascript
const response = await proxyFetch('https://api.github.com/users/octocat', {
  method: 'GET',
  headers: {
    'Authorization': 'token your-github-token',
    'Accept': 'application/vnd.github.v3+json'
  }
});

const userData = await response.json();
```

### Convenience Methods

The `proxyHttp` object provides convenient methods for common HTTP operations:

```javascript
// GET request
const users = await proxyHttp.get('https://jsonplaceholder.typicode.com/users');

// POST request with JSON data
const newUser = await proxyHttp.post('https://api.example.com/users', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});

// PUT request
const updatedUser = await proxyHttp.put('https://api.example.com/users/123', {
  name: 'Jane Smith'
});

// DELETE request
await proxyHttp.delete('https://api.example.com/users/123');

// PATCH request
const patchedUser = await proxyHttp.patch('https://api.example.com/users/123', {
  email: 'jane.smith@example.com'
});
```

### Custom Headers

You can send custom headers with any request:

```javascript
const response = await proxyFetch('https://api.example.com/protected', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-api-token',
    'X-Custom-Header': 'custom-value',
    'User-Agent': 'MyArtifact/1.0'
  }
});
```

### API Utility Function

For automatic JSON parsing and error handling:

```javascript
// Automatically parses JSON response
const userData = await proxyApi('https://api.example.com/user/123');

// With TypeScript support
interface User {
  id: number;
  name: string;
  email: string;
}

const user = await proxyApi<User>('https://api.example.com/user/123');
console.log(user.name); // TypeScript knows this is a string
```

## Supported Features

### ✅ What Works

- **Any HTTP Method**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Any URL**: No domain restrictions whatsoever
- **Custom Headers**: Send any headers including authentication tokens
- **Request Bodies**: JSON, form data, text, binary data
- **Response Types**: JSON, text, binary data, images
- **Authentication**: Bearer tokens, API keys, custom auth headers
- **CORS Bypass**: Complete elimination of CORS issues
- **Binary Data**: Images, files, and other binary content

### 🔒 Security

- **Authentication Required**: All proxy requests require valid LibreChat authentication
- **User Context**: Requests are made in the context of the authenticated user
- **Logging**: All proxy requests are logged for security monitoring
- **Rate Limiting**: Standard LibreChat rate limits apply

## Examples

### Fetching JSON Data

```javascript
async function fetchUserData() {
  try {
    const response = await proxyFetch('https://jsonplaceholder.typicode.com/users/1');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const user = await response.json();
    console.log('User:', user);
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
```

### Creating a Resource

```javascript
async function createPost(title, content) {
  const newPost = {
    title: title,
    body: content,
    userId: 1
  };

  const response = await proxyFetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newPost)
  });

  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.status}`);
  }

  return await response.json();
}
```

### Working with APIs that Require Authentication

```javascript
async function fetchGitHubUser(username, token) {
  const response = await proxyFetch(`https://api.github.com/users/${username}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'LibreChat-Artifact'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return await response.json();
}
```

### Fetching Binary Data (Images)

```javascript
async function fetchImage(imageUrl) {
  const response = await proxyFetch(imageUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();
  const imageObjectURL = URL.createObjectURL(blob);
  
  // Use the image
  const img = document.createElement('img');
  img.src = imageObjectURL;
  document.body.appendChild(img);
}
```

### Working with REST APIs

```javascript
class APIClient {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers
    };

    return await proxyFetch(url, {
      ...options,
      headers
    });
  }

  async get(endpoint) {
    const response = await this.request(endpoint);
    return await response.json();
  }

  async post(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async put(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async delete(endpoint) {
    const response = await this.request(endpoint, {
      method: 'DELETE'
    });
    return response.ok;
  }
}

// Usage
const api = new APIClient('https://api.example.com', 'your-api-key');
const users = await api.get('/users');
const newUser = await api.post('/users', { name: 'John', email: 'john@example.com' });
```

## Error Handling

The proxy system provides detailed error information:

```javascript
try {
  const response = await proxyFetch('https://api.example.com/data');
  const data = await response.json();
} catch (error) {
  if (error.message.includes('Proxy request failed')) {
    console.error('Proxy server error:', error);
  } else if (error.message.includes('External request failed')) {
    console.error('External API error:', error);
  } else if (error.message.includes('Network')) {
    console.error('Network connectivity issue:', error);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Utility Functions

### Check Proxy Availability

```javascript
if (isProxyAvailable()) {
  console.log('Proxy is available and configured');
} else {
  console.log('Proxy is not available');
}
```

### Get Proxy Status

```javascript
const status = getProxyStatus();
console.log('Proxy enabled:', status.enabled);
console.log('Proxy endpoint:', status.endpoint);
console.log('Has authentication token:', status.hasToken);
```

## Best Practices

### 1. Always Handle Errors

```javascript
async function safeApiCall(url) {
  try {
    const response = await proxyFetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
}
```

### 2. Use Appropriate HTTP Methods

```javascript
// ✅ Good: Use appropriate HTTP methods
await proxyHttp.get('/api/users');           // Fetch data
await proxyHttp.post('/api/users', userData); // Create resource
await proxyHttp.put('/api/users/123', userData); // Update resource
await proxyHttp.delete('/api/users/123');    // Delete resource

// ❌ Avoid: Using GET for everything
```

### 3. Include Proper Headers

```javascript
// ✅ Good: Include appropriate headers
const response = await proxyFetch('https://api.example.com/data', {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'MyArtifact/1.0'
  }
});
```

### 4. Validate Responses

```javascript
async function fetchAndValidate(url) {
  const response = await proxyFetch(url);
  
  // Check HTTP status
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  
  // Check content type
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Response is not JSON');
  }
  
  const data = await response.json();
  
  // Validate data structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response data');
  }
  
  return data;
}
```

## Troubleshooting

### Common Issues

1. **"Proxy is not enabled"**
   - The proxy configuration is not properly injected
   - Check that you're running the artifact in LibreChat

2. **"Network request failed"**
   - The target URL is unreachable
   - Check the URL and network connectivity

3. **"Authentication failed"**
   - Your LibreChat session may have expired
   - Refresh the page and try again

4. **"Request timeout"**
   - The external API is taking too long to respond
   - Consider implementing retry logic or increasing timeout

### Debug Information

```javascript
// Check proxy configuration
console.log('Proxy config:', window.__LIBRECHAT_PROXY_CONFIG__);

// Check proxy status
console.log('Proxy status:', getProxyStatus());

// Enable detailed logging
window.DEBUG_PROXY = true; // This will log all proxy requests
```

## Limitations

- **Authentication Required**: All requests require valid LibreChat authentication
- **Rate Limits**: Subject to LibreChat's standard rate limiting
- **Timeout**: Requests timeout after 30 seconds
- **File Size**: Large file uploads/downloads may be limited by server configuration

## Migration from Regular Fetch

To migrate existing code that uses `fetch()`:

```javascript
// Before
const response = await fetch('https://api.example.com/data');

// After
const response = await proxyFetch('https://api.example.com/data');
```

The `proxyFetch` function is designed to be a drop-in replacement for `fetch()`, so most existing code will work with minimal changes.