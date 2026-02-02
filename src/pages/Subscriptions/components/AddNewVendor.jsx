import { useState } from "react";
import { FiX, FiChevronLeft } from "react-icons/fi";
import { usePopup } from "../../../components/Popup";
import { checkVendorExistance, createVendorRecord } from "../../../lib/utils/subscriptions";

const DEFAULT_ACCOUNT_ID = "c199b131-4c62-f011-bec2-6045bdffa665";

export default function AddNewVendor({ open = false, onBack, onClose, onAddVendor }) {
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
      const result = await checkVendorExistance(
        DEFAULT_ACCOUNT_ID,
        formData.vendorName.trim(),
        null
      );
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
        "yiic_Account_yiic_subscriptionsactivity@odata.bind": `/accounts(${DEFAULT_ACCOUNT_ID})`,
      };
      const vendorResponse = await createVendorRecord(payload);
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
          <button
            onClick={handleBack}
            className="p-2 bg-[#1d225d] text-white rounded-lg hover:opacity-90 transition-opacity"
            aria-label="Back"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 px-8 pt-5 pb-4">Add New Vendor</h2>

          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* BODY - Form */}
        <form onSubmit={handleSubmit} className="px-8 py-4">
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
          <div className="flex gap-4 pt-8 pb-4">
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
              className="flex-1 bg-[#1d225d] text-white rounded-2xl py-3 text-base font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
