import axios, { AxiosError, AxiosResponse } from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = 'https://cqyyqvabi8.execute-api.us-east-2.amazonaws.com/prod';

console.log('API configured with base URL:', API_BASE_URL);

// Define public routes that don't require authentication for GET requests
const publicRoutes = [
  { path: '/events', exact: false },
  { path: '/organizers', exact: true }, // Only exact match for /organizers, not /organizers/1
  { path: '/venues', exact: false }
];

// Define routes that should return the original response format
const preserveResponseRoutes = ['/auth/login', '/auth/signup'];

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Token refresh lock to prevent multiple token refreshes at the same time
let isRefreshing = false;
let tokenRefreshPromise: Promise<string> | null = null;

// Function to get a fresh token with lock mechanism
const getRefreshedToken = async (): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  // If already refreshing, return the existing promise
  if (isRefreshing && tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  // Set up new refresh operation
  isRefreshing = true;
  tokenRefreshPromise = (async () => {
    try {
      const token = await currentUser.getIdToken(true);
      localStorage.setItem('authToken', token);
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Fall back to stored token
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        throw new Error('Failed to get authentication token');
      }
      return storedToken;
    } finally {
      isRefreshing = false;
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
};

// Request interceptor for adding the auth token
api.interceptors.request.use(
  async (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Special handling for organizer-specific endpoints - these always need auth
    if (config.url && config.url.match(/^\/organizers\/\d+/)) {
      console.log('Organizer-specific endpoint detected, ensuring auth token is included');
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        try {
          const token = await getRefreshedToken();
          config.headers['Authorization'] = `Bearer ${token}`;
          return config;
        } catch (error) {
          console.error('Error getting token for organizer endpoint:', error);
          const storedToken = localStorage.getItem('authToken');
          if (storedToken) {
            console.log('Using stored token as fallback for organizer endpoint');
            config.headers['Authorization'] = `Bearer ${storedToken}`;
          } else {
            console.error('No authentication token available for organizer endpoint');
          }
          return config;
        }
      } else {
        // No current user, try to use stored token
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          console.log('Using stored token for organizer endpoint (no current user)');
          config.headers['Authorization'] = `Bearer ${storedToken}`;
        } else {
          console.error('No authentication token available for organizer endpoint');
        }
        return config;
      }
    }
    
    // Check if the current request URL is for a public route AND it's a GET request
    const isPublicGetRequest = 
      publicRoutes.some(route => {
        // Check if the URL starts with the route path
        const urlStartsWithPath = config.url?.startsWith(route.path);
        
        // For exact matches, the URL should be exactly the path or path/
        const isExactMatch = route.exact 
          ? (config.url === route.path || config.url === `${route.path}/`) 
          : true;
        
        return urlStartsWithPath && isExactMatch;
      }) && 
      config.method?.toLowerCase() === 'get';
    
    // Skip adding authorization for public GET requests only
    if (isPublicGetRequest) {
      console.log('Accessing public route with GET, skipping authorization token');
      return config;
    }
    
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      try {
        // Get a fresh token using our shared refresh function
        const token = await getRefreshedToken();
        console.log('Using Firebase auth token for request:', config.url);
        
        // Add token to headers
        config.headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting token:', error);
        // Fall back to stored token as last resort
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          console.log('Using stored token as fallback');
          config.headers['Authorization'] = `Bearer ${storedToken}`;
        }
      }
    } else {
      // If no current user, try to use stored token
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('Using stored token (no current user)');
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.log('No authentication token available');
      }
    }
    
    return config;
  },
  (error) => {
    console.error('API Request error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and parse data
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log the raw response
    console.log('API Response raw:', response);
    
    // For auth routes, preserve the original response format
    if (response.config?.url && preserveResponseRoutes.some(route => response.config.url?.includes(route))) {
      console.log('Preserving original response format for auth route');
      return response;
    }
    
    // For other routes, handle the response format as before
    // Check if the response has our API wrapper structure with data and message
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'message' in response.data) {
      console.log('Standard API response structure detected, extracting data');
      // Return just the data part of our standard response
      return response.data.data;
    }
    
    // Some endpoints return data directly without the wrapper
    // Return the original response data without transformations
    return response.data;
  },
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      
      // Only handle unauthorized errors for non-public routes
      if (error.response.status === 401 || error.response.status === 403) {
        // Check if this was a public route GET request
        const config = error.config;
        if (config && config.url) {
          const isPublicGetRequest = 
            publicRoutes.some(route => {
              // Check if the URL starts with the route path
              const urlStartsWithPath = config.url?.startsWith(route.path);
              
              // For exact matches, the URL should be exactly the path or path/
              const isExactMatch = route.exact 
                ? (config.url === route.path || config.url === `${route.path}/`) 
                : true;
              
              return urlStartsWithPath && isExactMatch;
            }) && 
            config.method?.toLowerCase() === 'get';
          
          // Skip redirects for public routes
          if (isPublicGetRequest) {
            console.log(`Received ${error.response.status} on public route, not redirecting to login`);
          } else {
            // Unauthorized on protected route - clear local storage and redirect to login
            console.log(`Unauthorized access (${error.response.status}) on protected route - redirecting to login`);
            localStorage.removeItem('authToken');
            
            // Get current path to redirect back after login
            const currentPath = window.location.pathname;
            if (currentPath !== '/login') {
              window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
            } else {
              window.location.href = '/login';
            }
          }
        }
      }
      
      // Extract error message from response if possible
      if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        const errorMessage = error.response.data.message;
        if (typeof errorMessage === 'string') {
          error.message = errorMessage;
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received', error.message);
    } else {
      // Something happened in setting up the request
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;