import { FiX } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../../stores";
import { usePopup } from "../../../components/Popup";
import { useCreateVendorMutation, useUpdateVendorMutation } from "../../../hooks/useVendors";

const initialFormState = {
  vendorName: "",
  accountManagerName: "",
  accountManagerEmail: "",
  accountManagerPhone: "",
};

export default function AddEditVendorModal({ open = false, onClose, vendor = null }) {
  const isEditMode = Boolean(vendor);
  const { showSuccess, showError, showWarning } = usePopup();
  const [formData, setFormData] = useState(initialFormState);
  const userAuth = useAuthStore((state) => state.userAuth);
  const accountId = userAuth?.accountid;

  const createMutation = useCreateVendorMutation();
  const updateMutation = useUpdateVendorMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open && vendor) {
      setFormData({
        vendorName: vendor.vendorName ?? "",
        accountManagerName: vendor.accountManagerName ?? vendor.managerName ?? "",
        accountManagerEmail: vendor.accountManagerEmail ?? vendor.managerEmail ?? "",
        accountManagerPhone: vendor.accountManagerPhone ?? vendor.managerPhone ?? "",
      });
    } else if (open && !vendor) {
      setFormData(initialFormState);
    }
  }, [open, vendor]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleClose = () => {
    setFormData(initialFormState);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorName.trim()) return;
    const vendorName = formData.vendorName.trim();
    const accountManagerName = formData.accountManagerName.trim() || "";
    const accountManagerEmail = formData.accountManagerEmail.trim() || "";
    const accountManagerPhone = formData.accountManagerPhone.trim().replace(/\D/g, "") || "";
    const requestBody = {
      yiic_vendorname: vendorName,
      yiic_accountmanagername: accountManagerName,
      yiic_accountmanageremail: accountManagerEmail,
      yiic_accountmanagerphone: accountManagerPhone,
    };
    try {
      if (isEditMode) {
        const activityID = vendor?.vendorId;
        if (!activityID) {
          showWarning(
            "Unable to edit: vendor information is missing. Please select the vendor again."
          );
          return;
        }
        const updateBody = { ...requestBody, activityID };
        await updateMutation.mutateAsync({ activityID, updateData: updateBody });
        showSuccess("Vendor has been updated successfully.");
        setFormData(initialFormState);
        onClose?.();
      } else {
        const createBody = {
          ...requestBody,
          "yiic_Account_yiic_subscriptionsactivity@odata.bind": `/accounts(${accountId})`,
        };
        await createMutation.mutateAsync(createBody);
        showSuccess("Vendor has been added successfully.");
        setFormData(initialFormState);
        onClose?.();
      }
    } catch (err) {
      console.error(isEditMode ? "Update vendor failed:" : "Add vendor failed:", err);
      showError("Unable to save vendor. Please try again.");
    }
  };

  if (!open) return null;
  const inputClass =
    "w-full border border-[#d0d5dd] rounded-lg px-3 py-2.5 text-sm text-[#343A40] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#172B4D]/30 focus:border-[#172B4D]";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-[560px] mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-[#e9ecef]">
          <h2 className="text-lg sm:text-xl font-bold text-[#343A40]">
            {isEditMode ? "Edit Vendor" : "Add New Vendor"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="group p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Left column */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-[#343A40]">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vendorName}
                onChange={handleChange("vendorName")}
                placeholder="Enter Vendor Name"
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-[#343A40]">
                Account Manager Email
              </label>
              <input
                type="email"
                value={formData.accountManagerEmail}
                onChange={handleChange("accountManagerEmail")}
                placeholder="Enter Account Manager Email"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-[#343A40]">
                Account Manager Name
              </label>
              <input
                type="text"
                value={formData.accountManagerName}
                onChange={handleChange("accountManagerName")}
                placeholder="Enter Account Manager Name"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-[#343A40]">
                Account Manager Phone
              </label>
              <input
                type="tel"
                value={formData.accountManagerPhone}
                onChange={handleChange("accountManagerPhone")}
                placeholder="Enter Account Manager Phone"
                className={inputClass}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 sm:gap-3 pt-6 mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border-[1.5px] border-[#d0d5dd] text-[#344054] bg-[#F8F9FA] text-sm font-semibold hover:bg-[#e9ecef] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.vendorName.trim() || isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : isEditMode
                  ? "Save"
                  : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
