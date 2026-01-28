import { useState } from "react";

const AddBudgetModal = ({ onClose }) => {
  const [departmentBudget, setDepartmentBudget] = useState(false);
  const [subscriptionBudget, setSubscriptionBudget] = useState(false);

  const handleDepartmentToggle = () => {
    setDepartmentBudget(!departmentBudget);
    setSubscriptionBudget(false);
  };

  const handleSubscriptionToggle = () => {
    setSubscriptionBudget(!subscriptionBudget);
    setDepartmentBudget(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[460px] rounded-2xl shadow-xl relative">
        {/* Header */}
        <div className="px-8 py-5 border-b relative">
          <button
            onClick={onClose}
            className="absolute left-6 top-5 text-sm font-medium text-[#1f2a7c]"
          >
            « Back
          </button>

          <h2 className="text-xl font-semibold text-gray-900 text-center">
            Budget Management
          </h2>

          <button
            onClick={onClose}
            className="absolute right-6 top-5 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter name"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium">Amount</label>
            <input
              type="number"
              placeholder="Enter amount"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          {/* Department Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Department Budget</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={departmentBudget}
                onChange={handleDepartmentToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full peer-after:content-[''] peer-after:absolute peer-after:top-[2px] peer-after:left-[2px] peer-after:w-5 peer-after:h-5 peer-after:bg-white peer-after:rounded-full peer-checked:peer-after:translate-x-5 transition-all"></div>
            </label>
          </div>

          {/* Subscription Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subscription Budget</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={subscriptionBudget}
                onChange={handleSubscriptionToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full peer-after:content-[''] peer-after:absolute peer-after:top-[2px] peer-after:left-[2px] peer-after:w-5 peer-after:h-5 peer-after:bg-white peer-after:rounded-full peer-checked:peer-after:translate-x-5 transition-all"></div>
            </label>
          </div>

          {/* Department Fields */}
          {departmentBudget && (
            <>
              <div>
                <label className="text-sm font-medium">
                  Financial Year <span className="text-red-500">*</span>
                </label>
                <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option>Select Financial Year</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Department <span className="text-red-500">*</span>
                </label>
                <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option>Select Department</option>
                </select>
              </div>
            </>
          )}

          {/* Subscription Field */}
          {subscriptionBudget && (
            <div>
              <label className="text-sm font-medium">
                Subscription <span className="text-red-500">*</span>
              </label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                <option>Select Vendor</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 px-8 py-5 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border text-gray-600"
          >
            Close
          </button>
          <button className="px-6 py-2 rounded-lg bg-[#1f2a7c] text-white">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBudgetModal;
