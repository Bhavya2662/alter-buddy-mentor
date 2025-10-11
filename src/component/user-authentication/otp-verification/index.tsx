import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useVerifyEmailOTPMutation, useResendOTPMutation } from "../../../redux/rtk-api";

interface OTPVerificationProps {
  userId: string;
  email: string;
  onVerificationComplete: () => void;
}

const OTPValidationSchema = Yup.object().shape({
  emailOTP: Yup.string()
    .matches(/^\d{6}$/, "Email OTP must be 6 digits")
    .required("Email OTP is required"),
});

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  userId,
  email,
  onVerificationComplete,
}) => {
  const [verifyEmailOTP, { isLoading: isEmailVerifying }] = useVerifyEmailOTPMutation();
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();
  
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (emailVerified) {
      toast.success("Email verified successfully!");
      onVerificationComplete();
    }
  }, [emailVerified, onVerificationComplete]);

  const handleVerifyOTP = async (values: { emailOTP: string }) => {
    try {
      // Verify email OTP if not already verified
      if (!emailVerified && values.emailOTP) {
        const emailResult = await verifyEmailOTP({ userId, otp: values.emailOTP }).unwrap();
        if (emailResult.data.verified) {
          setEmailVerified(true);
          toast.success("Email verified successfully!");
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Verification failed");
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP({ userId, type: 'email' }).unwrap();
      toast.success('OTP resent to email successfully!');
      setResendTimer(60); // 60 second cooldown
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Account</h2>
        <p className="text-gray-600">
          We've sent a verification code to your email address.
        </p>
      </div>

      <Formik
        initialValues={{ emailOTP: "" }}
        validationSchema={OTPValidationSchema}
        onSubmit={handleVerifyOTP}
      >
        {({ values, isSubmitting }) => (
          <Form className="space-y-6">
            {/* Email OTP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email OTP
                {emailVerified && (
                  <span className="ml-2 text-green-600 text-xs">✓ Verified</span>
                )}
              </label>
              <div className="flex gap-2">
                <Field
                  name="emailOTP"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  disabled={emailVerified}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    emailVerified ? 'bg-green-50 border-green-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isResending || emailVerified}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `${resendTimer}s` : 'Resend'}
                </button>
              </div>
              <ErrorMessage name="emailOTP" component="div" className="text-red-500 text-sm mt-1" />
              <p className="text-xs text-gray-500 mt-1">Sent to: {email}</p>
            </div>



            <button
              type="submit"
              disabled={isSubmitting || isEmailVerifying || emailVerified}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting || isEmailVerifying
                ? "Verifying..."
                : emailVerified
                ? "Verification Complete"
                : "Verify Email OTP"}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code? Check your spam folder or click resend.
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};