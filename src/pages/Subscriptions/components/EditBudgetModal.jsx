import { useState, useCallback, useEffect } from "react";
import { updateBudget } from "../../../lib/utils/subscriptions";

const BUDGET_TYPE = {
  DEPARTMENT: "department",
  SUBSCRIPTION: "subscription",
};

/** Locked toggle - same look but not clickable */
function ToggleSwitchLocked({ checked, ariaLabel }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-disabled="true"
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors opacity-90 cursor-not-allowed ${
        checked ? "bg-[#1f2a7c]" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "left-0.5 translate-x-5" : "left-0.5 translate-x-0"
        }`}
      />
    </div>
  );
}

export default function EditBudgetModal({
  open = false,
  onClose,
  budgetRow = null,
  budgetType = null,
  onSuccess,
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const isDepartment = budgetType === BUDGET_TYPE.DEPARTMENT;
  const isSubscription = budgetType === BUDGET_TYPE.SUBSCRIPTION;

  useEffect(() => {
    if (open && budgetRow) {
      setName(budgetRow.BudgetName ?? "");
      setAmount(
        budgetRow.BudgetAmount != null && budgetRow.BudgetAmount !== ""
          ? String(budgetRow.BudgetAmount)
          : ""
      );
    }
  }, [open, budgetRow]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const budgetId = budgetRow?.BudgetId;
      if (!budgetId) return;
      const amountNum = amount === "" ? 0 : parseFloat(amount);
      const payload = {
        budgetId,
        yiic_name: name,
        yiic_amount: amountNum,
      };
      updateBudget(budgetId, payload)
        .then((result) => {
          console.log("Edit Budget result:", result);
          onSuccess?.();
          onClose?.();
        })
        .catch((err) => {
          console.error("Update budget failed:", err);
        });
    },
    [onClose, onSuccess, name, amount, budgetRow]
  );

  const inputBase =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1f2a7c]/30 focus:border-[#1f2a7c]";
  const readonlyCls =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 pl-8 sm:pl-9 text-sm text-gray-800 bg-gray-100 cursor-not-allowed";
  const lockIcon = (
    <i
      className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400"
      aria-hidden
    />
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1002] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-budget-title"
    >
      <div className="bg-white rounded-xl sm:rounded-[14px] w-full max-w-[460px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 items-center gap-2 p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-[#1f2a7c] hover:opacity-90 transition-opacity justify-self-start"
          >
            « Back
          </button>
          <h2
            id="edit-budget-title"
            className="text-xl font-semibold text-gray-800 text-center col-start-2"
          >
            Edit Budget
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-xl leading-none justify-self-end"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            <div>
              <label htmlFor="edit-budget-name" className="block text-sm font-medium text-gray-800">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-budget-name"
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label
                htmlFor="edit-budget-amount"
                className="block text-sm font-medium text-gray-800"
              >
                Amount
              </label>
              <input
                id="edit-budget-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                step="any"
                className={inputBase}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-gray-800">Department Budget</span>
              <span className="flex items-center gap-2">
                <i className="fa fa-lock text-gray-400 text-xs sm:text-sm" aria-hidden />
                <ToggleSwitchLocked
                  checked={isDepartment}
                  ariaLabel="Department budget (read-only)"
                />
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-gray-800">Subscription Budget</span>
              <span className="flex items-center gap-2">
                <i className="fa fa-lock text-gray-400 text-xs sm:text-sm" aria-hidden />
                <ToggleSwitchLocked
                  checked={isSubscription}
                  ariaLabel="Subscription budget (read-only)"
                />
              </span>
            </div>

            {isDepartment && (
              <>
                <div className="relative">
                  {lockIcon}
                  <label className="block text-sm font-medium text-gray-800">Financial Year</label>
                  <input
                    type="text"
                    readOnly
                    value={budgetRow?.FinancialYearName ?? budgetRow?.FinancialYear ?? "—"}
                    className={readonlyCls}
                  />
                </div>
                <div className="relative">
                  {lockIcon}
                  <label className="block text-sm font-medium text-gray-800">Department</label>
                  <input
                    type="text"
                    readOnly
                    value={budgetRow?.DepartmentName ?? "—"}
                    className={readonlyCls}
                  />
                </div>
              </>
            )}

            {isSubscription && (
              <div className="relative">
                {lockIcon}
                <label className="block text-sm font-medium text-gray-800">Subscription</label>
                <input
                  type="text"
                  readOnly
                  value={budgetRow?.SubName ?? "—"}
                  className={readonlyCls}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-center gap-3 px-4 sm:px-5 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#1f2a7c] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
