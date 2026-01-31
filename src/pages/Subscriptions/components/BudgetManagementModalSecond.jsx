import { useState, useEffect } from "react";
import AddBudgetModal from "./AddBudgetModal";
import { getDepartmentBudgetData, getBudgetData } from "../../../lib/utils/subscriptions";

export default function BudgetManagementModal({ open = false, onClose }) {
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [activeTab, setActiveTab] = useState("subscription");

  useEffect(() => {
    if (!open) return;
    if (activeTab === "subscription") {
      getBudgetData(1);
    } else {
      getDepartmentBudgetData(1);
    }
  }, [activeTab, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50">
      <div className="bg-white rounded-xl sm:rounded-[14px] w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Budget Management</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddBudgetModal(true)}
              className="bg-[#1f2a7c] text-white px-4 py-2 rounded-lg hover:opacity-90 text-sm font-medium"
            >
              Add Budget
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {showAddBudgetModal && <AddBudgetModal onClose={() => setShowAddBudgetModal(false)} />}

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-2 px-4 sm:px-5 flex-shrink-0">
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-4 py-2 font-medium cursor-pointer
            ${
              activeTab === "subscription"
                ? "text-[#1f2a7c] border-b-2 border-[#1f2a7c]"
                : "text-gray-500"
            }`}
          >
            Subscription Budget
          </button>

          <button
            onClick={() => setActiveTab("department")}
            className={`px-4 py-2 font-medium cursor-pointer
            ${
              activeTab === "department"
                ? "text-[#1f2a7c] border-b-2 border-[#1f2a7c]"
                : "text-gray-500"
            }`}
          >
            Department Budget
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
          {/* Subscription Budget Table */}
          {activeTab === "subscription" && (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="hidden w-[23px]"></th>

                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Budget Name
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Budget Amount
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Subscription Name
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Subscription Amount
                    </th>
                  </tr>
                </thead>

                <tbody
                  id="BudgetSubscriptions"
                  className="divide-y divide-gray-100 text-sm text-gray-700"
                ></tbody>
              </table>

              <div id="subscriptionPagination" className="p-4 bg-white"></div>
            </div>
          )}

          {/* Department Budget Table */}
          {activeTab === "department" && (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="hidden"></th>

                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Budget Name
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Budget Amount
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Department Name
                    </th>
                  </tr>
                </thead>

                <tbody
                  id="DepartmentBudgets"
                  className="divide-y divide-gray-100 text-sm text-gray-700"
                ></tbody>
              </table>

              <div id="departmentPagination" className="p-4 bg-white"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
