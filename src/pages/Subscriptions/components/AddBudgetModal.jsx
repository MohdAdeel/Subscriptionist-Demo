import { useState, useCallback, useEffect } from "react";
import {
  addBudget,
  checkBudget,
  getDeparments,
  getFinancialYear,
  getActivityLines,
} from "../../../lib/utils/subscriptions";
import { usePopup } from "../../../components/Popup";

const BUDGET_TYPE = {
  DEPARTMENT: "department",
  SUBSCRIPTION: "subscription",
};

function ToggleSwitch({ checked, onToggle, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1f2a7c]/40 focus:ring-offset-2 ${
        checked ? "bg-[#1f2a7c]" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "left-0.5 translate-x-5" : "left-0.5 translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AddBudgetModal({ open = true, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetType, setBudgetType] = useState(null);
  const [financialYear, setFinancialYear] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [departmentsList, setDepartmentsList] = useState([]);
  const [financialYearsList, setFinancialYearsList] = useState([]);
  const [activityLinesList, setActivityLinesList] = useState([]);
  const [isLoadingDepartmentFields, setIsLoadingDepartmentFields] = useState(false);
  const [isLoadingSubscriptionFields, setIsLoadingSubscriptionFields] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = usePopup();

  const isDepartment = budgetType === BUDGET_TYPE.DEPARTMENT;
  const isSubscription = budgetType === BUDGET_TYPE.SUBSCRIPTION;
  const hasBudgetType = isDepartment || isSubscription;

  const handleDepartmentToggle = useCallback(() => {
    setBudgetType((prev) => (prev === BUDGET_TYPE.DEPARTMENT ? null : BUDGET_TYPE.DEPARTMENT));
  }, []);

  // When Department Budget toggle is on, fetch departments and financial years for the dropdowns
  useEffect(() => {
    if (!isDepartment) {
      setDepartmentsList([]);
      setFinancialYearsList([]);
      return;
    }
    setIsLoadingDepartmentFields(true);
    Promise.all([getDeparments(), getFinancialYear()])
      .then(([deptResult, yearResult]) => {
        const departments = deptResult?.value ?? [];
        const years = yearResult?.value ?? (Array.isArray(yearResult) ? yearResult : []);
        setDepartmentsList(Array.isArray(departments) ? departments : []);
        const yearsList = Array.isArray(years) ? years : [];
        setFinancialYearsList(yearsList);
      })
      .catch((err) => {
        console.error("Failed to load departments or financial years:", err);
        showError(err?.message ?? "Failed to load departments or financial years.");
        setDepartmentsList([]);
        setFinancialYearsList([]);
      })
      .finally(() => {
        setIsLoadingDepartmentFields(false);
      });
  }, [isDepartment, showError]);

  // When Subscription Budget toggle is on, fetch activity lines for the Subscription dropdown
  useEffect(() => {
    if (!isSubscription) {
      setActivityLinesList([]);
      return;
    }
    setIsLoadingSubscriptionFields(true);
    getActivityLines()
      .then((result) => {
        const lines =
          result?.value ?? result?.ActivityLines ?? (Array.isArray(result) ? result : []);
        const list = Array.isArray(lines) ? lines : [];
        setActivityLinesList(list);
        if (list.length > 0 && list[0]) {
        }
      })
      .catch((err) => {
        console.error("Failed to load activity lines:", err);
        showError(err?.message ?? "Failed to load subscriptions.");
        setActivityLinesList([]);
      })
      .finally(() => {
        setIsLoadingSubscriptionFields(false);
      });
  }, [isSubscription, showError]);

  const handleSubscriptionToggle = useCallback(() => {
    setBudgetType((prev) => (prev === BUDGET_TYPE.SUBSCRIPTION ? null : BUDGET_TYPE.SUBSCRIPTION));
  }, []);

  const getActivityLineId = useCallback((item) => {
    if (!item || typeof item !== "object") return "";
    return item.activityid;
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const amountNum = amount === "" ? 0 : parseFloat(amount);
      let payload;
      if (isDepartment) {
        payload = {
          yiic_departmentbudget: true,
          yiic_subscriptionbudget: false,
          "yiic_department@odata.bind": `/yiic_departments(${departmentId})`,
          "yiic_financialyear@odata.bind": `/yiic_masterdatas(${financialYear})`,
          yiic_name: name,
          yiic_amount: amountNum,
        };
      } else if (isSubscription) {
        const indexMatch = subscriptionId.startsWith("index-")
          ? parseInt(subscriptionId.replace("index-", ""), 10)
          : -1;
        const resolvedSubscriptionId =
          indexMatch >= 0 && indexMatch < activityLinesList.length
            ? getActivityLineId(activityLinesList[indexMatch]) || subscriptionId
            : subscriptionId;
        payload = {
          yiic_departmentbudget: false,
          yiic_subscriptionbudget: true,
          "yiic_subscriptionactivity@odata.bind": `/yiic_subscriptionsactivitylines(${resolvedSubscriptionId})`,
          yiic_name: name,
          yiic_amount: amountNum,
        };
      } else {
        payload = null;
      }

      if (isSubscription && payload) {
        addBudget(payload)
          .then(() => {
            showSuccess("Budget added successfully.");
            onSuccess?.();
            onClose?.();
          })
          .catch((err) => {
            console.error("Add budget failed:", err);
            showError(err?.message ?? "Failed to add budget.");
          });
        return;
      }
      if (isDepartment && financialYear && departmentId) {
        checkBudget(financialYear, departmentId)
          .then((result) => {
            const list = Array.isArray(result) ? result : (result?.value ?? []);
            if (Array.isArray(list) && list.length > 0) {
              showWarning(
                "A budget already exists for this department and financial year.",
                "Budget Exists"
              );
              return null;
            }
            if (payload) {
              return addBudget(payload);
            }
          })
          .then((result) => {
            if (result !== undefined && result !== null) {
              showSuccess("Budget added successfully.");
              onSuccess?.();
              onClose?.();
            }
          })
          .catch((err) => {
            console.error("Check budget or add budget failed:", err);
            showError(err?.message ?? "Failed to check or add budget.");
          });
        return;
      }
      onClose?.();
    },
    [
      onClose,
      onSuccess,
      isDepartment,
      isSubscription,
      name,
      amount,
      departmentId,
      financialYear,
      subscriptionId,
      activityLinesList,
      getActivityLineId,
      showSuccess,
      showError,
      showWarning,
    ]
  );

  const inputBase =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1f2a7c]/30 focus:border-[#1f2a7c]";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-budget-title"
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
            id="add-budget-title"
            className="text-xl font-semibold text-gray-800 text-center col-start-2"
          >
            Add Budget
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
              <label htmlFor="budget-name" className="block text-sm font-medium text-gray-800">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="budget-name"
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-800">
                Amount
              </label>
              <input
                id="budget-amount"
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
              <ToggleSwitch
                checked={isDepartment}
                onToggle={handleDepartmentToggle}
                ariaLabel="Toggle department budget"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-gray-800">Subscription Budget</span>
              <ToggleSwitch
                checked={isSubscription}
                onToggle={handleSubscriptionToggle}
                ariaLabel="Toggle subscription budget"
              />
            </div>

            {isDepartment && (
              <>
                <div>
                  <label
                    htmlFor="budget-financial-year"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Financial Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="budget-financial-year"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className={inputBase}
                    disabled={isLoadingDepartmentFields}
                  >
                    <option value="">
                      {isLoadingDepartmentFields ? "Loading..." : "Select Financial Year"}
                    </option>
                    {financialYearsList.map((item, index) => {
                      const isObject = item && typeof item === "object";
                      const value = isObject ? item.yiic_masterdataid : String(item);
                      const label = isObject
                        ? (item.yiic_name ?? item.name ?? item.year ?? item.label ?? String(item))
                        : String(item);
                      return (
                        <option key={value || label || index} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="budget-department"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="budget-department"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className={inputBase}
                    disabled={isLoadingDepartmentFields}
                  >
                    <option value="">
                      {isLoadingDepartmentFields ? "Loading..." : "Select Department"}
                    </option>
                    {departmentsList.map((d) => {
                      const id = d.yiic_departmentid ?? d.yiic_departmentId ?? "";
                      const label = d.yiic_name ?? "";
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </>
            )}

            {isSubscription && (
              <div>
                <label
                  htmlFor="budget-subscription"
                  className="block text-sm font-medium text-gray-800"
                >
                  Subscription <span className="text-red-500">*</span>
                </label>
                <select
                  id="budget-subscription"
                  value={subscriptionId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                  className={inputBase}
                  disabled={isLoadingSubscriptionFields}
                >
                  <option value="">
                    {isLoadingSubscriptionFields ? "Loading..." : "Select Subscription"}
                  </option>
                  {activityLinesList.map((item, index) => {
                    const raw = item && typeof item === "object" ? item : {};
                    const id = getActivityLineId(raw);
                    const label = raw.yiic_subscriptionname;
                    const displayLabel = label || `Subscription ${index + 1}`;
                    const optionValue = id || `index-${index}`;
                    const optionKey = id || `sub-${index}-${displayLabel}`;
                    return (
                      <option key={optionKey} value={optionValue}>
                        {displayLabel}
                      </option>
                    );
                  })}
                </select>
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
              disabled={!hasBudgetType}
              className="px-5 py-2.5 rounded-lg bg-[#1f2a7c] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:opacity-60"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
