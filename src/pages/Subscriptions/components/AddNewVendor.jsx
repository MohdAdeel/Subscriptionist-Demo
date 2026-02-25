import { useState } from "react";
import { FiX, FiChevronLeft } from "react-icons/fi";
import { usePopup } from "../../../components/Popup";
import {
  useCreateVendorRecordMutation,
  checkVendorExistance,
} from "../../../hooks/useSubscriptions";
import { useAuthStore } from "../../../stores";

export default function AddNewVendor({ open = false, onBack, onClose, onAddVendor }) {
  const userAuth = useAuthStore((state) => state.userAuth);
  const accountId = userAuth?.accountid;
  const createVendorMutation = useCreateVendorRecordMutation();
  const [formData, setFormData] = useState({
    vendorName: "",
    accountManagerEmail: "",
    accountManagerName: "",
    accountManagerPhone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = usePopup();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleBack = () => {
    setFormData({
      vendorName: "",
      accountManagerEmail: "",
      accountManagerName: "",
      accountManagerPhone: "",
    });
    onBack?.();
  };

  const handleClose = () => {
    setFormData({
      vendorName: "",
      accountManagerEmail: "",
      accountManagerName: "",
      accountManagerPhone: "",
    });
    onClose?.();
  };

  const handleCancel = () => handleBack();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorName.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await checkVendorExistance(accountId, formData.vendorName.trim());
      const list = result?.value ?? (Array.isArray(result) ? result : []);
      const exists = Array.isArray(list) && list.length > 0;
      if (exists) {
        showWarning("A vendor with this name already exists.", "Vendor Exists");
        return;
      }
      const payload = {
        yiic_vendorname: formData.vendorName?.trim() ?? "",
        yiic_accountmanagername: formData.accountManagerName ?? "",
        yiic_accountmanageremail: formData.accountManagerEmail ?? "",
        yiic_accountmanagerphone: formData.accountManagerPhone ?? "",
        "yiic_Account_yiic_subscriptionsactivity@odata.bind": `/accounts(${accountId})`,
      };
      const vendorResponse = await createVendorMutation.mutateAsync(payload);
      showSuccess("Vendor added successfully.");
      onAddVendor?.(vendorResponse);
      setFormData({
        vendorName: "",
        accountManagerEmail: "",
        accountManagerName: "",
        accountManagerPhone: "",
      });
      onBack?.();
    } catch (err) {
      console.error("Add vendor failed:", err);
      showError(err?.message ?? "Failed to add vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-[660px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
          <button
            onClick={handleBack}
            className="p-2  rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
            aria-label="Back"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 px-8 pt-4 pb-4">Add New Vendor</h2>

          <button
            onClick={handleClose}
            className="group p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* BODY - Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vendorName}
                onChange={handleChange("vendorName")}
                placeholder="Enter Vendor Name"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#1f2a7c]/40 focus:border-[#1f2a7c] outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                Account Manager Email
              </label>
              <input
                type="email"
                value={formData.accountManagerEmail}
                onChange={handleChange("accountManagerEmail")}
                placeholder="Enter Account Manager Email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#1f2a7c]/40 focus:border-[#1f2a7c] outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                Account Manager Name
              </label>
              <input
                type="text"
                value={formData.accountManagerName}
                onChange={handleChange("accountManagerName")}
                placeholder="Enter Account Manager Name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#1f2a7c]/40 focus:border-[#1f2a7c] outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                Account Manager Phone
              </label>
              <input
                type="tel"
                value={formData.accountManagerPhone}
                onChange={handleChange("accountManagerPhone")}
                placeholder="Enter Account Manager Phone"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#1f2a7c]/40 focus:border-[#1f2a7c] outline-none"
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex gap-4 pt-6 pb-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 border border-gray-200 rounded-2xl py-3 text-base font-medium text-gray-800 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.vendorName.trim() || isSubmitting}
              className="flex-1  text-white rounded-2xl py-3 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
