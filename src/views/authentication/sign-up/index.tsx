import React, { useEffect, useState } from "react";
import { SignUpBody } from "../../../component";
import { OTPVerification } from "../../../component/user-authentication/otp-verification";
import { useRegisterUserMutation } from "../../../redux/rtk-api";
import { toast } from "react-toastify";
import { getUserToken, setUserToken } from "../../../utils";
import { useAppDispatch } from "../../../redux";
import { handleUserAuthentication } from "../../../redux/features";
import { UserRegisterProps } from "../../../interface";
import { useNavigate } from "react-router-dom";

export const SignUpPage = () => {
  const [
    RegisterApi,
    {
      isError: isRegisterError,
      error: registerError,
      isLoading: isRegisterLoading,
      isSuccess: isRegisterSuccess,
      data: registerData,
    },
  ] = useRegisterUserMutation();
  const localStore = getUserToken();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [userCredentials, setUserCredentials] = useState<{ email: string }>({ email: "" });

  useEffect(() => {
    if (isRegisterError) {
      if ((registerError as any)?.data) {
        toast.error(((registerError as any)?.data as any)?.message as any);
      } else {
        console.log(registerError);
      }
    }
    if (isRegisterSuccess && registerData) {
      toast.success(
        `${registerData?.data?.user?.name?.firstName} is registered with AlterBuddy. Please verify your email.`
      );
      setRegistrationData(registerData.data);
      setShowOTPVerification(true);
      // Don't navigate immediately - wait for OTP verification
    }
  }, [
    isRegisterError,
    registerError,
    isRegisterSuccess,
    registerData,
  ]);

  const handleVerificationComplete = () => {
    // Set token and navigate after successful verification
    if (registrationData?.token) {
      setUserToken(registrationData.token);
      if (localStore) {
        dispatch(
          handleUserAuthentication({
            token: registrationData.token,
          })
        );
      }
      toast.success("Account verified successfully! Welcome to AlterBuddy.");
      navigate("/", { replace: true });
    }
  };

  const RegisterFunc = async ({
    email,
    fname,
    lname,
    contact,
    password,
    c_password,
  }: UserRegisterProps) => {
    if (password !== c_password) {
      toast.warn("both passwords input should be matched");
    } else {
      // Store credentials for OTP verification
      setUserCredentials({ email });
      await RegisterApi({ email, fname, lname, contact, password });
    }
  };

  if (showOTPVerification && registrationData) {
    return (
      <div className="w-[80%] mx-auto h-screen flex justify-center items-center">
        <OTPVerification
          userId={registrationData.userId}
          email={userCredentials.email}
          onVerificationComplete={handleVerificationComplete}
        />
      </div>
    );
  }

  return (
    <div className="w-[80%] mx-auto h-screen flex justify-center items-center">
      <SignUpBody loading={isRegisterLoading} registerFunc={RegisterFunc} />
    </div>
  );
};
