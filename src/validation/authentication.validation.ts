import * as yup from "yup";
import { IMentorAuthProps } from "../interface";

interface SignInProps {
  mobile: string;
  password: string;
}

interface SignUpProps {
  email: string;
  username: string;
  password: string;
  fname: string;
  lname: string;
  contact: string;
}

export const SignInInitialState: SignInProps = {
  mobile: "",
  password: "",
};

export const SignInValidationSchema = yup.object().shape({
  mobile: yup.string().required("email / mobile is required to sign in"),
  password: yup.string().required("password is required for sign in").min(8),
});

export const SignUpInitialState: SignUpProps = {
  email: "",
  password: "",
  fname: "",
  lname: "",
  username: "",
  contact: "",
};

export const SignUpValidationSchema = yup.object().shape({
  email: yup
    .string()
    .required("email is required to sign up")
    .email("email is not valid email"),
  password: yup
    .string()
    .required("password is required for sign up")
    .min(8, "password must be at least 8 characters")
    .max(40, "password must not exceed 40 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    ),
  c_password: yup
    .string()
    .required("confirm password is required")
    .oneOf([yup.ref('password')], 'passwords must match'),
  fname: yup.string().required("first name is required"),
  lname: yup.string().required("last name is required"),
  contact: yup
    .string()
    .required("contact number is required")
    .matches(/^[0-9]{10}$/, "contact number must be exactly 10 digits"),
});

export const MentorSignInProps: IMentorAuthProps = {
  password: "",
  username: "",
};

export const MentorSignInValidationSchema = yup.object().shape({
  username: yup.string().required("username is required for login"),
  password: yup
    .string()
    .required("password is required for login")
    .min(8, "password must be at least 8 characters"),
});
