import { useEffect } from "react";

const AddVendorModal = ({ closeModal, AddNewVendor }) => {
  useEffect(() => {
    // Clear errors when modal opens
    const clearErrors = () => {
      const inputs = [
        "addVendorRecord_name",
        "addVendorRecord_managerEmail",
        "addVendorRecord_managerPhone",
      ];
      inputs.forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
          input.classList.remove("invalid-field");
          const errorMsg = input.parentElement?.querySelector(".error-msg");
          if (errorMsg) errorMsg.remove();
        }
      });
    };

    clearErrors();

    // Add event listeners to clear errors on input
    const vendorNameInput = document.getElementById("addVendorRecord_name");
    const emailInput = document.getElementById("addVendorRecord_managerEmail");
    const phoneInput = document.getElementById("addVendorRecord_managerPhone");

    const handleInput = (e) => {
      const input = e.target;
      input.classList.remove("invalid-field");
      const errorMsg = input.parentElement?.querySelector(".error-msg");
      if (errorMsg) errorMsg.remove();
    };

    if (vendorNameInput) {
      vendorNameInput.addEventListener("input", handleInput);
    }
    if (emailInput) {
      emailInput.addEventListener("input", handleInput);
    }
    if (phoneInput) {
      phoneInput.addEventListener("input", handleInput);
    }

    return () => {
      // Cleanup listeners
      if (vendorNameInput) {
        vendorNameInput.removeEventListener("input", handleInput);
      }
      if (emailInput) {
        emailInput.removeEventListener("input", handleInput);
      }
      if (phoneInput) {
        phoneInput.removeEventListener("input", handleInput);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h5 className="text-lg font-semibold text-slate-900">Add New Vendor</h5>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vendor Name */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                id="addVendorRecord_name"
                maxLength={100}
                placeholder="Enter Vendor Name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d225d] transition-all invalid-field:border-red-500 invalid-field:ring-red-200"
              />
              <small id="addVendorRecord_nameLimitMessage" className="text-red-500 text-xs hidden">
                You have reached the maximum limit of 100 characters.
              </small>
            </div>

            {/* Account Manager Email */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Account Manager Email
              </label>
              <input
                id="addVendorRecord_managerEmail"
                type="email"
                maxLength={100}
                placeholder="Enter Account Manager Email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d225d] transition-all invalid-field:border-red-500 invalid-field:ring-red-200"
              />
            </div>

            {/* Account Manager Name */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Account Manager Name
              </label>
              <input
                id="addVendorRecord_managerName"
                maxLength={100}
                placeholder="Enter Account Manager Name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d225d] transition-all"
              />
            </div>

            {/* Account Manager Phone */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Account Manager Phone
              </label>
              <input
                id="addVendorRecord_managerPhone"
                maxLength={100}
                placeholder="Enter Account Manager Phone"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d225d] transition-all invalid-field:border-red-500 invalid-field:ring-red-200"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 px-6 py-4 border-t">
          <button
            onClick={closeModal}
            className="px-6 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={AddNewVendor}
            className="px-6 py-2 rounded-lg bg-[#1d225d] text-white text-sm font-semibold hover:bg-[#15195a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
export default AddVendorModal;
