import { RateLimiter } from 'limiter';

// Rate limiter for content script execution
const scriptLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute'
});

// Rate limiter for API calls
const apiLimiter = new RateLimiter({
  tokensPerInterval: 30,
  interval: 'minute'
});

// Token management
let authToken: string | null = null;
const TOKEN_STORAGE_KEY = 'baxus_api_token';

// Initialize token from storage
chrome.storage.local.get([TOKEN_STORAGE_KEY], (result) => {
  authToken = result[TOKEN_STORAGE_KEY] || null;
});

async function refreshToken(): Promise<string> {
  try {
    const response = await fetch('https://services.baxus.co/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    authToken = data.token;
    
    // Save new token
    await chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: authToken });
    
    if (!authToken) {
      throw new Error('Failed to refresh token: authToken is null');
    }
    return authToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHECK_RATE_LIMIT') {
    handleRateLimit(request.source).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'GET_AUTH_TOKEN') {
    getValidToken().then(sendResponse);
    return true;
  }
});

async function handleRateLimit(source: 'script' | 'api'): Promise<boolean> {
  const limiter = source === 'script' ? scriptLimiter : apiLimiter;
  return await limiter.tryRemoveTokens(1);
}

async function getValidToken(): Promise<string> {
  if (!authToken) {
    throw new Error('No authentication token available');
  }

  try {
    // Check if token needs refresh (you might want to check expiration)
    return await refreshToken();
  } catch (error) {
    console.error('Error getting valid token:', error);
    throw error;
  }
}

// Listen for installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize extension settings
    await chrome.storage.local.set({
      rateLimit: {
        scriptRequests: 10,
        apiRequests: 30,
        interval: 'minute'
      }
    });
  }
});

// Export types for TypeScript
export type MessageTypes = {
  CHECK_RATE_LIMIT: {
    type: 'CHECK_RATE_LIMIT';
    source: 'script' | 'api';
  };
  GET_AUTH_TOKEN: {
    type: 'GET_AUTH_TOKEN';
  };
}; 