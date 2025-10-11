import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { getUserToken, getMentorToken } from './local-store';
import { handleAuthError } from './authentication.utils';

// Create axios instance with base configuration
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth tokens
  instance.interceptors.request.use(
    (config) => {
      // Try to get user token first, then mentor token
      const userToken = getUserToken();
      const mentorToken = getMentorToken();
      // Determine mentor requests strictly by request URL to avoid false positives
      const isMentorRequest = (config.url?.includes('/mentor') ?? false);
      
      // Prefer mentor token for mentor routes/requests; otherwise prefer user token
      if (isMentorRequest && mentorToken) {
        config.headers.Authorization = `Bearer ${mentorToken}`;
      } else if (!isMentorRequest && userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      } else if (mentorToken) {
        // Fallback: use mentor token if available
        config.headers.Authorization = `Bearer ${mentorToken}`;
      } else if (userToken) {
        // Fallback: use user token if available
        config.headers.Authorization = `Bearer ${userToken}`;
      }

      // Dev-only debug logging for auth header selection
      if (process.env.NODE_ENV !== 'production') {
        const selected = isMentorRequest
          ? (mentorToken ? 'mentor' : null)
          : (userToken ? 'user' : null);
        console.debug('[AxiosAuth][Request]', {
          url: config.url,
          isMentorRequest,
          hasUser: !!userToken,
          hasMentor: !!mentorToken,
          selected,
          authHeader: config.headers.Authorization,
        });
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle authentication errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      // Only handle auth errors for axios-specific requests, not RTK Query requests
      // RTK Query handles its own auth errors through ApiBaseQuery
      const isLoginEndpoint = error.config?.url?.includes('/sign-in') || 
                             error.config?.url?.includes('/login');
      const isRTKQueryRequest = error.config?.headers?.['RTK-Query'] === 'true';

      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AxiosAuth][ResponseError]', {
          status: error.response?.status,
          url: error.config?.url,
          isLoginEndpoint,
          isRTKQueryRequest,
          hasUser: !!getUserToken(),
          hasMentor: !!getMentorToken(),
        });
      }
      
      if ((error.response?.status === 401 || error.response?.status === 403) && 
          !isLoginEndpoint && !isRTKQueryRequest) {
         const currentPath = window.location.pathname;
         const alreadyOnMentorLogin = currentPath.startsWith('/mentor/login');
         const alreadyOnUserLogin = currentPath.startsWith('/sign-in');
         // Avoid triggering redirect when already on corresponding login pages to prevent abort loops
         handleAuthError(error.response.status, error.config?.url);
         // If we are already on login pages, do not attempt redirect; handleAuthError has guard now
       }
      
      return Promise.reject(error);
    }
  );

  return instance;
};



// Export the configured axios instance
export const apiClient = createAxiosInstance();

// Export default axios for backward compatibility
export default apiClient;