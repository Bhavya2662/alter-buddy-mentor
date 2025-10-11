import { fetchBaseQuery, BaseQueryFn } from "@reduxjs/toolkit/query";
import { getMentorToken, getUserToken, removeUserToken, removeMentorToken } from "./local-store";
import { handleUserLogout, handleMentorLogout } from "../redux/features";
import { toast } from "react-toastify";
import { socketService } from "../service/socket.service";

// Auto logout handler for authentication errors
const handleAuthError = (status: number, requestUrl?: string) => {
  if (status === 401 || status === 403) {
    // Debug: log which request triggered auth error and current token presence
    if (process.env.NODE_ENV !== 'production') {
      const hasUser = !!getUserToken();
      const hasMentor = !!getMentorToken();
      console.warn('[AuthError]', { status, requestUrl, hasUser, hasMentor });
    }

    const userToken = getUserToken();
    const mentorToken = getMentorToken();
    const isMentorRequest = requestUrl?.includes('/mentor');
    const currentPath = window.location.pathname;
    const isMentorLoginPath = currentPath.startsWith('/mentor/login');
    const isUserLoginPath = currentPath.startsWith('/sign-in');
    
    if (isMentorRequest && mentorToken) {
      // Auto logout mentor only for mentor requests
      removeMentorToken();
      const store = (window as any).__REDUX_STORE__;
      if (store) {
        store.dispatch(handleMentorLogout());
      }
      
      // Disconnect from socket
      socketService.disconnect();
      
      toast.error("Session expired. Please login again.", {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Redirect to mentor login only if currently within mentor routes and not already on login page
      if (currentPath.includes('/mentor') && !isMentorLoginPath) {
        setTimeout(() => {
          window.location.href = "/mentor/login";
        }, 1500);
      }
    } else if (!isMentorRequest && userToken) {
      // Auto logout user only for user requests
      removeUserToken();
      const store = (window as any).__REDUX_STORE__;
      if (store) {
        store.dispatch(handleUserLogout());
      }
      
      // Disconnect from socket
      socketService.disconnect();
      
      toast.error("Session expired. Please login again.", {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Redirect to user login only if NOT currently within mentor routes and not already on sign-in page
      if (!currentPath.includes('/mentor') && !isUserLoginPath) {
        setTimeout(() => {
          window.location.href = "/sign-in";
        }, 1500);
      }
    }
  }
};

// Enhanced API base query with automatic logout on auth errors
export const ApiBaseQuery = (baseQuery?: (headers: Headers) => void): BaseQueryFn => {
  const baseQueryFn = fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BACKEND_URL,
    prepareHeaders: (headers, { getState }) => {
      // Mark as RTK Query request to avoid axios interceptor conflicts
      headers.set('RTK-Query', 'true');
      
      // Apply custom header preparation if provided
      if (baseQuery) {
        baseQuery(headers);
      }
      
      return headers;
    },
  });
  
  return async (args, api, extraOptions) => {
    const result = await baseQueryFn(args, api, extraOptions);
    
    // Handle authentication errors
    if (result.error && 'status' in result.error) {
      // Extract URL from args to pass to handleAuthError
      const requestUrl = typeof args === 'string' ? args : args.url;
      // Skip auth error handling for login endpoints to avoid redirect loops on failed login
      const isLoginEndpoint = requestUrl?.includes('/sign-in') || requestUrl?.includes('/login');
      if (!isLoginEndpoint) {
        handleAuthError(result.error.status as number, requestUrl);
      }
    }
    
    return result;
  };
};

// Token validation utility
export const validateToken = async (token: string, type: 'user' | 'mentor' = 'user'): Promise<boolean> => {
  try {
    const endpoint = type === 'user' ? '/user/profile' : '/mentor/profile';
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401 || response.status === 403) {
      handleAuthError(response.status, endpoint);
      return false;
    }
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const baseQueryUser = (headers: Headers) => {
  const token = getUserToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
};

export const baseQueryMentor = (headers: Headers) => {
  const token = getMentorToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
};

// Export handleAuthError for use in axios interceptor
export { handleAuthError };
