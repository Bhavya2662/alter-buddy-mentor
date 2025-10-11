import React, { useState } from "react";
import { useDeactivateMentorAccountMutation, useMentorSignOutMutation } from "../../../../redux/rtk-api";
import { toast } from "react-toastify";

interface DeactivateAccountProps {}

export const DeactivateAccount: React.FC<DeactivateAccountProps> = () => {
  const [reason, setReason] = useState<string>("Not using the platform anymore");
  const [otherReason, setOtherReason] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deactivateAccount] = useDeactivateMentorAccountMutation();
  const [signOut] = useMentorSignOutMutation();

  const reasons = [
    "Not using the platform anymore",
    "Found a better alternative",
    "Technical issues",
    "Privacy concerns",
    "Other",
  ];

  const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value);
  };

  const handleOtherReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOtherReason(e.target.value);
  };

  const handleSubmitReason = () => {
    if (reason === "Other" && !otherReason.trim()) {
      toast.error("Please provide a reason for deactivation");
      return;
    }
    setIsModalOpen(true);
  };

  const handleDeactivateAccount = async () => {
    try {
      // Call the API to deactivate the account
      const finalReason = reason === "Other" ? otherReason : reason;
      await deactivateAccount({ reason: finalReason });
      await signOut();
      toast.success("Your account has been deactivated");
      // Redirect to home page or login page
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to deactivate account. Please try again.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Deactivate Account</h2>
      <p className="mb-4 text-gray-700">
        We're sorry to see you go. Please let us know why you're deactivating your account:
      </p>

      <div className="mb-4">
        <label htmlFor="reason" className="block mb-2 font-medium">
          Reason for deactivation:
        </label>
        <select
          id="reason"
          className="w-full p-2 border rounded-md"
          value={reason}
          onChange={handleReasonChange}
        >
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {reason === "Other" && (
        <div className="mb-4">
          <label htmlFor="otherReason" className="block mb-2 font-medium">
            Please specify:
          </label>
          <textarea
            id="otherReason"
            className="w-full p-2 border rounded-md"
            rows={4}
            value={otherReason}
            onChange={handleOtherReasonChange}
            placeholder="Please tell us why you're leaving..."
          ></textarea>
        </div>
      )}

      <button
        onClick={handleSubmitReason}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Submit Reason
      </button>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Account Deactivation</h3>
            <p className="mb-6 text-gray-700">
              Are you sure you want to deactivate your account? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};