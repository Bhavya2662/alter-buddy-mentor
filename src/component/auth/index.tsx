import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux";

const UserPrivateRoutes = () => {
     if (localStorage.getItem("USER_TOKEN")) {
          return <Outlet />;
     } else {
          return <Navigate to="/" replace />;
     }
     // return localStorage.getItem("USER_TOKEN") ? <Outlet /> : <Navigate to="/" replace />;
};

const MentorPrivateRoutes = () => {
     const mentorToken = localStorage.getItem("MENTOR_TOKEN");
     const mentorAuth = useSelector((state: RootState) => state.authentication.mentor);
     
     // Check both localStorage token and Redux authentication state
     if (mentorToken && (mentorAuth.authentication || mentorAuth.token)) {
          return <Outlet />;
     } else {
          // Clear any stale tokens if authentication state is inconsistent
          if (mentorToken && !mentorAuth.authentication && !mentorAuth.token) {
               localStorage.removeItem("MENTOR_TOKEN");
               sessionStorage.removeItem("ROLE");
          }
          return <Navigate to="/mentor/login" replace />;
     }
};

export { UserPrivateRoutes, MentorPrivateRoutes };
