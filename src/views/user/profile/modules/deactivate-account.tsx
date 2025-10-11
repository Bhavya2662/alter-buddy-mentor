import { useToast } from "@chakra-ui/react";
import { useState } from "react";
import { useDeactivateUserAccountMutation, useLogoutUserMutation } from "../../../../redux/rtk-api";
import { useAppDispatch } from "../../../../redux";
import { handleError, handleUserLogout } from "../../../../redux/features";
import { removeUserToken } from "../../../../utils";
import { useNavigate } from "react-router-dom";


export const DeactivateAccount = () => {
    const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [deactivationType, setDeactivationType] = useState<"temporary" | "permanent">("temporary");
  const [reactivationDate, setReactivationDate] = useState("");

  const reasons = [
    "I have a privacy concern",
    "I receive too many emails",
    "I have another account",
    "I don't find it useful",
    "Taking a break from the platform",
    "Other",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === "Other" ? otherReason : selectedReason;
    console.log("Submitted reason:", finalReason);
    // Add API call or logic here
  };

  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    setShowModal(false);
    console.log("User logged out"); 
    // Add your logout logic here (e.g., API call, redirect)
  };

  const toast = useToast();

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
          deactivateAccount,
          {
              isError: isDeactivateError,
              isLoading: isDeactivateLoading,
              isSuccess: isDeactivateSuccess,
              error: deactivateError,
          },
      ] = useDeactivateUserAccountMutation();

       const dispatch = useAppDispatch();
       const navigate = useNavigate();

      if (isLogoutSuccess) {
                  dispatch(handleUserLogout());
                  dispatch(handleError(null));
                  removeUserToken();
                  navigate("/", { replace: true });
              }

  const LogoutFunc = async () => {
    try {
      // Call the API to deactivate the account
      const finalReason = selectedReason === "Other" ? otherReason : selectedReason;
      const deactivationData: any = {
        reason: finalReason,
        type: deactivationType
      };
      
      // Add reactivation date for temporary deactivation
      if (deactivationType === "temporary" && reactivationDate) {
        deactivationData.reactivationDate = reactivationDate;
      }
      
      await deactivateAccount(deactivationData);
      
      const message = deactivationType === "temporary" 
        ? 'Your account has been temporarily deactivated. You can reactivate it anytime by logging in.'
        : 'Your account has been permanently deactivated. You have 90 days to reactivate before deletion.';
      
      toast({
          title: 'Account Deactivated successfully.',
          description: message,
          status: 'success',
          duration: 4000,
          isClosable: true,
          position: 'top',
      });
      
      return LogoutApi();
    } catch (error) {
      toast({
          title: 'Error',
          description: 'Failed to deactivate account. Please try again.',
          status: 'error',
          duration: 2000,
          isClosable: true,
          position: 'top',
      });
    }
};

  return (
    <div className="space-y-3">
      <div className="bg-gray-100 flex px-4">
      <div className="p-8 w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Deactivate Account</h2>
        <p className="mb-6 text-lg text-gray-600">Please let us know why you're deactivating your account:</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Deactivation Type Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-800">Deactivation Type:</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <input
                  type="radio"
                  id="temporary"
                  name="deactivation-type"
                  value="temporary"
                  checked={deactivationType === "temporary"}
                  onChange={() => setDeactivationType("temporary")}
                  className="mr-3 h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="temporary" className="text-lg text-gray-700 font-medium">
                    Temporary Deactivation
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    You can reactivate your account anytime by simply logging in. Your data will be preserved.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <input
                  type="radio"
                  id="permanent"
                  name="deactivation-type"
                  value="permanent"
                  checked={deactivationType === "permanent"}
                  onChange={() => setDeactivationType("permanent")}
                  className="mr-3 h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="permanent" className="text-lg text-gray-700 font-medium">
                    Permanent Deactivation
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Your account will be scheduled for deletion after 90 days. You can still reactivate within this period.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Reactivation Date for Temporary */}
          {deactivationType === "temporary" && (
            <div className="space-y-2">
              <label htmlFor="reactivation-date" className="text-lg font-medium text-gray-800">
                Auto-reactivation Date (Optional):
              </label>
              <input
                type="date"
                id="reactivation-date"
                value={reactivationDate}
                onChange={(e) => setReactivationDate(e.target.value)}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Tomorrow
                className="w-full border border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <p className="text-sm text-gray-600">
                If set, your account will be automatically reactivated on this date.
              </p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-800">Reason for deactivation:</h3>
            {reasons.map((reason, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`reason-${index}`}
                  name="deactivation-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`reason-${index}`} className="text-lg text-gray-700">
                  {reason}
                </label>
              </div>
            ))}
          </div>

          {selectedReason === "Other" && (
            <textarea
              className="mt-2 w-full border border-gray-300 rounded-lg p-3 text-lg resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
              rows={4}
              placeholder="Please specify your reason..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              required
            />
          )}

          <button
            type="submit"
            onClick={() => {
              if (selectedReason && (selectedReason !== "Other" || otherReason.trim() !== "")) {
                setShowModal(true)
              } else {
                
              }
            }}
           
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Submit Reason
          </button>
        </form>
       
      </div>
    </div>
    {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirmation</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to {deactivationType === "temporary" ? "temporarily" : "permanently"} deactivate your account?
            </p>
            {deactivationType === "temporary" ? (
              <p className="text-sm text-blue-600 mb-6">
                You can reactivate anytime by logging in{reactivationDate ? ` or it will auto-reactivate on ${new Date(reactivationDate).toLocaleDateString()}` : ""}.
              </p>
            ) : (
              <p className="text-sm text-red-600 mb-6">
                Your account will be scheduled for deletion after 90 days, but you can still reactivate within this period.
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={LogoutFunc}
                disabled={isDeactivateLoading}
                className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeactivateLoading ? "Processing..." : `${deactivationType === "temporary" ? "Temporarily" : "Permanently"} Deactivate Account`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
