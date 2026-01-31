import { useState } from "react";
import { FiX, FiPlus, FiChevronLeft, FiChevronDown } from "react-icons/fi";
import AddNewVendor from "./AddNewVendor";
import AddSubscriptionFormModal from "./AddSubscriptionFormModal";

export default function AddVendorManually({
  open = false,
  onBack,
  onClose,
  onNextStage,
  onAddVendor,
  vendors = [],
  departments = [],
  onAddSuccess,
  onAddVendorManually,
}) {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showAddNewVendor, setShowAddNewVendor] = useState(false);
  const [showAddSubscriptionForm, setShowAddSubscriptionForm] = useState(false);

  const handleBack = () => {
    setSelectedVendor(null);
    onBack?.();
  };

  const handleClose = () => {
    setSelectedVendor(null);
    onClose?.();
  };

  const handleAddVendorManually = () => {
    if (onAddVendorManually) {
      onAddVendorManually();
    } else {
      setShowAddNewVendor(true);
    }
  };

  const handleAddNewVendorBack = () => setShowAddNewVendor(false);

  const handleAddNewVendorClose = () => {
    setShowAddNewVendor(false);
    handleClose();
  };

  const handleNextStage = () => {
    if (selectedVendor) {
      setShowAddSubscriptionForm(true);
    } else {
      onNextStage?.(selectedVendor) ?? handleClose();
    }
  };

  const handleAddSubscriptionFormClose = () => {
    setShowAddSubscriptionForm(false);
  };

  const handleAddSuccess = () => {
    setShowAddSubscriptionForm(false);
    setSelectedVendor(null);
    onAddSuccess?.();
  };

  if (!open) return null;

  if (showAddSubscriptionForm) {
    return (
      <AddSubscriptionFormModal
        open
        onClose={handleAddSubscriptionFormClose}
        onSuccess={handleAddSuccess}
        selectedVendor={selectedVendor}
        departments={departments}
      />
    );
  }

  if (showAddNewVendor) {
    return (
      <AddNewVendor
        open
        onBack={handleAddNewVendorBack}
        onClose={handleAddNewVendorClose}
        onAddVendor={(data) => {
          onAddVendor?.(data);
          setSelectedVendor(data);
          setShowAddNewVendor(false);
          setShowAddSubscriptionForm(true);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl w-full max-w-[520px] shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
          <button
            onClick={handleBack}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Back"
          >
            <FiChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 px-8 pt-5 pb-2">
            Add Subscription Manually
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="px-8 py-6 text-base space-y-6">
          <button
            onClick={handleAddVendorManually}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-5 text-lg font-semibold text-gray-800 border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <FiPlus className="w-6 h-6" strokeWidth={2.5} />
            Add Vendor Manually
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300" />
            <p className="text-gray-500 font-medium">or</p>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold text-gray-800">Select from available list</p>
            <div className="relative">
              <select
                value={selectedVendor?.activityid ?? selectedVendor?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  const vendor = vendors.find((v) => (v?.activityid ?? v?.id) === id) ?? null;
                  setSelectedVendor(vendor);
                }}
                className="w-full appearance-none border border-gray-200 rounded-2xl px-4 py-3 pr-10 text-base bg-white focus:ring-2 focus:ring-[#1f2a7c]/40 focus:border-[#1f2a7c] outline-none"
              >
                <option value="">Select Vendor</option>
                {(Array.isArray(vendors) && vendors.length > 0 ? vendors : []).map((v, i) => {
                  const value =
                    typeof v === "object"
                      ? (v?.activityid ?? v?.id ?? v?.vendorName ?? v?.name ?? v)
                      : v;
                  const label =
                    typeof v === "object"
                      ? (v?.yiic_vendorname ?? v?.vendorName ?? v?.name ?? v?.id ?? v)
                      : v;
                  return (
                    <option
                      key={typeof v === "object" ? (v?.activityid ?? v?.id ?? i) : v}
                      value={value}
                    >
                      {label}
                    </option>
                  );
                })}
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-4 px-8 py-5 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 border border-gray-200 rounded-2xl py-3 text-base font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleNextStage}
            disabled={!selectedVendor}
            className="flex-1 bg-gradient-to-r from-[#7c3aed] to-[#1d225d] text-white rounded-2xl py-3 text-base font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Stage
          </button>
        </div>
      </div>
    </div>
  );
}
