import React, { useEffect, useRef, useState } from "react";
import { MainLayout } from "../../../../layout";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "../../../../redux";
import {
  useBookMentorSlotMutation,
  useGetMentorPackagesByIdQuery,
  useGetMentorUsingIdQuery,
  useLazyGetSlotsByMentorIdQuery,
  useProfileUserQuery,
  useGetUserPackagesQuery,
  useGetMentorGroupSessionsQuery,
  useBookGroupSessionMutation,
} from "../../../../redux/rtk-api";
import { handleError } from "../../../../redux/features";
import { AppButton } from "../../../../component";
import {
  AiOutlineCalendar,
  AiOutlineLeft,
  AiOutlineLoading,
  AiOutlineMessage,
  AiOutlinePhone,
  AiOutlineVideoCamera,
} from "react-icons/ai";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

import moment from "moment";
import clsx from "clsx";
import { MdOutlineFormatQuote } from "react-icons/md";
import Helmet from "react-helmet";
import DOMPurify from "dompurify";
import { useGetMyWalletQuery, useRechargeWalletMutation } from "../../../../redux/rtk-api/buddy-coin.api";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { callType, ICategoryProps, ISessionPackage } from "../../../../interface";
import { toast } from "react-toastify";
import { Box, Input, Text } from "@chakra-ui/react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import BookingPanel from "./component/booking";
import LeftComponent from "./component/LeftComponent";
import RightComponent from "./component/RightComponent";
import { EmailService } from "../../../../services/email.service";

export const UserMentorDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // State declarations
  const [confirmModel, setConfirmModel] = useState<boolean>(false);
  const [scheduleModel, setScheduleModel] = useState<boolean>(false);
  const [packagePurchaseModal, setPackagePurchaseModal] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [sessionType, setSessionType] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [accept, setAccept] = useState<boolean>(false);
  const [showLinks, setShowLinks] = useState<boolean>(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [callType, setCallType] = useState<callType | "">("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectTime, setSelectTime] = useState<number>(5);
  const [selectTimeHour, setSelectTimeHour] = useState<number>(1);
  const [setSelectType, setSetSelectType] = useState<string>("");
  // Multi-slot booking states
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [multiSlotBookingModal, setMultiSlotBookingModal] = useState<boolean>(false);
  const [bookingStep, setBookingStep] = useState<'select' | 'confirm'>('select');
  // Recharge flow state
  const [rechargeModal, setRechargeModal] = useState<boolean>(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(0);
  const [requiredAmount, setRequiredAmount] = useState<number>(0);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);
  const [RechargeWallet, { isLoading: isRechargeLoading }] = useRechargeWalletMutation();
  // Prevent double auto-resume
  const hasAutoResumedRef = useRef(false);

  // API queries
  const { data: mentor } = useGetMentorUsingIdQuery(id || "");
  const { data: packages } = useGetMentorPackagesByIdQuery(id || "");
  const [getSlots, { data: slotData }] = useLazyGetSlotsByMentorIdQuery();
  const { data: profile } = useProfileUserQuery();
  const [bookSlot, { isLoading: bookingLoading }] = useBookMentorSlotMutation();
  const { data: wallet } = useGetMyWalletQuery();

  // Helper functions
  const toggleLinks = () => setShowLinks(!showLinks);
  const handlePrivacyAccept = () => setAccept(!accept);

  // Auto-resume booking after wallet recharge
  useEffect(() => {
    const shouldResume = localStorage.getItem('resume-booking') === 'true';
    const pending = localStorage.getItem('pending-booking');
    if (shouldResume && pending && !hasAutoResumedRef.current) {
      hasAutoResumedRef.current = true;
      let parsed: any = null;
      try {
        parsed = JSON.parse(pending);
      } catch (e) {
        parsed = null;
      }
      const bookingData = parsed?.bookingData || parsed;
      if (bookingData && bookingData.userId && bookingData.mentorId) {
        (async () => {
          try {
            const response = await bookSlot(bookingData).unwrap();
            // Handle meeting/join links from response
            let meetingLink: string | undefined;
            if (response?.data) {
              const { guestJoinURL, hostJoinURL, chatLink, joinLink } = response.data;
              meetingLink = guestJoinURL || chatLink || joinLink;
            }
            if (meetingLink) {
              toast.success(
                <div>
                  <p>Session booked successfully after recharge!</p>
                  <a href={meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>
                    Click here to join your session
                  </a>
                </div>,
                { autoClose: 10000 }
              );
            } else {
              toast.success('Session booked successfully after recharge! Meeting link will be sent via email.');
            }
          } catch (err: any) {
            console.error('Auto-resume booking failed:', err);
            toast.error(err?.data?.message || 'Failed to resume booking. Please try again.');
          } finally {
            // Clear resume flags to prevent loops
            localStorage.removeItem('resume-booking');
            localStorage.removeItem('pending-booking');
            localStorage.removeItem('payment-redirection');
          }
        })();
      } else {
        // Invalid data; clear flags
        localStorage.removeItem('resume-booking');
        localStorage.removeItem('pending-booking');
        localStorage.removeItem('payment-redirection');
      }
    }
  }, [bookSlot]);

  const BookSlot = async () => {
    if (!callType) {
      toast.error("Please select a call type");
      return;
    }

    // For chat sessions, only time is required
    if (callType === "chat") {
      if (!selectTime || selectTime <= 0) {
        toast.error("Please enter a valid preferred time");
        return;
      }
    } else if (callType === "audio") {
      // For audio sessions, either time or slot is required
      if (setSelectType === "time") {
        if (!selectTime || selectTime <= 0) {
          toast.error("Please enter a valid preferred time");
          return;
        }
      } else if (setSelectType === "slot") {
        if (!selectedTimeSlot) {
          toast.error("Please select a time slot");
          return;
        }
      } else {
        toast.error("Please choose either preferred time or select a time slot");
        return;
      }
    } else if (callType === "video") {
      // For video sessions, time slot is required
      if (!selectedTimeSlot) {
        toast.error("Please select a time slot");
        return;
      }
    }

    try {
      const timeNumber = Number(selectTime) || 5;
      // Create booking data based on session type
      let bookingData: any;
      if (callType === "chat" || (callType === "audio" && setSelectType === "time")) {
        // For chat sessions or audio with preferred time, slotId is not required
        bookingData = {
          userId: profile?.data?._id || "",
          mentorId: id || "",
          time: timeNumber,
          callType: callType as string,
          type: 'instant',
        };
      } else {
        // For video sessions or audio with slot selection, slotId is required
        bookingData = {
          userId: profile?.data?._id || "",
          mentorId: id || "",
          slotId: selectedTimeSlot._id,
          time: timeNumber,
          callType: callType as string,
          type: 'slot',
        };
      }

      // Wallet pre-check and recharge prompt
      const currentBalance = wallet?.data?.balance || 0;
      const priceToPay = selectedPrice || 0;
      if (currentBalance < priceToPay) {
        const diff = Math.max(0, priceToPay - currentBalance);
        setRequiredAmount(diff);
        setRechargeAmount(diff);
        setPendingBookingData(bookingData);
        localStorage.setItem('pending-booking', JSON.stringify({ bookingData }));
        localStorage.setItem('resume-booking', 'true');
        localStorage.setItem('payment-redirection', window.location.pathname + window.location.search);
        localStorage.setItem('wallet-recharge', 'true');
        setScheduleModel(false);
        setRechargeModal(true);
        toast.warn(`Insufficient BuddyCoins. You need ₹${priceToPay}, you have ₹${currentBalance}. Please recharge ₹${diff}.`);
        return;
      }

      const response = await bookSlot(bookingData).unwrap();
      
      // Handle meeting links from response
      let meetingLink: string | undefined;
      if (response?.data) {
        const { guestJoinURL, hostJoinURL, chatLink, joinLink } = response.data;
        meetingLink = guestJoinURL || chatLink || joinLink;
        
        if (meetingLink) {
          toast.success(
            <div>
              <p>Session booked successfully!</p>
              <a 
                href={meetingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#007bff', textDecoration: 'underline' }}
              >
                Click here to join your session
              </a>
            </div>,
            { autoClose: 10000 }
          );
        } else {
          toast.success("Session booked successfully! Meeting link will be sent via email.");
        }
      } else {
        toast.success("Session booked successfully!");
      }

      // Send confirmation email
      try {
        const mentorName = `${mentor?.data?.name?.firstName ?? ''} ${mentor?.data?.name?.lastName ?? ''}`.trim();
        const userName = `${profile?.data?.name?.firstName ?? ''} ${profile?.data?.name?.lastName ?? ''}`.trim();
        const dateStr = selectedTimeSlot?.date ? moment(selectedTimeSlot.date).format('DD/MM/YY') : moment().format('DD/MM/YY');
        const timeStr = selectedTimeSlot?.slot ? moment(selectedTimeSlot.slot, 'HH:mm').format('hh:mm A') : moment().format('hh:mm A');
        const durationStr = `${timeNumber} minutes`;
        await EmailService.sendSessionConfirmation(profile?.data?.email, {
          mentorName,
          userName,
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          joinUrl: meetingLink || '',
          sessionType: (callType as 'chat' | 'audio' | 'video' | 'group')
        });
      } catch (e) {
        console.error('Failed to send confirmation email:', e);
      }
      
      setScheduleModel(false);
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Booking failed. Please try again.");
    }
  };

  const timeOptions = [5, 10, 15, 20];

  const cleanHTML = DOMPurify.sanitize(mentor?.data?.description);

  const [selected, setSelected] = useState<Date | undefined>();
  const [selectedVideo, setSelectedVideo] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenVideo, setIsOpenVideo] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const maxDate = new Date(
    today.getFullYear(),
    today.getMonth() + 3,
    today.getDate()
  );

  const handleSelect = (date?: Date) => {
    setSelected(date);
    setIsOpen(false);
    if (date && id) {
      // Fetch slots for the selected mentor
      getSlots(id);
    }
  };
  const handleSelectVideo = (date?: Date) => {
    setSelectedVideo(date);
    setIsOpenVideo(false);
    if (date && id) {
      console.log("Selected date:", format(date, "yyyy-MM-dd"));
      // Fetch slots for the selected mentor
      getSlots(id);
    }
  };

  // Load slots when component mounts or mentor ID changes
  useEffect(() => {
    if (id) {
      console.log('Loading slots for mentor:', id);
      getSlots(id);
    }
  }, [id, getSlots]);

  // Close calendar if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutsideVideo(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpenVideo(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutsideVideo);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideVideo);
  }, []);

  // Additional state declarations
  const [duration, setDuration] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [preferredTime, setPreferredTime] = useState<number>(5);
  const [hasOpenedTab, setHasOpenedTab] = useState<boolean>(false);

  const filteredSlots = slotData?.data?.filter(
    (slot) => {
      // For video sessions, use selectedVideo date
      if (callType === "video" && selectedVideo) {
        return moment(slot.slotsDate).format("YYYY-MM-DD") === moment(selectedVideo).format("YYYY-MM-DD");
      }
      // For audio sessions with mentor's duration, use selectedDate
      if (callType === "audio" && selectedDuration && selectedDate) {
        return moment(slot.slotsDate).format("YYYY-MM-DD") === moment(selectedDate).format("YYYY-MM-DD");
      }
      // For other cases (legacy), use selected
      return moment(slot.slotsDate).format("YYYY-MM-DD") === moment(selected).format("YYYY-MM-DD");
    }
  );

  // Fetch user packages filtered by session type
  const { data: userPackagesData } = useGetUserPackagesQuery(
    {
      userId: profile?.data?._id || '',
      type: callType || undefined
    },
    {
      skip: !profile?.data?._id
    }
  );
  
  const userPackages = userPackagesData?.data || [];

  // Fetch group sessions for this specific mentor
  const { data: groupSessionsData } = useGetMentorGroupSessionsQuery(id || '');
  const allGroupSessions = groupSessionsData?.data || [];
  
  // Debug logging for group sessions
  console.log('Mentor Group Sessions Debug:', {
    mentorId: id,
    groupSessionsData,
    allGroupSessions,
    filteredSessions: allGroupSessions.length
  });
  
  // Filter group sessions to show valid sessions for this mentor
  const groupSessions = allGroupSessions.filter(session => {
    // Include sessions with valid categoryId
    if (!session.categoryId) {
      return false;
    }
    
    // Exclude test/demo sessions by title
    const title = session.title?.toLowerCase() || '';
    if (title.includes('test') || title.includes('demo')) {
      return false;
    }
    
    return true;
  });
  
  // Group session booking mutation
  const [bookGroupSession] = useBookGroupSessionMutation();

  // Handler functions
  const onPackageBook = (packageData: any) => {
    setSelectedPackage(packageData);
    setSelectedSlots([]);
    setBookingStep('select');
    setMultiSlotBookingModal(true);
  };

  // Multi-slot booking handlers
  const handleSlotSelection = (slot: any, date: string) => {
    const slotWithDate = { ...slot, date };
    const isSelected = selectedSlots.some(s => s._id === slot._id);
    
    if (isSelected) {
      setSelectedSlots(prev => prev.filter(s => s._id !== slot._id));
    } else {
      const maxSlots = selectedPackage?.totalSessions || selectedPackage?.totalSession || 1;
      if (selectedSlots.length < maxSlots) {
        setSelectedSlots(prev => [...prev, slotWithDate]);
      } else {
        toast.warning(`You can only select ${maxSlots} slots for this package`);
      }
    }
  };

  const bookMultipleSlots = async () => {
    if (selectedSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    try {
      const bookingPromises = selectedSlots.map(slot => {
        const bookingData = {
          userId: profile?.data?._id || '',
          mentorId: id || '',
          slotId: slot._id,
          callType: callType as string,
          type: 'slot',
          packageId: selectedPackage._id,
          date: slot.date,
          time: slot.time
        };
        return bookSlot(bookingData).unwrap();
      });

      await Promise.all(bookingPromises);
      toast.success(`Successfully booked ${selectedSlots.length} sessions using your package!`);
      setMultiSlotBookingModal(false);
      setSelectedSlots([]);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Multi-slot booking failed:', error);
      toast.error('Failed to book some slots. Please try again.');
    }
  };

  const onGroupBook = async (sessionData: any) => {
    try {
      if (!profile?.data?._id) {
        toast.error("Please log in to book a group session");
        return;
      }

      // Check if user has enough BuddyCoins
      const userWallet = wallet?.data;
      if (!userWallet || userWallet.balance < sessionData.price) {
        toast.error(`Insufficient BuddyCoins. You need ${sessionData.price} coins but have ${userWallet?.balance || 0}`);
        return;
      }

      // Check if session is not full
      if (sessionData.bookedUsers && sessionData.bookedUsers.length >= sessionData.capacity) {
        toast.error("This group session is already full");
        return;
      }

      // Check if user is already booked
      if (sessionData.bookedUsers && sessionData.bookedUsers.includes(profile.data._id)) {
        toast.error("You have already booked this group session");
        return;
      }

      const result = await bookGroupSession({
        sessionId: sessionData._id,
        userId: profile.data._id
      }).unwrap();

      toast.success(`Successfully booked "${sessionData.title}"! ${sessionData.price} BuddyCoins deducted.`);
      
      // Optionally refresh wallet data
      // refetchWallet();
      
    } catch (error: any) {
      console.error('Group session booking failed:', error);
      toast.error(error?.data?.message || 'Failed to book group session. Please try again.');
    }
  };

  return (
    <MainLayout>
      <Helmet>
        <title>{mentor?.data?.name?.firstName && mentor?.data?.name?.lastName 
          ? `Mentor Details - ${mentor.data.name.firstName} ${mentor.data.name.lastName}` 
          : 'Mentor Details'}</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Mentor Info */}
          <div className="lg:col-span-2">
            <LeftComponent 
              mentor={mentor?.data}
              packages={packages?.data}
            />
          </div>
          
          {/* Right Column - Booking Panel */}
          <div className="lg:col-span-1">
            <RightComponent 
              callType={callType}
              setCallType={setCallType}
              selectedPrice={selectedPrice}
              setSelectedPrice={setSelectedPrice}
              packages={packages}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectTime={selectTime}
              setSelectTime={setSelectTime}
              setScheduleModel={setScheduleModel}
              selectTimeHour={selectTimeHour}
              setSelectTimeHour={setSelectTimeHour}
              setSelectType={setSetSelectType}
              selected={selected}
              setSelected={setSelected}
              selectedVideo={selectedVideo}
              setSelectedVideo={setSelectedVideo}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isOpenVideo={isOpenVideo}
              setIsOpenVideo={setIsOpenVideo}
              calendarRef={calendarRef}
              filteredSlots={filteredSlots}
              onPackageBook={onPackageBook}
              userPackages={userPackages}
              groupSessions={groupSessions}
              onGroupBook={onGroupBook}
              handleSelect={handleSelect}
              handleSelectVideo={handleSelectVideo}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              duration={duration}
              setDuration={setDuration}
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              preferredTime={preferredTime}
              setPreferredTime={setPreferredTime}
              selectedTimeSlot={selectedTimeSlot}
              setSelectedTimeSlot={setSelectedTimeSlot}
            />
          </div>
        </div>
      </div>

      {/* Dialog components */}
      <Dialog
        open={scheduleModel}
        onClose={() => setScheduleModel(false)}
        className="fixed inset-0 z-50 overflow-y-scroll flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-[closed]:opacity-0"
      >
        <DialogPanel className="w-[40%] space-y-4 bg-white p-5 mt-20">
          <DialogTitle>
            Selected Time Slot -
            {selectedTimeSlot?.date && moment(selectedTimeSlot.date).format("DD-MM-YYYY")}{" "}
            {selectedTimeSlot?.slot && moment(selectedTimeSlot.slot, "HH:mm").format("hh:mm A")}
          </DialogTitle>
          <div className="my-5">
            <div className="flex gap-3 items-center">
              {callType === "chat" && <AiOutlineMessage size={30} className="fill-primary-500" />}
              {callType === "audio" && <AiOutlinePhone size={30} className="fill-primary-500" />}
              {callType === "video" && <AiOutlineVideoCamera size={30} className="fill-primary-500" />}
              <p className="text-gray-900 capitalize font-bold">
                {callType === "chat" ? "Chat" : callType === "audio" ? "Audio Call" : "Video Call"} with {mentor?.data?.name?.firstName}{" "}
                {mentor?.data?.name?.lastName.charAt(0)}.
              </p>
            </div>
            <p className="text-gray-500 my-2">
              Chat with the expert and get instant guidance
            </p>
            <div className="bg-gray-50 p-3 rounded-lg my-3">
              <p className="text-lg font-semibold text-[#D86570] mb-2">
                Session Price: ₹{selectedPrice || 0}
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex justify-between"><span>Wallet Balance</span><span>₹{wallet?.data?.balance || 0}</span></div>
                <div className="flex justify-between"><span>Amount Payable Now</span><span className="font-semibold">₹{Math.max(0, (selectedPrice || 0) - (wallet?.data?.balance || 0))}</span></div>
                <div className="flex justify-between"><span>Balance After Payment</span><span>₹{(wallet?.data?.balance || 0) - (selectedPrice || 0)}</span></div>
              </div>
              {(wallet?.data?.balance || 0) < (selectedPrice || 0) && (
                <div className="mt-3 p-2 border border-orange-300 bg-orange-50 rounded">
                  <p className="text-sm text-orange-700">
                    You are short of ₹{Math.max(0, (selectedPrice || 0) - (wallet?.data?.balance || 0))}. You can recharge this exact amount in the next step.
                  </p>
                </div>
              )}
            </div>
            {/* Auto-select category based on the main flow selection */}
            {category && (
              <div className="mb-3">
                <h6 className="font-semibold text-gray-700">Selected Category: <span className="text-[#D86570]">{category}</span></h6>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setScheduleModel(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={BookSlot}
                disabled={bookingLoading}
                className="flex-1 px-4 py-2 bg-[#D86570] text-white rounded-lg hover:bg-[#c55a65] transition-colors disabled:opacity-50"
              >
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </DialogPanel>
      </Dialog>

      <Dialog
        open={multiSlotBookingModal}
        onClose={() => setMultiSlotBookingModal(false)}
        className="fixed inset-0 z-50 overflow-y-scroll flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-[closed]:opacity-0"
      >
        <DialogPanel className="w-[50%] max-h-[80vh] overflow-y-auto space-y-4 bg-white p-5 mt-20">
          <DialogTitle>
            Book Multiple Sessions with Package
          </DialogTitle>
          {selectedPackage && (
            <div className="my-5">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg">
                  {selectedPackage.packageName || `${selectedPackage.type || selectedPackage.packageType} Package`}
                </h3>
                <p className="text-gray-600">
                  Total Sessions: {selectedPackage.totalSessions || selectedPackage.totalSession}
                </p>
                <p className="text-lg font-semibold text-[#D86570] mb-2">
                  Package Price: ₹{selectedPackage.price || selectedPackage.packagePrice || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Selected: {selectedSlots.length} / {selectedPackage.totalSessions || selectedPackage.totalSession}
                </p>
                <p className="text-right text-sm text-gray-600">
                  Wallet Balance After Purchase: ₹{(wallet?.data?.balance || 0) - (selectedPackage.price || selectedPackage.packagePrice || 0)}
                </p>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Select Time Slots:</h4>
                
                {slotData?.data?.map(({ slots, slotsDate }) => (
                  <div key={slotsDate} className="border border-gray-200 rounded-lg p-3">
                    <h5 className="font-medium mb-2">
                      {moment(slotsDate).format('MMM D, YYYY')}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {slots?.filter(slot => slot.callType === callType && !slot.booked).map((slot) => {
                        const isSelected = selectedSlots.some(s => s._id === slot._id);
                        return (
                          <button
                            key={slot._id}
                            onClick={() => handleSlotSelection(slot, slotsDate)}
                            className={clsx(
                              "px-3 py-2 border rounded-lg text-sm transition-colors",
                              isSelected
                                ? "bg-[#D86570] text-white border-[#D86570]"
                                : "border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            {moment(slot.time, 'HH:mm').format('hh:mm A')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {(!slotData?.data || slotData.data.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No available slots found.</p>
                    <p className="text-sm">Please check back later or contact the mentor.</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setMultiSlotBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={bookMultipleSlots}
                  disabled={selectedSlots.length === 0}
                  className="flex-1 px-4 py-2 bg-[#D86570] text-white rounded-lg hover:bg-[#c55a65] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Book {selectedSlots.length} Session{selectedSlots.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </DialogPanel>
      </Dialog>

      {/* Recharge Modal */}
      <Dialog
        open={rechargeModal}
        onClose={() => setRechargeModal(false)}
        className="fixed inset-0 z-50 overflow-y-scroll flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-[closed]:opacity-0"
      >
        <DialogPanel className="w-[40%] space-y-4 bg-white p-5 mt-20">
          <DialogTitle>
            Insufficient BuddyCoins
          </DialogTitle>
          <div className="my-2 text-sm text-gray-700 space-y-2">
            <div className="flex justify-between"><span>Session Price</span><span>₹{selectedPrice || 0}</span></div>
            <div className="flex justify-between"><span>Your Wallet Balance</span><span>₹{wallet?.data?.balance || 0}</span></div>
            <div className="flex justify-between font-semibold"><span>Recharge Needed</span><span>₹{requiredAmount}</span></div>
            <div className="mt-2">
              <button
                onClick={() => setRechargeAmount(requiredAmount)}
                className="px-3 py-1 bg-gray-100 border border-gray-300 rounded mr-2"
                title="Click to auto-fill"
              >
                Recharge ₹{requiredAmount}
              </button>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-bold text-gray-900">Enter amount</label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(parseInt(e.target.value || '0'))}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2"
                placeholder="Enter amount to recharge"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setRechargeModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!rechargeAmount || rechargeAmount <= 0) {
                  toast.warn('Please enter a valid recharge amount');
                  return;
                }
                try {
                  // Mark this as wallet recharge to ensure validation
                  localStorage.setItem('wallet-recharge', 'true');
                  localStorage.setItem('payment-redirection', window.location.pathname + window.location.search);
                  const res = await RechargeWallet(rechargeAmount).unwrap();
                  toast.success(res?.data?.message || 'Redirecting to payment...');
                  window.location.replace(res.data.razorPay.short_url);
                } catch (err: any) {
                  console.error('Recharge failed:', err);
                  toast.error(err?.data?.message || 'Recharge failed. Please try again.');
                }
              }}
              disabled={isRechargeLoading}
              className="flex-1 px-4 py-2 bg-[#D86570] text-white rounded-lg hover:bg-[#c55a65] transition-colors disabled:opacity-50"
            >
              {isRechargeLoading ? 'Redirecting...' : 'Recharge Now'}
            </button>
          </div>
        </DialogPanel>
      </Dialog>
    </MainLayout>
  );
};
