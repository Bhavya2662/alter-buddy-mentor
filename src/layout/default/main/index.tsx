import React, { FC, ReactNode, useEffect, useState } from "react";

import { MainNavBar, MainFooter } from "../";
import clsx from "clsx";
import {
  handleError,
  handleMobileMenu,
  handleUserAuthentication,
  handleUserLogout,
  useAuthenticationSlice,
  useLayoutSlice,
} from "../../../redux/features";
import { useAppDispatch } from "../../../redux";
import {
  useGetAllCategoryQuery,
  useLazyGetNotificationsQuery,
  useLogoutUserMutation,
} from "../../../redux/rtk-api";
import { ICategoryProps } from "../../../interface";
import { getUserToken, removeUserToken } from "../../../utils";
import { AiOutlineLoading } from "react-icons/ai";
import Aos from "aos";
import { useNavigate } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  loading?: boolean;
}

export const MainLayout: FC<MainLayoutProps> = ({
  children,
  hideNav,
  loading,
}) => {
  const { mobileMenu, error } = useLayoutSlice();
  const [offerModel, setOfferModel] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { authentication } = useAuthenticationSlice();
  const localStore = getUserToken();
  const navigate = useNavigate();
  // Gate user-side effects by current route to prevent cross-role races
  const isMentorRoute = typeof window !== 'undefined' && window.location.pathname.includes('/mentor');

  // Token validation function
  const validateToken = async (token: string) => {
    try {
      // Make a simple API call to validate token against backend URL
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const {
    data: category,
    isError: isCategoryError,
    isLoading: isCategoryLoading,
    error: categoryError,
  } = useGetAllCategoryQuery();
  const [
    LogoutApi,
    {
      isError: isLogoutError,
      isLoading: isLogoutLoading,
      isSuccess: isLogoutSuccess,
      error: logoutError,
    },
  ] = useLogoutUserMutation();

  const [
    GetNotification,
    {
      isError: isNotificationError,
      error: notificationError,
      data: notificationData,
      isLoading: isNotificationLoading,
      // isSuccess: isNotificationSuccess,
    },
  ] = useLazyGetNotificationsQuery();

  useEffect(() => {
    // setTimeout(() => {
    //   setOfferModel(true);
    // }, 3000);
    if (isNotificationError) {
      console.log("Error", error);
      return;
    }

    // Only fetch notifications when on user routes
    if (!isMentorRoute && authentication) {
      (async () => {
        await GetNotification();
      })();
    }

    if (isCategoryError) {
      if ((categoryError as any)?.data) {
        dispatch(handleError((categoryError as any).data.message));
      }
    }
    if (isLogoutError) {
      if ((logoutError as any)?.data) {
        dispatch(handleError((logoutError as any).data.message));
      } else {
        console.log(logoutError);
      }
    }
    if (isNotificationError) {
      if ((notificationError as any)?.data) {
        dispatch(handleError((notificationError as any).data.message));
      }
    }

    // if (isNotificationSuccess) {
    //   console.log("NOTIFICATION", notificationData?.data);
    // }

    // After user logout, redirect only on user routes to avoid interfering with mentor flows
    if (!isMentorRoute && isLogoutSuccess) {
      dispatch(handleUserLogout());
      dispatch(handleError(null));
      removeUserToken();
      navigate("/", { replace: true });
    }

    // Validate and set user authentication only on user routes
    if (!isMentorRoute && localStore && !authentication) {
      // Validate token before dispatching authentication
      validateToken(localStore as string).then((isValid) => {
        if (isValid) {
          dispatch(
            handleUserAuthentication({
              token: localStore as string,
            })
          );
        } else {
          // Token is invalid, clear it
          removeUserToken();
          dispatch(handleUserLogout());
        }
      }).catch(() => {
        // Error validating token, clear it
        removeUserToken();
        dispatch(handleUserLogout());
      });
    }
    window.scrollTo(0, 0);
  }, [
    dispatch,
    localStore,
    isLogoutError,
    logoutError,
    isLogoutSuccess,
    isCategoryError,
    categoryError,
    navigate,
    isNotificationError,
    notificationError,
    // isNotificationSuccess,
    notificationData?.data,
    GetNotification,
    authentication,
    error,
    isMentorRoute,
  ]);

  const LogoutFunc = async () => {
    return LogoutApi();
  };

  useEffect(() => {
    Aos.init({});
    // if (getMentorToken()?.length) {
    //   navigate("/mentor/dashboard");
    // }
  }, [navigate]);

  return (
    <div className="relative z-10">
      {/* {!hideNav && (
        <MainNavBar
          category={category?.data as ICategoryProps[]}
          navLoading={isLogoutLoading}
          logout={LogoutFunc}
          authenticated={authentication}
          mobile={mobileMenu}
          handleMenu={() => dispatch(handleMobileMenu())}
        />
      )} */}
      {/* <div className="">
        <div className="z-50 bg-primary-500 shadow-primary-300 scrollTop p-3 mb-20 rounded-xl fixed text-white shadow-xl">
          <a href="#sectionOne" className="w-full h-full">
            <FiChevronUp size={30} />
          </a>
        </div>
      </div> */}
      <main
        data-aos="fade-in"
        className={clsx(!hideNav && "mt-20", "relative", "z-10")}
      >
        {loading && isCategoryLoading && isNotificationLoading ? (
          <div className="flex h-[300px] justify-center items-center w-full">
            <AiOutlineLoading
              size={150}
              className="animate-spin text-primary-500"
            />
          </div>
        ) : (
          children
        )}
      </main>
      {offerModel && (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                  <h3 className="text-3xl font-semibold">
                    This is demo model if you want to show
                  </h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setOfferModel(false)}
                  >
                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="relative p-6 flex-auto">
                  <p className="my-4 text-blueGray-500 text-lg leading-relaxed">
                    I always felt like I could do anything. That’s the main
                    thing people are controlled by! Thoughts- their perception
                    of themselves! They're slowed down by their perception of
                    themselves. If you're taught you can’t do anything, you
                    won’t do anything. I was taught I could do everything.
                  </p>
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                  <button
                    className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setOfferModel(false)}
                  >
                    Close
                  </button>
                  <button
                    className="bg-primary-500 text-white active:bg-primary-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setOfferModel(false)}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      )}

      {/* {!hideNav && <MainFooter />} */}
    </div>
  );
};
