import React, { useEffect } from 'react';
import { useAppDispatch } from '../../redux';
import { handleUserAuthentication, handleMentorAuthentication } from '../../redux/features';
import { getUserToken, getMentorToken, validateToken } from '../../utils';

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const currentPath = window.location.pathname;
      const isMentorRoute = currentPath.includes('/mentor');

      if (isMentorRoute) {
        // Validate mentor token only on mentor routes to avoid cross-role races
        const mentorToken = getMentorToken();
        if (mentorToken) {
          const isValidMentor = await validateToken(mentorToken, 'mentor');
          if (isValidMentor) {
            dispatch(handleMentorAuthentication({ token: mentorToken }));
          }
          // If token is invalid, validateToken will handle logout automatically
        }
      } else {
        // Validate user token only on non-mentor routes
        const userToken = getUserToken();
        if (userToken) {
          const isValidUser = await validateToken(userToken, 'user');
          if (isValidUser) {
            dispatch(handleUserAuthentication({ token: userToken }));
          }
          // If token is invalid, validateToken will handle logout automatically
        }
      }
    };

    initializeAuth();
  }, [dispatch]);

  return <>{children}</>; 
};

export default AuthInitializer;