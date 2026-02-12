import AddNewVendor from "./AddNewVendor";
import { useState, useRef, useEffect } from "react";
import AddSubscriptionFormModal from "./AddSubscriptionFormModal";
import { FiX, FiPlus, FiChevronLeft, FiChevronDown, FiSearch } from "react-icons/fi";

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
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddNewVendor, setShowAddNewVendor] = useState(false);
  const [showAddSubscriptionForm, setShowAddSubscriptionForm] = useState(false);

  const handleBack = () => {
    setSelectedVendor(null);
    setIsDropdownOpen(false);
    setSearchTerm("");
    onBack?.();
  };

  const handleClose = () => {
    setSelectedVendor(null);
    setIsDropdownOpen(false);
    setSearchTerm("");
    onClose?.();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Filter vendors based on search term
  const filteredVendors = (Array.isArray(vendors) && vendors.length > 0 ? vendors : []).filter(
    (v) => {
      if (!searchTerm.trim()) return true;
      const label =
        typeof v === "object" ? (v?.yiic_vendorname ?? v?.vendorName ?? v?.name ?? v?.id ?? v) : v;
      return String(label).toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const getVendorLabel = (vendor) => {
    if (!vendor) return "";
    return typeof vendor === "object"
      ? (vendor?.yiic_vendorname ?? vendor?.vendorName ?? vendor?.name ?? vendor?.id ?? vendor)
      : vendor;
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
      <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl w-full max-w-[660px] shadow-2xl overflow-visible">
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
            className="group p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="px-8 py-6 text-base space-y-5">
          <button
            onClick={handleAddVendorManually}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-lg font-semibold text-gray-800 border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
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

            {/* Custom Searchable Dropdown */}
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between border border-gray-200 rounded-2xl px-4 py-3 text-base bg-white hover:border-gray-300 focus:ring-2 focus:ring-[#1f2a7c]/40 focus:border-[#1f2a7c] outline-none transition-all"
              >
                <span className={selectedVendor ? "text-gray-800" : "text-gray-400"}>
                  {selectedVendor ? getVendorLabel(selectedVendor) : "Select Vendor"}
                </span>
                <FiChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search vendors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1f2a7c]/40 focus:border-[#1f2a7c] outline-none"
                      />
                    </div>
                  </div>

                  {/* Vendor List */}
                  <div className="max-h-60 overflow-y-auto">
                    {filteredVendors.length > 0 ? (
                      filteredVendors.map((v, i) => {
                        const value =
                          typeof v === "object"
                            ? (v?.activityid ?? v?.id ?? v?.vendorName ?? v?.name ?? v)
                            : v;
                        const label = getVendorLabel(v);
                        const isSelected =
                          selectedVendor &&
                          (selectedVendor?.activityid ?? selectedVendor?.id) ===
                            (v?.activityid ?? v?.id);

                        return (
                          <button
                            key={typeof v === "object" ? (v?.activityid ?? v?.id ?? i) : v}
                            type="button"
                            onClick={() => handleVendorSelect(v)}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                              isSelected
                                ? "bg-[#1f2a7c]/5 text-[#1f2a7c] font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        No vendors found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-4 px-8 py-4 border-t border-gray-100">
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
