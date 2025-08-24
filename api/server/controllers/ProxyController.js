const fetch = require('node-fetch');
const { logger } = require('~/config');

/**
 * Proxy Controller for Artifacts
 * Provides unrestricted HTTP forwarding to bypass CORS limitations
 * Allows artifacts to make requests to any external API or service
 */

/**
 * Proxy any HTTP request to external services
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const proxyRequest = async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body } = req.body;

    // Validate required URL parameter
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a valid URL to proxy the request to',
      });
    }

    // Validate URL format
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL with protocol (http:// or https://)',
      });
    }

    // Prepare headers for the external request
    const proxyHeaders = {
      ...headers,
      // Remove host header to avoid conflicts
      host: undefined,
      // Remove origin header to avoid CORS issues
      origin: undefined,
      // Remove referer header
      referer: undefined,
      // Add user agent if not provided
      'user-agent': headers['user-agent'] || 'LibreChat-Artifact-Proxy/1.0',
    };

    // Clean up undefined headers
    Object.keys(proxyHeaders).forEach((key) => {
      if (proxyHeaders[key] === undefined) {
        delete proxyHeaders[key];
      }
    });

    // Prepare request options
    const requestOptions = {
      method: method.toUpperCase(),
      headers: proxyHeaders,
      timeout: 30000, // 30 second timeout
      follow: 10, // Follow up to 10 redirects
      compress: true, // Enable gzip compression
    };

    // Add body for methods that support it
    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      if (typeof body === 'string') {
        requestOptions.body = body;
      } else if (typeof body === 'object') {
        requestOptions.body = JSON.stringify(body);
        // Set content-type if not already set
        if (!proxyHeaders['content-type']) {
          proxyHeaders['content-type'] = 'application/json';
        }
      }
    }

    logger.debug(`Proxying ${method.toUpperCase()} request to: ${url}`, {
      userId: req.user?.id,
      targetUrl: url,
      method: method.toUpperCase(),
      hasBody: !!body,
    });

    // Make the external request
    const response = await fetch(targetUrl.toString(), requestOptions);

    // Get response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Set CORS headers to allow artifact access
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': '*',
      // Forward important response headers
      'Content-Type': responseHeaders['content-type'] || 'application/octet-stream',
      'Content-Length': responseHeaders['content-length'],
      'Cache-Control': responseHeaders['cache-control'],
      ETag: responseHeaders['etag'],
      'Last-Modified': responseHeaders['last-modified'],
    });

    // Set response status
    res.status(response.status);

    // Handle different content types
    const contentType = responseHeaders['content-type'] || '';

    if (contentType.includes('application/json')) {
      // JSON response
      const jsonData = await response.json();
      return res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: jsonData,
      });
    } else if (contentType.includes('text/')) {
      // Text response
      const textData = await response.text();
      return res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: textData,
      });
    } else {
      // Binary response (images, files, etc.)
      const buffer = await response.buffer();
      const base64Data = buffer.toString('base64');
      return res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: base64Data,
        encoding: 'base64',
      });
    }
  } catch (error) {
    logger.error('Proxy request failed:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      url: req.body?.url,
    });

    // Handle different types of errors
    if (error.code === 'ENOTFOUND') {
      return res.status(404).json({
        error: 'Host not found',
        message: 'The requested URL could not be reached. Please check the URL and try again.',
      });
    } else if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Connection refused',
        message: 'The target server refused the connection.',
      });
    } else if (error.code === 'ETIMEDOUT' || error.type === 'request-timeout') {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'The request took too long to complete. Please try again.',
      });
    } else if (error.type === 'invalid-json') {
      return res.status(422).json({
        error: 'Invalid JSON response',
        message: 'The server returned invalid JSON data.',
      });
    } else {
      return res.status(500).json({
        error: 'Proxy request failed',
        message: 'An unexpected error occurred while processing the request.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
};

/**
 * Handle OPTIONS requests for CORS preflight
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleOptions = (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400', // 24 hours
  });
  res.status(204).send();
};

/**
 * Get proxy status and configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProxyStatus = (req, res) => {
  res.json({
    status: 'active',
    version: '1.0.0',
    features: {
      cors_bypass: true,
      all_methods: true,
      binary_support: true,
      json_support: true,
      text_support: true,
      redirect_follow: true,
      compression: true,
    },
    limits: {
      timeout: 30000,
      max_redirects: 10,
    },
    user: {
      id: req.user?.id,
      authenticated: !!req.user,
    },
  });
};

module.exports = {
  proxyRequest,
  handleOptions,
  getProxyStatus,
};
