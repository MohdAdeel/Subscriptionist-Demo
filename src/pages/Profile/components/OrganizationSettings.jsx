import { useAuthStore } from "../../../stores";
import React, { useEffect, useMemo, useState } from "react";
import { usePopup } from "../../../components/Popup";
import { getContractbyContactId } from "../../../lib/api/profile/profile";

const PLAN_THEME = {
  free: {
    dot: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
  },
  basic: {
    dot: "bg-sky-500",
    iconBg: "bg-sky-50",
    iconText: "text-sky-600",
  },
  standard: {
    dot: "bg-violet-500",
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
  },
  enterprise: {
    dot: "bg-cyan-500",
    iconBg: "bg-cyan-50",
    iconText: "text-cyan-600",
  },
};

const PLANS = [
  {
    id: "free",
    name: "FREE PLAN",
    subtitle: "Track up to 8 subscriptions",
    price: "Free",
    cadence: "",
    description: "Ideal for small businesses and startups",
    accent: "from-emerald-300 to-emerald-400",
    features: [
      "Centralized Dashboard",
      "Subscription Inventory",
      "Alerts and Notifications",
      "Basic Analytics and Reporting",
      "Customer Support (Email)",
    ],
  },
  {
    id: "basic",
    name: "BASIC PLAN",
    subtitle: "Track up to 25 subscriptions",
    price: "$420",
    cadence: "/mo",
    description: "Ideal for small businesses and startups",
    accent: "from-sky-300 to-indigo-300",
    features: [
      "Centralized Dashboard",
      "Subscription Inventory",
      "Alerts and Notifications",
      "Basic Analytics and Reporting",
      "Customer Support (Email)",
    ],
  },
  {
    id: "standard",
    name: "STANDARD PLAN",
    subtitle: "Track up to 50 subscriptions",
    price: "$700",
    cadence: "/mo",
    description: "Ideal for growing businesses and mid-sized enterprises",
    accent: "from-violet-300 to-indigo-300",
    features: [
      "Contract Management",
      "Custom Reporting",
      "User Access and Permissions",
      "Budgeting and Forecasting",
      "Comprehensive Analytics and Reporting",
      "Select Integrations",
      "Customer Support (email + chat + phone)",
    ],
  },
  {
    id: "enterprise",
    name: "ENTERPRISE PLAN",
    subtitle: "Track 50 or more subscriptions",
    price: "Talk to us",
    cadence: "",
    description: "Ideal for large enterprises",
    accent: "from-cyan-300 to-sky-300",
    features: [
      "Full Integrations",
      "Audit Trail",
      "Compliance Management",
      "Strategic Consultation",
      "Benchmarking",
      "Dedicated Account Manager",
      "Custom tailored dashboard",
    ],
  },
];

/**
 * Map API planName (e.g. "Basic", "Free") to internal plan id.
 */
function mapPlanNameToId(planName) {
  if (planName == null || String(planName).trim() === "") return "basic";
  const n = String(planName)
    .trim()
    .toLowerCase()
    .replace(/\s+plan\s*$/i, "")
    .trim();
  if (n === "free") return "free";
  if (n === "basic") return "basic";
  if (n === "standard") return "standard";
  if (n === "enterprise") return "enterprise";
  return "basic";
}

const OrganizationSettings = ({ contactId: contactIdProp, isActive }) => {
  const userAuth = useAuthStore((state) => state.userAuth);
  const { showError } = usePopup();
  const contactId = contactIdProp ?? userAuth?.contactid;

  const [contract, setContract] = useState(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  /** Which plan card is highlighted (from API first, then user taps) */
  const [selectedPlanId, setSelectedPlanId] = useState("basic");

  useEffect(() => {
    if (!isActive || !contactId) return;
    setIsLoadingContract(true);
    getContractbyContactId(contactId)
      .then((data) => {
        setContract(data ?? null);
      })
      .catch((err) => {
        console.error("Failed to load contract details:", err);
        showError("Unable to load plan details. Please try again.");
      })
      .finally(() => {
        setIsLoadingContract(false);
      });
  }, [isActive, contactId, showError]);

  const contractPlanId = useMemo(() => {
    const name = contract?.plan?.planName;
    return name != null ? mapPlanNameToId(name) : null;
  }, [contract]);

  useEffect(() => {
    if (contractPlanId != null) {
      setSelectedPlanId(contractPlanId);
    }
  }, [contractPlanId]);

  const apiFeatures = Array.isArray(contract?.features) ? contract.features : [];

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-[#e9ecef] shadow-sm p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#343A40]">Pricing Plans</h3>
          <p className="text-xs sm:text-sm text-[#6C757D] mt-1">
            Your contract plan is highlighted. Tap a plan to compare — upgrade options apply on
            checkout.
          </p>
        </div>
        {contract?.contract?.contractName && (
          <div className="rounded-xl border border-[#dfe7f5]/90 bg-gradient-to-br from-[#f8faff] via-[#f4f7fd] to-[#eef2fb] px-4 py-2.5 text-right shadow-sm shadow-[#172B4D]/[0.06]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6C757D]">
              Active contract
            </p>
            <p className="text-sm font-semibold text-[#172B4D]">{contract.contract.contractName}</p>
            {contract.plan?.planName && (
              <p className="text-xs text-[#495057] mt-0.5">
                Plan: <span className="font-medium">{contract.plan.planName}</span>
                {contract.plan.featureAccessLevel ? (
                  <span className="text-[#6C757D]">
                    {" "}
                    · {contract.plan.featureAccessLevel} access
                  </span>
                ) : null}
              </p>
            )}
          </div>
        )}
      </div>

      {/* py-* gives space so overflow-x-auto does not clip shadows and rings */}
      <div className="overflow-x-auto py-5 sm:py-6 px-2 sm:px-3 -mx-2 sm:-mx-3">
        <div className="grid grid-cols-4 gap-4 sm:gap-5 min-w-[1120px] pb-0.5">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isContractPlan = contractPlanId === plan.id;
            const theme = PLAN_THEME[plan.id];

            return (
              <article
                key={plan.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlanId(plan.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPlanId(plan.id);
                  }
                }}
                className={[
                  "group relative h-full rounded-2xl border-2 bg-[#fcfcfd] p-5 flex flex-col text-left outline-none transition-all duration-300 ease-out",
                  "focus-visible:ring-2 focus-visible:ring-[#172B4D] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  isSelected
                    ? "border-[#172B4D] z-[1] bg-gradient-to-b from-white via-[#f8f9fd] to-[#eef1fa]/95 shadow-[0_12px_28px_-8px_rgba(23,43,77,0.28),0_22px_48px_-12px_rgba(59,130,246,0.2),0_8px_20px_-6px_rgba(23,43,77,0.18)]"
                    : "border-[#e9ecef] shadow-sm hover:shadow-md hover:border-[#cfd6df] hover:-translate-y-0.5",
                  isLoadingContract && "pointer-events-none opacity-60",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2 mb-1 min-h-[2rem]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold shadow-sm transition-transform duration-300 ${theme.iconBg} ${theme.iconText} ${isSelected ? "scale-110" : "group-hover:scale-105"}`}
                    >
                      {plan.name.charAt(0)}
                    </span>
                    <span className="text-sm tracking-wide font-semibold text-[#3f4a56] truncate">
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isContractPlan && (
                      <span className="inline-flex items-center rounded-full bg-[#172B4D] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        Your plan
                      </span>
                    )}
                    {isSelected && !isContractPlan && (
                      <span className="inline-flex items-center rounded-full border border-[#172B4D]/30 bg-[#172B4D]/8 px-2.5 py-1 text-[10px] font-semibold text-[#172B4D]">
                        Selected
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[#495057] mt-1">{plan.subtitle}</p>

                <div className="mt-4 flex items-end gap-1">
                  <span className="text-2xl font-bold text-[#172B4D]">{plan.price}</span>
                  {plan.cadence && (
                    <span className="text-sm text-[#6C757D] mb-0.5">{plan.cadence}</span>
                  )}
                </div>

                <p className="text-xs text-[#6C757D] mt-2 leading-relaxed">{plan.description}</p>

                <ul className="mt-4 space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-[#343A40]">
                      <span
                        className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isContractPlan}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isContractPlan) setSelectedPlanId(plan.id);
                  }}
                  className={`mt-5 w-full rounded-xl border-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                    isContractPlan
                      ? isSelected
                        ? "cursor-default border-[#172B4D]/35 bg-[#172B4D]/[0.08] text-[#172B4D] hover:bg-[#172B4D]/[0.08] hover:border-[#172B4D]/35"
                        : "cursor-default border-[#c5cad6] bg-[#eef0f4] text-[#495057] hover:bg-[#eef0f4] hover:border-[#c5cad6]"
                      : isSelected
                        ? "border-[#172B4D] bg-[#172B4D] text-white shadow-md hover:bg-[#0f1f3d] hover:border-[#0f1f3d]"
                        : "border-[#d9dee3] bg-white text-[#343A40] hover:bg-[#F8F9FA] hover:border-[#172B4D]/40"
                  }`}
                >
                  {isContractPlan ? "Subscribed" : "Subscribe now"}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {isLoadingContract && (
        <p className="text-center text-xs text-[#6C757D] mt-4 animate-pulse">Loading your plan…</p>
      )}
    </div>
  );
};

export default OrganizationSettings;
