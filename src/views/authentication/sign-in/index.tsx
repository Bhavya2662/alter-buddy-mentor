import React, { useCallback, useEffect } from "react";
import { SignInBody } from "../../../component";
import { useLoginUserMutation } from "../../../redux/rtk-api";
import { UserLoginProps } from "../../../interface";
import { toast } from "react-toastify";
import { handleUserAuthentication, useAuthenticationSlice } from "../../../redux/features";
import { getUserToken, setUserToken } from "../../../utils";
import { useAppDispatch } from "../../../redux";
import { useNavigate } from "react-router-dom";
import { socketService } from "../../../service/socket.service";

export const SignInPage = () => {
  const [
    LoginApi,
    {
      isError: isLoginError,
      error: loginError,
      isLoading: isLoginLoading,
      isSuccess: isLoginSuccess,
      data: loginData,
    },
  ] = useLoginUserMutation();
  const dispatch = useAppDispatch();
  const localStore = getUserToken();
  const navigate = useNavigate();
  const { authentication } = useAuthenticationSlice();

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (authentication || localStore) {
      navigate("/home", { replace: true });
    }
  }, [authentication, localStore, navigate]);

  useEffect(() => {
    if (isLoginError) {
      const error: any = loginError;
      if ((error as any)?.data) {
        toast.error(error.data.message);
      } else {
        console.log(error);
      }
    }
    if (isLoginSuccess) {
      setUserToken(loginData?.data.token as string);
      dispatch(
        handleUserAuthentication({
          token: loginData?.data.token as string,
        })
      );
      
      // Register user with socket for real-time status tracking
      if (loginData?.data.user?._id) {
        socketService.registerUser(loginData.data.user._id);
      }
      
      navigate("/home", { replace: true });
    }
  }, [
    isLoginError,
    loginError,
    dispatch,
    isLoginSuccess,
    localStore,
    loginData?.data.token,
    navigate,
  ]);
  const LoginFunc = useCallback(
    async ({ mobile, password }: UserLoginProps) => {
      await LoginApi({ mobile, password });
    },
    [LoginApi]
  );

  return (
    <div className="xl:lg:md:w-[60%] mx-auto">
      <SignInBody loginFunc={LoginFunc} loading={isLoginLoading} />
    </div>
  );
};
