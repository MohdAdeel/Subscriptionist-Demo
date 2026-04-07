import React from "react";

const PLAN_THEME = {
  free: {
    dot: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    buttonBorder: "border-[#d9dee3]",
  },
  basic: {
    dot: "bg-sky-500",
    iconBg: "bg-sky-50",
    iconText: "text-sky-600",
    buttonBorder: "border-[#d9dee3]",
  },
  standard: {
    dot: "bg-violet-500",
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
    buttonBorder: "border-[#d9dee3]",
  },
  enterprise: {
    dot: "bg-cyan-500",
    iconBg: "bg-cyan-50",
    iconText: "text-cyan-600",
    buttonBorder: "border-[#d9dee3]",
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
    highlighted: true,
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

const OrganizationSettings = () => {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-[#e9ecef] shadow-sm p-4 sm:p-6">
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-bold text-[#343A40]">Pricing Plans</h3>
        <p className="text-xs sm:text-sm text-[#6C757D] mt-1">
          Choose the plan that best fits your organization&apos;s subscription portfolio.
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid grid-cols-4 gap-4 min-w-[1120px]">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`h-full rounded-xl border bg-[#fcfcfd] p-5 transition-all duration-200 flex flex-col ${
                plan.highlighted
                  ? "border-[#172B4D] shadow-md"
                  : "border-[#e9ecef] shadow-sm hover:shadow-md hover:border-[#d0d7de]"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold ${PLAN_THEME[plan.id].iconBg} ${PLAN_THEME[plan.id].iconText}`}
                  >
                    {plan.name.charAt(0)}
                  </span>
                  <span className="text-sm tracking-wide font-semibold text-[#3f4a56]">
                    {plan.name}
                  </span>
                </div>
                {plan.highlighted && (
                  <span className="inline-flex items-center rounded-full bg-[#172B4D]/8 px-2.5 py-1 text-[10px] font-semibold text-[#172B4D]">
                    Recommended
                  </span>
                )}
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
                      className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${PLAN_THEME[plan.id].dot}`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`mt-5 w-full rounded-lg border ${PLAN_THEME[plan.id].buttonBorder} bg-white px-3 py-2 text-xs font-semibold tracking-wide text-[#343A40] transition-colors hover:bg-[#F8F9FA]`}
              >
                SUBSCRIBE NOW
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;
