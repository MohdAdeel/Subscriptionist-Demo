import { useState, useEffect } from "react";
import AddBudgetModal from "./AddBudgetModal";
import { getDepartmentBudgetData, getBudgetData } from "../../lib/utils/subscriptions";

const BudgetManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("subscription");

  useEffect(() => {
    if (activeTab === "subscription") {
      getBudgetData(1);
    } else {
      getDepartmentBudgetData(1);
    }
  }, [activeTab]);

  return (
    <div className="p-5 bg-white rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Budget Management</h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#1f2a7c] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          Add Budget
        </button>

        {showModal && <AddBudgetModal onClose={() => setShowModal(false)} />}
      </div>

      {/* Tabs */}
      <div className="mt-5 border-b border-gray-200 flex gap-2">
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

      {/* Subscription Budget Table */}
      {activeTab === "subscription" && (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
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
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
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
  );
};

export default BudgetManagement;
