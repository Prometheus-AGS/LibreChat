const fetch = require('node-fetch');
const { loadAuthValues } = require('~/server/services/Tools/credentials');

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.loginUrl
 * @param {object} [params.req] - Express request object for accessing app config
 * @returns {Promise<string>}
 */
const getDjangoAuthToken = async ({ userId, loginUrl, req = null }) => {
  let email, password;

  try {
    // First try to get credentials from user's stored auth values
    const credentials = await loadAuthValues({
      userId,
      authFields: ['BRIUS_EMAIL', 'BRIUS_PASSWORD'],
    });

    email = credentials.BRIUS_EMAIL;
    password = credentials.BRIUS_PASSWORD;
  } catch (error) {
    // If user credentials are not available, try environment variables
    email = process.env.DJANGO_USERNAME || process.env.BRIUS_EMAIL;
    password = process.env.DJANGO_PASSWORD || process.env.BRIUS_PASSWORD;

    // Try to get from app config if request is available
    if (!email || !password) {
      if (req && req.app && req.app.locals && req.app.locals.config) {
        const config = req.app.locals.config;
        if (config.django) {
          email = config.django.username || config.django.email;
          password = config.django.password;
        }
      }
    }
  }

  if (!email || !password) {
    throw new Error(
      'Missing Django credentials. Please configure them in your user settings, environment variables (DJANGO_USERNAME/BRIUS_EMAIL, DJANGO_PASSWORD/BRIUS_PASSWORD), or librechat.yaml file.',
    );
  }

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      // Also try username field for Django REST auth compatibility
      username: email,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get Django auth token: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();

  if (!data.key && !data.token) {
    throw new Error(
      'Invalid response format: missing authentication token (expected "key" or "token" field)',
    );
  }

  return data.key || data.token;
};

module.exports = {
  getDjangoAuthToken,
};
