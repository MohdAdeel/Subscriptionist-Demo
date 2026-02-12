import { useState, useEffect } from "react";
import AddBudgetModal from "./AddBudgetModal";
import EditBudgetModal from "./EditBudgetModal";
import { useBudgetData } from "../../../hooks/useSubscriptions";

const ITEMS_PER_PAGE = 8;

export default function BudgetManagementModal({ open = false, onClose }) {
  const [goToPageInput, setGoToPageInput] = useState("");
  const [editBudgetRow, setEditBudgetRow] = useState(null);
  const [editBudgetType, setEditBudgetType] = useState(null);
  const [activeTab, setActiveTab] = useState("subscription");
  const [totalCountDepartment, setTotalCountDepartment] = useState(0);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [currentPageDepartment, setCurrentPageDepartment] = useState(1);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [totalCountSubscription, setTotalCountSubscription] = useState(0);
  const [currentPageSubscription, setCurrentPageSubscription] = useState(1);

  const effectivePage =
    activeTab === "subscription" ? currentPageSubscription : currentPageDepartment;

  const { data: budgetData, isLoading: isBudgetLoading } = useBudgetData(effectivePage, {
    enabled: open,
  });

  useEffect(() => {
    if (budgetData) {
      setTotalCountSubscription(Number(budgetData?.SubscriptionBudgetCount) ?? 0);
      setTotalCountDepartment(Number(budgetData?.DepartmentCount) ?? 0);
    }
  }, [budgetData]);

  const subscriptionBudgets = budgetData?.SubscriptionBudget ?? [];
  const departmentBudgets = budgetData?.DepartmentBudget ?? [];

  const subscriptionTotalPages = Math.max(1, Math.ceil(totalCountSubscription / ITEMS_PER_PAGE));
  const departmentTotalPages = Math.max(1, Math.ceil(totalCountDepartment / ITEMS_PER_PAGE));

  const totalPages = activeTab === "subscription" ? subscriptionTotalPages : departmentTotalPages;
  const currentPage =
    activeTab === "subscription" ? currentPageSubscription : currentPageDepartment;
  const setCurrentPage =
    activeTab === "subscription" ? setCurrentPageSubscription : setCurrentPageDepartment;
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  // API returns one page at a time; no client-side slicing
  const paginatedSubscriptionBudgets = subscriptionBudgets;
  const paginatedDepartmentBudgets = departmentBudgets;

  useEffect(() => {
    if (open) {
      setCurrentPageSubscription(1);
      setCurrentPageDepartment(1);
    }
  }, [open]);

  if (!open) return null;

  const handleGoToPage = (e) => {
    e.preventDefault();
    const num = parseInt(goToPageInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setCurrentPage(num);
      setGoToPageInput("");
    }
  };

  const formatCurrency = (amount) => (amount != null ? `$${Number(amount).toLocaleString()}` : "-");

  const isLoading = budgetData == null || isBudgetLoading;
  const showEmptyMessage = (arr) => !isLoading && Array.isArray(arr) && arr.length === 0;

  const SkeletonCell = ({ className = "" }) => (
    <div className={`h-4 bg-gray-200 rounded animate-pulse ${className}`} />
  );

  const TableSkeleton = ({ cols = 4, rows = 6 }) => (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm flex-1 min-h-0">
      <table className="w-full border-collapse">
        <thead className="bg-white">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th
                key={i}
                className={`px-4 py-3 border-b border-gray-200 ${i === 1 || (cols === 4 && i === 3) ? "text-right" : ""}`}
              >
                <SkeletonCell
                  className={i === 1 || (cols === 4 && i === 3) ? "w-16 ml-auto" : "w-20"}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-4 py-3 ${colIdx === 1 || (cols === 4 && colIdx === 3) ? "text-right" : ""}`}
                >
                  <SkeletonCell
                    className={
                      colIdx === 1 || (cols === 4 && colIdx === 3) ? "w-16 ml-auto" : "w-24"
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
              className="group p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90 flex items-center justify-center text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {showAddBudgetModal && <AddBudgetModal onClose={() => setShowAddBudgetModal(false)} />}
        {showEditBudgetModal && editBudgetRow && editBudgetType && (
          <EditBudgetModal
            open={showEditBudgetModal}
            onClose={() => {
              setShowEditBudgetModal(false);
              setEditBudgetRow(null);
              setEditBudgetType(null);
            }}
            budgetRow={editBudgetRow}
            budgetType={editBudgetType}
          />
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-2 px-4 sm:px-5 flex-shrink-0">
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-4 py-2 font-medium cursor-pointer border-b-2 -mb-px transition-colors ${
              activeTab === "subscription"
                ? "text-[#1f2a7c] border-[#1f2a7c]"
                : "text-gray-500 border-transparent"
            }`}
          >
            Subscription Budget
          </button>
          <button
            onClick={() => setActiveTab("department")}
            className={`px-4 py-2 font-medium cursor-pointer border-b-2 -mb-px transition-colors ${
              activeTab === "department"
                ? "text-[#1f2a7c] border-[#1f2a7c]"
                : "text-gray-500 border-transparent"
            }`}
          >
            Department Budget
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0 flex flex-col">
          {isLoading ? (
            <>
              <TableSkeleton cols={activeTab === "subscription" ? 4 : 3} rows={8} />
              <div className="flex items-center justify-between pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
                <div className="flex items-center gap-2">
                  <SkeletonCell className="w-8 h-9" />
                  <SkeletonCell className="w-12 h-9" />
                  <SkeletonCell className="w-8 h-9" />
                </div>
                <div className="flex items-center gap-1">
                  <SkeletonCell className="min-w-[36px] w-9 h-9" />
                  <SkeletonCell className="min-w-[36px] w-9 h-9" />
                  <SkeletonCell className="min-w-[36px] w-9 h-9" />
                  <SkeletonCell className="min-w-[36px] w-9 h-9" />
                  <SkeletonCell className="min-w-[36px] w-9 h-9" />
                </div>
              </div>
            </>
          ) : activeTab === "subscription" ? (
            <>
              <div className="h-[360px] flex-shrink-0 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-white sticky top-0 z-[1]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-200 bg-white">
                        Budget Name
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 border-b border-gray-200 bg-white">
                        Budget Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-200 bg-white">
                        Subscription Name
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 border-b border-gray-200 bg-white">
                        Subscription Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {showEmptyMessage(paginatedSubscriptionBudgets) ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No subscription budgets to display.
                        </td>
                      </tr>
                    ) : (
                      paginatedSubscriptionBudgets.map((row) => (
                        <tr
                          key={row.BudgetId}
                          className="hover:bg-gray-50/50 cursor-pointer"
                          onDoubleClick={() => {
                            setEditBudgetRow(row);
                            setEditBudgetType("subscription");
                            setShowEditBudgetModal(true);
                          }}
                        >
                          <td className="px-4 py-3 text-gray-800">{row.BudgetName}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[#1f2a7c] font-medium">
                              {formatCurrency(row.BudgetAmount)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[#1f2a7c] underline cursor-pointer hover:opacity-80">
                              {row.SubName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800">
                            {formatCurrency(row.SubAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
                <form onSubmit={handleGoToPage} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Go to</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder="#"
                    value={goToPageInput !== "" ? goToPageInput : String(currentPage)}
                    onChange={(e) => setGoToPageInput(e.target.value)}
                    className="w-12 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1f2a7c]/30 focus:border-[#1f2a7c]"
                  />
                  <span className="text-sm text-gray-600">Page</span>
                </form>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!canPrev}
                    className="min-w-[36px] h-9 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] h-9 rounded-lg font-medium flex items-center justify-center ${
                        currentPage === page
                          ? "bg-[#1f2a7c] text-white"
                          : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!canNext}
                    className="min-w-[36px] h-9 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-[360px] flex-shrink-0 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-white sticky top-0 z-[1]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-200 bg-white">
                        Budget Name
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 border-b border-gray-200 bg-white">
                        Budget Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-200 bg-white">
                        Department Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {showEmptyMessage(paginatedDepartmentBudgets) ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No department budgets to display.
                        </td>
                      </tr>
                    ) : (
                      paginatedDepartmentBudgets.map((row) => (
                        <tr
                          key={row.BudgetId}
                          className="hover:bg-gray-50/50 cursor-pointer"
                          onDoubleClick={() => {
                            setEditBudgetRow(row);
                            setEditBudgetType("department");
                            setShowEditBudgetModal(true);
                          }}
                        >
                          <td className="px-4 py-3 text-gray-800">{row.BudgetName}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[#1f2a7c] font-medium">
                              {formatCurrency(row.BudgetAmount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-800">{row.DepartmentName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
                <form onSubmit={handleGoToPage} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Go to</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder="#"
                    value={goToPageInput !== "" ? goToPageInput : String(currentPage)}
                    onChange={(e) => setGoToPageInput(e.target.value)}
                    className="w-12 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1f2a7c]/30 focus:border-[#1f2a7c]"
                  />
                  <span className="text-sm text-gray-600">Page</span>
                </form>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!canPrev}
                    className="min-w-[36px] h-9 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] h-9 rounded-lg font-medium flex items-center justify-center ${
                        currentPage === page
                          ? "bg-[#1f2a7c] text-white"
                          : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!canNext}
                    className="min-w-[36px] h-9 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
