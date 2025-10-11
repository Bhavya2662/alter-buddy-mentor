import React, { useMemo, useState, useEffect } from "react";
import { FiMessageSquare, FiPhone, FiVideo, FiDownload, FiClock, FiExternalLink, FiMail } from "react-icons/fi";
import moment from "moment";
import clsx from "clsx";
import ConfirmationEmail from "../../../../components/email/ConfirmationEmail";
import { useUserGetMyCallsQuery } from "../../../../redux/rtk-api"; // adjust path as needed
import { apiClient } from "../../../../utils/axios.utils";

interface Call {
  id: number;
  name: string;
  callType: "chat" | "audio" | "video";
  startTime: string;
  endTime: string;
  duration: string;
  status: "Completed" | "Ongoing" | "Upcoming";
  roomId?: string;
  callId?: string;
  mentorId?: string;
  recordingUrl?: string;
  recordingStatus?: string;
  sessionDurationMinutes?: number;
  actualStartTime?: string;
  timerStarted?: boolean;
  mentorJoined?: boolean;
  userJoined?: boolean;
  joinUrl?: string;
}

// Timer component for ongoing sessions
const SessionTimer: React.FC<{ 
  startTime: string; 
  actualStartTime?: string;
  timerStarted?: boolean;
  durationMinutes: number; 
  onExpired?: () => void 
}> = ({ 
  startTime, 
  actualStartTime,
  timerStarted,
  durationMinutes, 
  onExpired 
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [fiveMinuteWarningShown, setFiveMinuteWarningShown] = useState(false);
  const [twoMinuteWarningShown, setTwoMinuteWarningShown] = useState(false);
  const [percentageLeft, setPercentageLeft] = useState(100);

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      // If timer hasn't started yet, show waiting message
      if (!timerStarted || !actualStartTime) {
        setTimeLeft("Waiting...");
        return;
      }

      const now = new Date().getTime();
      const sessionStart = new Date(actualStartTime).getTime();
      const sessionEnd = sessionStart + (durationMinutes * 60 * 1000);
      const remaining = sessionEnd - now;
      const totalDuration = durationMinutes * 60 * 1000;
      const elapsed = totalDuration - remaining;
      const percentComplete = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
      
      setPercentageLeft(100 - percentComplete);

      if (remaining <= 0) {
        setTimeLeft("00:00");
        setIsExpired(true);
        onExpired?.();
        
        // Show session ended notification
        showNotification(
          'Session Ended', 
          'Your session has ended. Thank you for using Alterbuddy!',
          'error'
        );
        return;
      }

      const minutes = Math.floor(remaining / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      
      // Show 5-minute warning notification
      if (remaining <= 5 * 60 * 1000 && !fiveMinuteWarningShown) {
        setFiveMinuteWarningShown(true);
        showNotification(
          'Session Ending Soon', 
          'Your session will end in 5 minutes. Please wrap up your conversation.',
          'warning'
        );
      }
      
      // Show 2-minute warning notification
      if (remaining <= 2 * 60 * 1000 && !twoMinuteWarningShown) {
        setTwoMinuteWarningShown(true);
        showNotification(
          'Session Almost Over', 
          'Your session will end in 2 minutes. Please finish your conversation.',
          'warning'
        );
      }
    };
    
    // Helper function to show notifications
    const showNotification = (title: string, body: string, type: 'info' | 'warning' | 'error') => {
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/favicon.ico'
        });
      }
      
      // Also show an alert as fallback with emoji based on type
      const emoji = type === 'warning' ? '⏰' : type === 'error' ? '🛑' : 'ℹ️';
      alert(`${emoji} ${title}: ${body}`);
      
      // Play sound based on type
      const audio = new Audio();
      audio.src = type === 'warning' ? '/notification.mp3' : 
                 type === 'error' ? '/session-end.mp3' : 
                 '/notification.mp3';
      audio.play().catch(e => console.log('Audio play failed:', e));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, actualStartTime, timerStarted, durationMinutes, onExpired, fiveMinuteWarningShown, twoMinuteWarningShown]);

  return (
    <div className="flex flex-col w-full">
      <div className={clsx(
        "flex items-center gap-1 px-2 py-1 rounded text-sm font-medium",
        isExpired ? "bg-red-100 text-red-600" : 
        percentageLeft <= 10 ? "bg-orange-100 text-orange-600" :
        "bg-green-100 text-green-600"
      )}>
        <FiClock size={14} />
        <span>{timeLeft}</span>
      </div>
      {timerStarted && !isExpired && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
          <div 
            className={clsx(
              "h-1.5 rounded-full",
              percentageLeft <= 10 ? "bg-red-500" :
              percentageLeft <= 25 ? "bg-orange-500" :
              "bg-green-500"
            )}
            style={{ width: `${100 - percentageLeft}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

const ITEMS_PER_PAGE = 10;

const CallHistoryTable: React.FC = () => {
  const { data, isLoading, isError } = useUserGetMyCallsQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingRecording, setDownloadingRecording] = useState<string | null>(null);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const handleDownloadRecording = async (callId: string) => {
    try {
      setDownloadingRecording(callId);
      const response = await apiClient.get(
        `/api/v1/call/recording/${callId}`
      );

      if (response.data.success && response.data.data.recordingUrl) {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = response.data.data.recordingUrl;
        
        // Set download attribute with a filename based on date and call type
        const call = calls.find(c => c.callId === callId);
        const date = call ? new Date(call.endTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const callType = call?.callType || 'session';
        const mentorName = call?.name.replace(/\s+/g, '-').toLowerCase() || 'mentor';
        
        link.download = `alterbuddy-${callType}-${mentorName}-${date}.mp4`;
        link.target = '_blank';
        
        // Append to body, click and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Also open in new tab as fallback if download doesn't start
        window.open(response.data.data.recordingUrl, '_blank');
      } else if (response.data.data.recordingStatus === 'processing') {
        alert('Recording is still being processed. Please try again in a few minutes.');
      } else {
        alert('Recording not available yet. Please try again later.');
      }
    } catch (error) {
      console.error('Error downloading recording:', error);
      alert('Failed to download recording. Please try again.');
    } finally {
      setDownloadingRecording(null);
    }
  };

  const calls: Call[] = useMemo(() => {
    if (!data?.data) return [];

    return data.data.map((item, idx) => {
      const now = new Date();
      const start = new Date(item.sessionDetails?.startTime || item.createdAt);
      const end = new Date(item.sessionDetails?.endTime || item.updatedAt);
      
      // Extract duration in minutes from duration string (e.g., "30 mins" -> 30)
      const durationStr = item.sessionDetails?.duration || "0";
      const durationMinutes = parseInt(durationStr.toString().replace(/[^0-9]/g, '')) || 0;
      
      // Calculate session end time based on start time + duration
      const calculatedEndTime = new Date(start.getTime() + (durationMinutes * 60 * 1000));
      
      // Determine status based on current time vs session times
      let status: "Completed" | "Ongoing" | "Upcoming";
      if (now < start) {
        status = "Upcoming";
      } else if (now >= start && now <= calculatedEndTime) {
        status = "Ongoing";
      } else {
        status = "Completed";
      }

      const callType = item.sessionDetails?.callType;
      const validCallType = callType === "chat" || callType === "audio" || callType === "video" ? callType : "chat";
      
      // Generate join URL based on call type
      let joinUrl = '';
      if (validCallType === "chat" && item.sessionDetails?.roomId) {
        joinUrl = `/user/chat/${item.users?.mentor?._id}/${item.sessionDetails.roomId}`;
      } else if ((validCallType === "audio" || validCallType === "video") && item.sessionDetails?.roomId) {
        joinUrl = `https://alter-videoconf-1123.app.100ms.live/meeting/${item.sessionDetails.roomId}`;
      }

      // Check if this is a package session
      const isPackageSession = item.packageId;
      const mentorName = `${item.users?.mentor?.name?.firstName ?? ""} ${item.users?.mentor?.name?.lastName ?? ""}`;
      const displayName = isPackageSession ? `${mentorName} (under package)` : mentorName;

      return {
        id: idx + 1,
        name: displayName,
        callType: validCallType,
        startTime: item.sessionDetails?.startTime || item.createdAt,
        endTime: item.sessionDetails?.endTime || item.updatedAt,
        duration: item.sessionDetails?.duration ?? "N/A",
        status,
        roomId: item.sessionDetails?.roomId,
        callId: item._id,
        mentorId: item.users?.mentor?._id,
        recordingUrl: item.sessionDetails?.recordingUrl,
        recordingStatus: item.sessionDetails?.recordingStatus,
        sessionDurationMinutes: durationMinutes,
        actualStartTime: item.sessionDetails?.actualStartTime,
        timerStarted: item.sessionDetails?.timerStarted,
        mentorJoined: item.sessionDetails?.mentorJoined,
        userJoined: item.sessionDetails?.userJoined,
        joinUrl,
      };
    });
  }, [data]);

  const totalPages = Math.ceil(calls.length / ITEMS_PER_PAGE);
  const paginatedData = calls.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderIcon = (type: string) => {
    if (type === "chat") return <FiMessageSquare size={18} />;
    if (type === "audio") return <FiPhone size={18} />;
    if (type === "video") return <FiVideo size={18} />;
    return null;
  };

  if (isLoading) return <p className="p-4 text-center">Loading...</p>;
  if (isError)
    return <p className="p-4 text-center text-red-500">Failed to fetch data.</p>;
  if (!isLoading && calls.length === 0)
    return <p className="p-4 text-center text-gray-500">No call history found.</p>;

  return (
    <div className="bg-pink-50 rounded-xl p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-pink-200 text-left text-sm font-semibold text-gray-700">
              <th className="px-4 py-2">SR</th>
              <th className="px-4 py-2">MENTOR NAME</th>
              <th className="px-4 py-2">CALL TYPE</th>
              <th className="px-4 py-2">START TIME</th>
              <th className="px-4 py-2">END TIME</th>
              <th className="px-4 py-2">DURATION</th>
              <th className="px-4 py-2">STATUS</th>
              <th className="px-4 py-2">TIMER</th>
              <th className="px-4 py-2">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((call, idx) => (
              <tr key={call.id} className="text-sm hover:bg-gray-50 border-t">
                <td className="px-4 py-2">
                  {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                </td>
                <td className="px-4 py-2 capitalize">{call.name}</td>
                <td className="px-4 py-2 flex items-center gap-2 capitalize">
                  {renderIcon(call.callType)} {call.callType}
                </td>
                <td className="px-4 py-2">
                  {moment(call.startTime).format("ll LT")}
                </td>
                <td className="px-4 py-2">
                  {moment(call.endTime).format("ll LT")}
                </td>
                <td className="px-4 py-2">{call.duration}</td>
                <td className="px-4 py-2 font-medium capitalize">
                  <span className={clsx(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    call.status === "Ongoing" && "bg-green-100 text-green-800",
                    call.status === "Completed" && "bg-gray-100 text-gray-800",
                    call.status === "Upcoming" && "bg-blue-100 text-blue-800"
                  )}>
                    {call.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {call.status === "Ongoing" && call.sessionDurationMinutes ? (
                    <SessionTimer 
                      startTime={call.startTime}
                      actualStartTime={call.actualStartTime}
                      timerStarted={call.timerStarted}
                      durationMinutes={call.sessionDurationMinutes}
                    />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {call.status === "Ongoing" ? (
                    <div className="flex flex-col gap-1">
                      {call.joinUrl ? (
                        <a
                          href={call.joinUrl}
                          target={call.callType !== "chat" ? "_blank" : "_self"}
                          rel={call.callType !== "chat" ? "noopener noreferrer" : ""}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600 text-center flex items-center justify-center gap-1"
                        >
                          <FiExternalLink size={14} />
                          Join {call.callType === "chat" ? "Chat" : call.callType === "video" ? "Video" : "Audio"}
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                      {call.mentorJoined && !call.userJoined && (
                        <div className="text-xs text-orange-500 mt-1 font-medium">Mentor is waiting for you!</div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedSession({
                            id: call.id,
                            startTime: call.startTime,
                            endTime: call.endTime,
                            mentorName: call.name,
                            callType: call.callType,
                            joinUrl: call.joinUrl
                          });
                          setEmailModalVisible(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-600 text-center flex items-center justify-center gap-1 mt-1"
                        title="Send Confirmation Email"
                      >
                        <FiMail size={14} />
                        Email Confirmation
                      </button>
                    </div>
                  ) : call.status === "Completed" && 
                           (call.callType === "audio" || call.callType === "video") && 
                           call.callId ? (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleDownloadRecording(call.callId!)}
                        disabled={downloadingRecording === call.callId || call.recordingStatus === "processing"}
                        className={clsx(
                          "flex items-center justify-center gap-1 px-3 py-1 rounded text-sm font-medium w-full",
                          downloadingRecording === call.callId
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : call.recordingStatus === "processing"
                            ? "bg-orange-100 text-orange-600 cursor-wait"
                            : call.recordingUrl
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        )}
                        title={call.recordingStatus === "processing" ? "Recording is being processed" : 
                              call.recordingUrl ? "Download recording" : "Recording not available yet"}
                      >
                        <FiDownload size={14} />
                        {downloadingRecording === call.callId ? "Downloading..." : 
                         call.recordingStatus === "processing" ? "Processing..." : 
                         call.recordingUrl ? "Download Recording" : "Recording Unavailable"}
                      </button>
                      {call.recordingStatus === "processing" && (
                        <div className="text-xs text-orange-500 mt-1 font-medium">Processing recording...</div>
                      )}
                      {!call.recordingUrl && call.recordingStatus !== "processing" && (
                        <div className="text-xs text-gray-500 mt-1">Recording not available</div>
                      )}
                    </div>
                  ) : call.status === "Upcoming" ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-blue-600 font-medium">Scheduled</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {moment(call.startTime).format("MMM D, h:mm A")}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSession({
                            id: call.id,
                            startTime: call.startTime,
                            endTime: call.endTime,
                            mentorName: call.name,
                            callType: call.callType,
                            joinUrl: call.joinUrl
                          });
                          setEmailModalVisible(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-600 text-center flex items-center justify-center gap-1 mt-1"
                        title="Send Confirmation Email"
                      >
                        <FiMail size={14} />
                        Email Confirmation
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className={clsx(
            "px-4 py-1 rounded",
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary-500 text-white hover:bg-primary-600"
          )}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={clsx(
            "px-4 py-1 rounded",
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary-500 text-white hover:bg-primary-600"
          )}
        >
          Next
        </button>
      </div>
      
      {/* Confirmation Email Modal */}
      {selectedSession && (
        <ConfirmationEmail
          visible={emailModalVisible}
          onClose={() => setEmailModalVisible(false)}
          sessionDetails={selectedSession}
          recipientEmail="" // This can be populated from user profile if available
        />
      )}
    </div>
  );
};

export default CallHistoryTable;
