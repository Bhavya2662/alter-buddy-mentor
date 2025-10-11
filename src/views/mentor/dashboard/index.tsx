import React, { useEffect, useState } from "react";
import { MentorLayout } from "../../../layout";
import {
  useLazyMentorProfileQuery,
  useMentorGetMyCallsQuery,
  useMentorGetMySchedulesQuery,
  useMentorProfileQuery,
  useUpdateSlotMutation,
  useMentorWalletHistoryQuery,
  useUpdateMentorProfileMutation,
  useGetMentorSessionPackagesQuery,
} from "../../../redux/rtk-api";
import moment from "moment";
import { AlterBuddyLogo } from "../../../assets/logo";
import { AiOutlineClose, AiOutlineLoading } from "react-icons/ai";
import { ISlotProps, UserProps } from "../../../interface";
import { AppButton, TextField } from "../../../component";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const MentorDashboardPage = () => {
  const navigate = useNavigate();
  const [noteModel, setNoteModel] = useState<ISlotProps | null>(null);
  const [noteField, setNoteField] = useState<string>("");

  const {
    data: calls,
    isError: isCallError,
    error: callError,
    isLoading: isCallLoading,
  } = useMentorGetMyCallsQuery();

  const [
    triggerGetMentorProfile,
    {
      data: profile,
      isError: isProfileError,
      error: profileError,
      isLoading: isProfileLoading,
    },
  ] = useLazyMentorProfileQuery();

  const {
    data: slots,
    isError: isSlotError,
    error: slotError,
    isLoading: isSlotLoading,
  } = useMentorGetMySchedulesQuery();

  const {
    data: walletData,
    isLoading: isWalletLoading,
    isError: isWalletError,
    error: walletError,
  } = useMentorWalletHistoryQuery();

  const {
    data: packageData,
    isLoading: isPackageLoading,
    isError: isPackageError,
    error: packageError,
  } = useGetMentorSessionPackagesQuery(profile?.data?._id);

  const [updateMentorProfile] = useUpdateMentorProfileMutation();

  const lengthFormatter = Intl.NumberFormat("en", { notation: "compact" });
  const formattedRevenue = Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(
    walletData?.data?.transactions?.reduce(
      (sum, tx) => sum + (tx.mentorShare || 0),
      0
    ) || 0
  );

  // Calculate package statistics
  const packageStats = React.useMemo(() => {
    if (!packageData?.data) return { totalPackages: 0, packageRevenue: 0, totalSessions: 0, usedSessions: 0 };
    
    const packages = packageData.data;
    const totalPackages = packages.length;
    const packageRevenue = packages.reduce((sum, pkg) => sum + (pkg.price * (pkg.totalSessions - pkg.remainingSessions)), 0);
    const totalSessions = packages.reduce((sum, pkg) => sum + pkg.totalSessions, 0);
    const usedSessions = packages.reduce((sum, pkg) => sum + (pkg.totalSessions - pkg.remainingSessions), 0);
    
    return { totalPackages, packageRevenue, totalSessions, usedSessions };
  }, [packageData]);

  useEffect(() => {
    if (isCallError) {
      console.log(callError);
      toast.error("Failed to load call history");
    }
    if (isSlotError) {
      console.log(slotError);
      toast.error("Failed to load schedules");
    }
    if (isProfileError) {
      console.log(profileError);
      toast.error("Failed to load profile");
    }
    if (isWalletError) {
      console.log(walletError);
      toast.error("Failed to load wallet data");
    }
    if (isPackageError) {
      console.log(packageError);
      toast.error("Failed to load package data");
    }
  }, [isSlotError, slotError, isCallError, callError, isProfileError, profileError, isWalletError, walletError, isPackageError, packageError]);

  // Profile is already fetched in login component, no need to fetch again

  const [
    updateSlot,
    {
      isLoading: isUpdateLoading,
      isSuccess: isUpdateSuccess,
      error: updateError,
      data: updateData,
      isError: isUpdateError,
    },
  ] = useUpdateSlotMutation();

  useEffect(() => {
    if (isUpdateSuccess) {
      toast.success(updateData?.data);
      setNoteModel(null);
      setNoteField("");
    }
  }, [isUpdateSuccess, updateData?.data]);

  useEffect(() => {
    if (noteModel?.note.length !== 0) {
      setNoteField(noteModel?.note);
    }
    if (isUpdateError) console.log(updateError);
  }, [isUpdateError, updateError, noteModel?.note]);

  const onUpdate = async () => {
    if (!noteField) return;
    updateSlot({
      slotId: noteModel._id,
      payload: { note: noteField },
    });
    setNoteField("");
    setNoteModel(null);
  };

  const handleToggleAvailability = async () => {
    try {
      await updateMentorProfile({
        id: profile?.data?._id,
        body: {
           isUnavailable: !profile?.data?.isUnavailable,
        },
      }).unwrap();
      toast.success("Availability status updated!");
      triggerGetMentorProfile();
    } catch (err) {
      console.error("Error updating availability:", err);
      toast.error("Failed to update availability");
    }
  };

  return (
    <MentorLayout>
      <AlterBuddyLogo />
      {isProfileLoading || isSlotLoading || isCallLoading || isUpdateLoading || isPackageLoading ? (
        <div className="flex justify-center">
          <AiOutlineLoading
            size={100}
            className="text-primary-500 animate-spin"
          />
        </div>
      ) : (
        <>
          <hr className="my-3" />
          <div className="flex justify-between items-center mb-4">
            <h5 className="capitalize text-3xl font-semibold">
              Welcome{" "}
              <span className="text-primary-500 capitalize">
                {profile?.data?.name?.firstName} {profile?.data?.name?.lastName}
              </span>
            </h5>

            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className="text-base font-medium">
                {!profile?.data?.isUnavailable ? "Available" : "Unavailable"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!profile?.data?.isUnavailable}
                  onChange={handleToggleAvailability}
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-colors duration-300"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow peer-checked:translate-x-full transition-transform duration-300"></div>
              </label>
            </div>
          </div>
          <hr className="my-3" />
          <div className="grid xl:lg:md:grid-cols-4 sm:xs:grid-cols-12 gap-10 mb-6">
            <div className="bg-white shadow rounded-lg p-4 cursor-pointer" onClick={() => navigate('/mentor/schedules')}>
              <h3 className="text-xl font-semibold">Uploaded Slots</h3>
              <p className="text-3xl my-3">
                {lengthFormatter.format(slots?.data?.length)}
              </p>
              <p className="text-gray-500">
                {slots?.data && slots.data.length > 0 ? (
                  `From ${moment(slots.data[0]?.slotsDate).format("ll")} - To ${moment(slots.data[slots.data.length - 1]?.slotsDate).format("ll")}`
                ) : (
                  "No slots available"
                )}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 cursor-pointer" onClick={() => navigate('/mentor/schedules')}>
              <h3 className="text-xl font-semibold">Confirmed Slots</h3>
              <p className="text-3xl my-3">
                {lengthFormatter.format(
                  slots?.data?.reduce(
                    (acc, cur) => acc + cur.slots.filter((slot) => slot.booked).length,
                    0
                  )
                )}
              </p>
              <p className="text-gray-500">
                {slots?.data && slots.data.length > 0 ? (
                  `From ${moment(slots.data[0]?.slotsDate).format("ll")} - To ${moment(slots.data[slots.data.length - 1]?.slotsDate).format("ll")}`
                ) : (
                  "No confirmed slots"
                )}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 cursor-pointer" onClick={() => navigate('/mentor/call-history')}>
              <h3 className="text-xl font-semibold">Call History</h3>
              <p className="text-3xl my-3">
                {lengthFormatter.format(calls?.data?.length)}
              </p>
              <p className="text-gray-500">
                {calls?.data && calls.data.length > 0 ? (
                  `First ${moment(calls.data[0]?.createdAt).format("ll")} - Last ${moment(calls.data[calls.data.length - 1]?.createdAt).format("ll")}`
                ) : (
                  "No call history"
                )}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 cursor-pointer" onClick={() => navigate('/mentor/payment-history')}>
              <h3 className="text-xl font-semibold">Total Revenue</h3>
              {isWalletLoading ? (
                <p className="text-gray-400 mt-4">Loading...</p>
              ) : (
                <>
                  <p className="text-3xl my-3">{formattedRevenue}</p>
                  <p className="text-gray-500">
                    Based on your confirmed sessions
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Session Packages Overview */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Session Packages Overview</h3>
              <button 
                onClick={() => navigate('/mentor/session-package')}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                View All →
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{packageStats.totalPackages}</p>
                <p className="text-sm text-gray-600">Total Packages</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">₹{packageStats.packageRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Package Revenue</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{packageStats.usedSessions}</p>
                <p className="text-sm text-gray-600">Sessions Completed</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {packageStats.totalSessions > 0 
                    ? Math.round((packageStats.usedSessions / packageStats.totalSessions) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </div>
          </div>
        </>
      )}
    </MentorLayout>
  );
};