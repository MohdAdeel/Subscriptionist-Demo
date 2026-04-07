import {
  useAddSubscriptionMutation,
  checkSubscriptionExistance,
  getSubscriptionActivityById,
  useUpdateSubscriptionMutation,
} from "../../../hooks/useSubscriptions";
import { usePopup } from "../../../components/Popup";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNotifications } from "../../../hooks/useNotifications";
import { FiCalendar, FiLock, FiChevronRight } from "react-icons/fi";

const DESC_MAX = 2000;

const RIGHT_COLUMN_LABELS = {
  vendorProfile: "Vendor Profile",
  activityLineId: "Vendor ID",
  vendorName: "Vendor Name",
  subscriptionAmount: "Subscription Amount",
  lastUpdated: "Last Updated",
  account: "Account",
  doyourequireapart: "Do you require a partner for renewal?",
  licenses: "Number of Licenses",
  currentusers: "Number of Current Users",
  accountManagerName: "Account Manager Name",
  accountManagerEmail: "Account Manager Email",
  accountManagerPhone: "Account Manager Phone",
};

function toDateInputValue(val) {
  if (val == null || val === "") return "";
  const s = String(val);
  return s.length >= 10 ? s.substring(0, 10) : s;
}

function formatDateToDDMMYYYY(val) {
  if (val == null || val === "") return "";
  const s = String(val);
  const ymd = s.length >= 10 ? s.substring(0, 10) : s;
  const parts = ymd.split("-");
  if (parts.length !== 3) return val;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function defaultFormState(selectedVendor = "") {
  const v = typeof selectedVendor === "object" ? selectedVendor : null;
  const vendorName = v
    ? (v.yiic_vendorname ?? v.vendorName ?? v.name ?? v.id ?? "")
    : String(selectedVendor ?? "");
  return {
    ActivityAutoNumber: "",
    activityLineId: v?.activityid,
    yiic_activityid: v?.yiic_activityid ?? "",
    subsname: "",
    description: "",
    subsstartdate: "",
    subsenddate: "",
    subsfrequencynumber: "",
    subsfrequencyunit: "null",
    subsfrequency: "",
    autorenewcontract: null,
    licenses: "",
    currentusers: "",
    doyourequireapart: null,
    lastduedate: "",
    nextduedate: "",
    activityStatus: "",
    subscontractamount: "",
    vendorProfile: "",
    departmentId: "",
    departmentName: "",
    account: "",
    vendorName,
    subscriptionAmount: v?.yiic_subscriptionamount != null ? String(v.yiic_subscriptionamount) : "",
    lastUpdated: v?.modifiedon != null ? formatDateToDDMMYYYY(v.modifiedon) : "",
    accountManagerName: v?.z ?? "",
    accountManagerEmail: v?.yiic_accountmanageremail ?? "",
    accountManagerPhone: v?.yiic_accountmanagerphone ?? "",
  };
}

function toISODateString(val) {
  if (val == null || val === "") return val;
  const s = String(val).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10) + "T00:00:00.000Z";
  }
  return s;
}

function buildAddPayload(form) {
  const subsfrequencyunit =
    form.subsfrequencyunit === "null" || form.subsfrequencyunit === ""
      ? null
      : Number(form.subsfrequencyunit);

  const vendorProfile = form.vendorProfile?.toLowerCase();
  const vendorProfileCode =
    vendorProfile === "strategic"
      ? 1
      : vendorProfile === "tactical"
        ? 2
        : vendorProfile === "operational"
          ? 3
          : null;

  return {
    yiic_subscriptionname: form.subsname ?? "",
    yiic_vendorprofile: vendorProfileCode,
    "yiic_Subscriptionactivity_yiic_subscriptionsactivityline@odata.bind": form.activityLineId
      ? `/yiic_subscriptionsactivities(${form.activityLineId})`
      : undefined,
    "yiic_SubscriptionDepartment_yiic_subscriptionsactivityline@odata.bind": form.departmentId
      ? `/yiic_departments(${form.departmentId})`
      : undefined,
    yiic_subscriptioncontractamount:
      form.subscontractamount !== "" && form.subscontractamount != null
        ? Math.max(0, Number(form.subscontractamount))
        : 0,
    description: form.description ?? "",
    yiic_nooflicenses: form.licenses === "" || form.licenses == null ? null : Number(form.licenses),
    yiic_noofcurrentusers:
      form.currentusers === "" || form.currentusers == null ? null : Number(form.currentusers),
    yiic_subscriptionstartdate: toISODateString(form.subsstartdate) ?? "",
    yiic_subscriptionenddate: toISODateString(form.subsenddate) ?? "",
    yiic_lastduedate: toISODateString(form.lastduedate) ?? "",
    yiic_nextduedate: toISODateString(form.nextduedate) ?? "",
    yiic_subscriptionfrequency: form.subsfrequency ?? "",
    yiic_subscriptionfrequencynumber: form.subsfrequencynumber
      ? Math.max(0, Number(form.subsfrequencynumber))
      : null,
    yiic_subscriptionfrequencyunit: subsfrequencyunit ?? null,
    yiic_isitautorenewcontract: form.autorenewcontract ?? null,
    yiic_doyourequireapartnerforrenewal: form.doyourequireapart ?? null,
  };
}

function formatContractAmount(val) {
  const n = parseFloat(val);
  if (Number.isNaN(n) || val === "" || val == null) return "";
  return n.toFixed(2);
}

function formatSubscriptionFrequencyDisplay(number, unitCode) {
  if (number === "" || !unitCode || unitCode === "null") return "";
  const n = parseInt(number, 10);
  if (Number.isNaN(n)) return "";
  if (unitCode === "664160002") {
    return n === 1 ? "1 Month" : `${n} Months`;
  }
  if (unitCode === "664160003") {
    return n === 1 ? "1 Year" : `${n} Years`;
  }
  return "";
}

function extractActivityLineId(record) {
  if (!record) return null;
  return (
    record.activityLineId ??
    record.activityid ??
    record.yiic_activityid ??
    record.yiic_subscriptionactivityid ??
    record.yiic_subscriptionsactivityid ??
    record.yiic_subscriptionsactivitylineid ??
    record.id ??
    null
  );
}

function buildUpdatePayload(form, createdRecord) {
  const activityLineId = extractActivityLineId(createdRecord) ?? form.activityLineId ?? "";
  const subsfrequencyunit =
    form.subsfrequencyunit === "null" || form.subsfrequencyunit === ""
      ? null
      : Number(form.subsfrequencyunit);
  return {
    ActivityAutoNumber: createdRecord?.yiic_activityid ?? createdRecord?.ActivityAutoNumber ?? "",
    activityLineId,
    subsname: form.subsname ?? "",
    description: form.description ?? "",
    subsstartdate: toISODateString(form.subsstartdate) ?? "",
    subsenddate: toISODateString(form.subsenddate) ?? "",
    subsfrequencynumber:
      form.subsfrequencynumber !== "" && form.subsfrequencynumber != null
        ? String(Math.max(0, Number(form.subsfrequencynumber)))
        : "",
    subsfrequencyunit: subsfrequencyunit ?? null,
    autorenewcontract: form.autorenewcontract ?? null,
    licenses: form.licenses === "" || form.licenses == null ? null : form.licenses,
    currentusers: form.currentusers === "" || form.currentusers == null ? null : form.currentusers,
    doyourequireapart: form.doyourequireapart ?? null,
    subscontractamount:
      form.subscontractamount !== "" && form.subscontractamount != null
        ? String(Math.max(0, Number(form.subscontractamount)))
        : "",
    subsfrequency: form.subsfrequency ?? "",
    lastduedate: toISODateString(form.lastduedate) ?? "",
    nextduedate: toISODateString(form.nextduedate) ?? "",
    department: form.departmentId,
    departmentName: form.departmentName ?? createdRecord?.departmentName ?? "",
  };
}

function LockedInput({ children, className = "" }) {
  return (
    <div className={`relative ${className}`.trim()}>
      <i
        className="fa fa-lock pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[13px] text-slate-400/90"
        aria-hidden
      />
      {children}
    </div>
  );
}

export default function AddSubscriptionFormModal({
  open,
  onClose,
  onSuccess,
  departments,
  selectedVendor,
}) {
  const addMutation = useAddSubscriptionMutation();
  const updateMutation = useUpdateSubscriptionMutation();
  const { invalidate: invalidateNotifications } = useNotifications();
  const endDatePickerRef = useRef(null);
  const startDatePickerRef = useRef(null);
  const lastDueDatePickerRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(defaultFormState(selectedVendor));
  const [createdRecord, setCreatedRecord] = useState(null);
  const { showSuccess, showError, showWarning } = usePopup();

  const openDatePicker = (ref) => {
    if (ref?.current) {
      ref.current.focus();
      if (typeof ref.current.showPicker === "function") {
        ref.current.showPicker();
      }
    }
  };

  const handleEnterOrSpace = useCallback(
    (action) => (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        action();
      }
    },
    []
  );

  useEffect(() => {
    if (!open) {
      setForm(defaultFormState(selectedVendor));
      setCreatedRecord(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && selectedVendor !== undefined) {
      const v = typeof selectedVendor === "object" ? selectedVendor : null;
      const vendorName = v
        ? (v.yiic_vendorname ?? v.vendorName ?? v.name ?? v.id ?? "")
        : String(selectedVendor ?? "");
      setForm((prev) => ({
        ...prev,
        vendorName,
        activityLineId: v?.activityid ?? prev.activityLineId,
        yiic_activityid: v?.yiic_activityid ?? prev.yiic_activityid ?? "",
        subscriptionAmount:
          v?.yiic_subscriptionamount != null
            ? String(v.yiic_subscriptionamount)
            : prev.subscriptionAmount,
        lastUpdated:
          v?.modifiedon != null ? formatDateToDDMMYYYY(v.modifiedon) : (prev.lastUpdated ?? ""),
        accountManagerName: v?.yiic_accountmanagername ?? prev.accountManagerName,
        accountManagerEmail: v?.yiic_accountmanageremail ?? prev.accountManagerEmail,
        accountManagerPhone: v?.yiic_accountmanagerphone ?? prev.accountManagerPhone,
      }));
    }
  }, [open, selectedVendor]);

  useEffect(() => {
    const unitCode =
      form.subsfrequencyunit === "664160002" || form.subsfrequencyunit === 664160002
        ? "664160002"
        : form.subsfrequencyunit === "664160003" || form.subsfrequencyunit === 664160003
          ? "664160003"
          : null;
    const combined =
      form.subsfrequencynumber !== "" && unitCode
        ? formatSubscriptionFrequencyDisplay(String(form.subsfrequencynumber), unitCode)
        : form.subsfrequency;
    setForm((prev) =>
      prev.subsfrequency === combined ? prev : { ...prev, subsfrequency: combined }
    );
  }, [form.subsfrequencynumber, form.subsfrequencyunit]);

  const update = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleContractAmountBlur = useCallback(() => {
    setForm((prev) => {
      const n = parseFloat(prev.subscontractamount);
      const clamped =
        prev.subscontractamount !== "" && !Number.isNaN(n) && n < 0
          ? "0.00"
          : formatContractAmount(prev.subscontractamount);
      return { ...prev, subscontractamount: clamped };
    });
  }, []);

  const handleDescriptionChange = useCallback(
    (e) => {
      const v = e.target.value;
      if (v.length <= DESC_MAX) update("description", v);
    },
    [update]
  );

  const handleNumKeyDown = useCallback((e) => {
    const t = e.target;
    if (t.value.length >= 12 && !/Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(e.key)) {
      e.preventDefault();
    }
  }, []);

  const saveSubscription = useCallback(
    async ({ closeAfterSave = true, showSavedAlert = false } = {}) => {
      if (
        !form.vendorProfile?.trim() ||
        !form.subsname?.trim() ||
        !form.lastduedate?.trim() ||
        !form.departmentId?.trim()
      ) {
        return;
      }
      const payload = buildAddPayload(form);
      const currentActivityId = extractActivityLineId(createdRecord) ?? form.activityLineId;
      setIsSaving(true);
      try {
        const result = await checkSubscriptionExistance(
          payload.yiic_subscriptionname,
          currentActivityId
        );
        const value = result?.value;
        const hasDuplicate = Array.isArray(value) && value.length > 0;
        if (hasDuplicate) {
          showWarning(
            "A subscription with this name already exists for this activity.",
            "Subscription Exists"
          );
          return;
        }
        if (createdRecord) {
          const updatePayload = buildUpdatePayload(form, createdRecord);
          await updateMutation.mutateAsync(updatePayload);
          invalidateNotifications();
          if (showSavedAlert) {
            showSuccess("Subscription updated.");
          }
          if (closeAfterSave) {
            onSuccess?.();
            onClose?.();
          }
        } else {
          const created = await addMutation.mutateAsync(payload);
          const newActivityId = extractActivityLineId(created) ?? form.activityLineId;
          if (newActivityId) {
            try {
              const details = await getSubscriptionActivityById(newActivityId);
              const first = details?.value?.[0];
              setCreatedRecord(first ?? created ?? { activityLineId: newActivityId });
            } catch (err) {
              console.warn("Unable to fetch created subscription details:", err);
              setCreatedRecord(created ?? { activityLineId: newActivityId });
            }
          } else {
            setCreatedRecord(created ?? null);
          }
          invalidateNotifications();
          if (showSavedAlert) {
            showSuccess("Subscription saved.");
          }
          if (closeAfterSave) {
            onSuccess?.();
            onClose?.();
          }
        }
      } catch (err) {
        console.error("Save subscription failed:", err);
        showError(err?.message || "Failed to save subscription.");
      } finally {
        setIsSaving(false);
      }
    },
    [
      form,
      createdRecord,
      addMutation,
      updateMutation,
      invalidateNotifications,
      onClose,
      onSuccess,
      showError,
      showSuccess,
      showWarning,
      setCreatedRecord,
    ]
  );

  if (!open) return null;

  const descriptionCount = form.description.length;
  const actionDisabled =
    isSaving ||
    !form.vendorProfile?.trim() ||
    !form.subsname?.trim() ||
    !form.lastduedate?.trim() ||
    !form.departmentId?.trim();

  const labelCls =
    "text-xs sm:text-[13px] font-semibold text-slate-600 mb-2 block leading-snug tracking-tight";
  const requiredCls = "text-rose-400 font-normal normal-case tracking-normal ml-0.5";
  const inputCls =
    "h-10 sm:h-11 text-sm rounded-xl border border-slate-200/90 bg-white text-slate-800 w-full box-border py-2 px-3 sm:px-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200/70 focus:ring-offset-0";
  const readonlyCls =
    "h-10 sm:h-11 text-sm rounded-xl border border-slate-200/70 bg-gradient-to-b from-slate-50/95 to-slate-100/50 text-slate-600 w-full box-border py-2 px-3 sm:px-3.5 pl-9 sm:pl-10 cursor-not-allowed shadow-inner shadow-slate-200/40";
  const sectionCls =
    "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-indigo-50/[0.35] to-sky-50/30 p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(99,102,241,0.08)]";
  const sectionHeaderCls = "flex items-start justify-between gap-3 mb-4 sm:mb-5";
  const sectionTitleCls =
    "text-[15px] sm:text-base font-semibold tracking-tight text-slate-800 m-0";
  const sectionHintCls = "text-xs text-slate-500 mt-1 leading-snug max-w-prose";
  const sectionGridCls = "grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 sm:gap-y-5";
  const accordionCls =
    "group rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-indigo-50/20 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-indigo-200/50 hover:shadow-[0_12px_32px_-16px_rgba(99,102,241,0.18)] open:border-indigo-200/60 open:shadow-[0_16px_40px_-18px_rgba(99,102,241,0.2)]";
  const accordionSummaryCls =
    "cursor-pointer rounded-2xl px-4 sm:px-5 py-3.5 flex items-center gap-3 list-none transition-colors duration-300 ease-out group-open:bg-indigo-50/40 hover:bg-slate-50/80 [&::-webkit-details-marker]:hidden";
  const accordionChevronCls =
    "w-4 h-4 shrink-0 text-indigo-400 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-90";
  const accordionPanelCls =
    "grid overflow-hidden px-4 sm:px-5 transition-[grid-template-rows,opacity,padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] grid-rows-[0fr] opacity-60 pb-0 group-open:grid-rows-[1fr] group-open:opacity-100 group-open:pb-5";
  const accordionPanelInnerCls =
    "min-h-0 overflow-hidden pt-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 translate-y-1 group-open:pt-2 group-open:opacity-100 group-open:translate-y-0";
  const textareaCls = `${inputCls} h-auto min-h-[104px] resize-y py-2.5 leading-relaxed`;

  return (
    <div className="animate-modal-backdrop fixed top-0 right-0 bottom-0 left-[245px] z-[80] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/30 p-4 sm:p-5 md:p-8 backdrop-blur-[3px]">
      <div className="animate-modal-panel bg-white/95 w-full max-w-[1180px] flex flex-col overflow-hidden my-auto max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] min-h-0 rounded-2xl border border-white/80 shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_24px_48px_-12px_rgba(15,23,42,0.12),0_12px_24px_-8px_rgba(99,102,241,0.1)]">
        <div className="flex flex-col h-full min-h-0">
          {/* HEADER */}
          <div className="shrink-0 px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-200/70 bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/40 flex justify-between items-start sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h5 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-800 m-0">
                Add Subscription
              </h5>
              <p className="text-sm text-slate-500 mt-1 m-0 leading-snug">
                Create a subscription with schedule, vendor context, and financial details.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-indigo-100/70 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/80"
              onClick={onClose}
              aria-label="Close"
            >
              <span className="text-2xl leading-none font-light" aria-hidden>
                ×
              </span>
            </button>
          </div>

          {/* BODY */}
          <div className="px-5 sm:px-7 py-5 sm:py-6 overflow-y-auto flex-1 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)] bg-gradient-to-b from-slate-50/40 to-white">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 md:gap-10">
                {/* LEFT COLUMN */}
                <div className="flex-1 lg:border-r lg:border-slate-200/70 lg:pr-6 lg:pr-10 space-y-5 sm:space-y-6">
                  <section className={sectionCls}>
                    <div className={sectionHeaderCls}>
                      <div>
                        <h6 className={sectionTitleCls}>Subscription Overview</h6>
                        <p className={sectionHintCls}>The core identity of the subscription</p>
                      </div>
                    </div>
                    <div className={sectionGridCls}>
                      <div>
                        <label className={labelCls}>Subscription ID</label>
                        <LockedInput>
                          <input
                            readOnly
                            value={form.yiic_activityid || "—"}
                            className={readonlyCls}
                          />
                        </LockedInput>
                      </div>

                      <div className="relative">
                        <label className={labelCls}>
                          Subscription Name <span className={requiredCls}>*</span>
                        </label>
                        <input
                          maxLength={87}
                          value={form.subsname}
                          onChange={(e) => update("subsname", e.target.value)}
                          className={inputCls}
                        />
                      </div>

                      <div className="relative">
                        <label className={labelCls}>
                          Subscription Department <span className={requiredCls}>*</span>
                        </label>
                        <select
                          value={form.departmentId || ""}
                          onChange={(e) => {
                            const id = e.target.value;
                            const selected = Array.isArray(departments)
                              ? departments.find(
                                  (d) => (d.yiic_departmentid || d.yiic_departmentId) === id
                                )
                              : null;
                            setForm((prev) => ({
                              ...prev,
                              departmentId: id,
                              departmentName: selected?.yiic_name ?? "",
                            }));
                          }}
                          className={inputCls}
                        >
                          <option value="">Select Department</option>
                          {Array.isArray(departments) &&
                            departments.map((d) => {
                              const id = d.yiic_departmentid ?? d.yiic_departmentId ?? "";
                              const name = d.yiic_name ?? "";
                              return (
                                <option key={id} value={id}>
                                  {name}
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      <div className="relative">
                        <label className={labelCls}>
                          {RIGHT_COLUMN_LABELS.vendorProfile} <span className={requiredCls}>*</span>
                        </label>
                        <select
                          value={form.vendorProfile || ""}
                          onChange={(e) => update("vendorProfile", e.target.value)}
                          required
                          className={inputCls}
                        >
                          <option value="">Select Vendor Profile</option>
                          <option value="1">Strategic</option>
                          <option value="2">Tactical</option>
                          <option value="3">Operational</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>{RIGHT_COLUMN_LABELS.account}</label>
                        <LockedInput>
                          <input readOnly value={form.account || "—"} className={readonlyCls} />
                        </LockedInput>
                      </div>

                      <div>
                        <label className={labelCls}>Activity Status</label>
                        <LockedInput>
                          <input
                            readOnly
                            value={form.activityStatus || "—"}
                            className={readonlyCls}
                          />
                        </LockedInput>
                      </div>

                      <div className="relative sm:col-span-2">
                        <label className={labelCls}>Description</label>
                        <textarea
                          maxLength={DESC_MAX}
                          rows={4}
                          value={form.description}
                          onChange={handleDescriptionChange}
                          className={textareaCls}
                        />
                        <small className="text-[11px] sm:text-xs text-slate-400 mt-1.5 flex justify-end tabular-nums">
                          <span>{descriptionCount}</span>/2000
                        </small>
                      </div>
                    </div>
                  </section>

                  <section className={sectionCls}>
                    <div className={sectionHeaderCls}>
                      <div>
                        <h6 className={sectionTitleCls}>Schedule & Frequency</h6>
                        <p className={sectionHintCls}>All date and recurrence logic together</p>
                      </div>
                    </div>
                    <div className={sectionGridCls}>
                      {[
                        {
                          key: "subsstartdate",
                          label: "Subscription Start Date",
                          pickerRef: startDatePickerRef,
                          locked: false,
                        },
                        {
                          key: "subsenddate",
                          label: "Subscription End Date",
                          pickerRef: endDatePickerRef,
                          locked: true,
                        },
                      ].map(({ key, label, pickerRef, locked }) => (
                        <div className="relative" key={key}>
                          <label className={labelCls}>{label}</label>
                          {locked ? (
                            <div className="relative">
                              <input
                                type="text"
                                readOnly
                                placeholder="dd/mm/yyyy"
                                value={formatDateToDDMMYYYY(form[key])}
                                className={`${inputCls} pl-9 sm:pl-10 bg-slate-50/90 cursor-not-allowed`}
                                aria-label={label}
                              />
                              <FiLock
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none text-slate-400"
                                aria-hidden
                              />
                            </div>
                          ) : (
                            <div
                              className="relative cursor-pointer"
                              onClick={() => openDatePicker(pickerRef)}
                              onKeyDown={handleEnterOrSpace(() => openDatePicker(pickerRef))}
                              role="button"
                              tabIndex={0}
                              aria-label={`Open calendar for ${label}`}
                            >
                              <input
                                ref={pickerRef}
                                type="date"
                                value={form[key] || ""}
                                onChange={(e) => update(key, e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                                aria-label={label}
                                tabIndex={-1}
                              />
                              <input
                                type="text"
                                readOnly
                                placeholder="dd/mm/yyyy"
                                value={formatDateToDDMMYYYY(form[key])}
                                className={`${inputCls} pl-9 sm:pl-10 pointer-events-none`}
                                tabIndex={-1}
                                aria-hidden
                              />
                              <FiCalendar
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none text-indigo-400/90"
                                aria-hidden
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="relative">
                        <label className={labelCls}>Subscription Frequency Number</label>
                        <input
                          type="number"
                          min={0}
                          value={form.subsfrequencynumber}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || v === "-") update("subsfrequencynumber", v);
                            else {
                              const n = Number(v);
                              update("subsfrequencynumber", Number.isNaN(n) ? v : n < 0 ? "0" : v);
                            }
                          }}
                          className={inputCls}
                        />
                      </div>

                      <div className="relative">
                        <label className={labelCls}>Subscription Frequency Unit</label>
                        <select
                          value={form.subsfrequencyunit}
                          onChange={(e) => update("subsfrequencyunit", e.target.value)}
                          className={inputCls}
                        >
                          <option value="null">Select</option>
                          <option value="664160002">Months</option>
                          <option value="664160003">Years</option>
                        </select>
                      </div>

                      <div className="relative">
                        <label className={labelCls}>
                          Subscription Frequency (auto-calculated, read-only)
                        </label>
                        <LockedInput>
                          <input readOnly value={form.subsfrequency} className={readonlyCls} />
                        </LockedInput>
                      </div>

                      <div className="relative self-center">
                        <label className={labelCls}>Is it Auto Renew Contract?</label>
                        <div className="mt-2.5 flex flex-wrap gap-3 sm:gap-4">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="autorenewcontract"
                              checked={form.autorenewcontract === true}
                              onChange={() => update("autorenewcontract", true)}
                              className="h-4 w-4 shrink-0 accent-indigo-400"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="autorenewcontract"
                              checked={form.autorenewcontract === false}
                              onChange={() => update("autorenewcontract", false)}
                              className="h-4 w-4 shrink-0 accent-indigo-400"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>

                      <div className="relative">
                        <label className={labelCls}>
                          Last Due Date <span className={requiredCls}>*</span>
                        </label>
                        <div
                          className="relative cursor-pointer"
                          onClick={() => openDatePicker(lastDueDatePickerRef)}
                          onKeyDown={handleEnterOrSpace(() => openDatePicker(lastDueDatePickerRef))}
                          role="button"
                          tabIndex={0}
                          aria-label="Open calendar for Last Due Date"
                        >
                          <input
                            ref={lastDueDatePickerRef}
                            type="date"
                            value={form.lastduedate || ""}
                            onChange={(e) => update("lastduedate", e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                            aria-label="Last Due Date"
                            tabIndex={-1}
                          />
                          <input
                            type="text"
                            readOnly
                            placeholder="dd/mm/yyyy"
                            value={formatDateToDDMMYYYY(form.lastduedate)}
                            className={`${inputCls} pl-9 sm:pl-10 pointer-events-none`}
                            tabIndex={-1}
                            aria-hidden
                          />
                          <FiCalendar
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none text-indigo-400/90"
                            aria-hidden
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Next Due Date</label>
                        <LockedInput>
                          <input
                            readOnly
                            value={formatDateToDDMMYYYY(form.nextduedate) || "—"}
                            className={readonlyCls}
                          />
                        </LockedInput>
                      </div>
                    </div>
                  </section>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex-1 space-y-5 sm:space-y-6">
                  <details className={accordionCls}>
                    <summary className={accordionSummaryCls}>
                      <FiChevronRight className={accordionChevronCls} aria-hidden />
                      <div className="flex flex-col">
                        <span className={sectionTitleCls}>Vendor Details</span>
                        <span className={sectionHintCls}>Vendor identity and contacts</span>
                      </div>
                    </summary>
                    <div className={accordionPanelCls}>
                      <div className={accordionPanelInnerCls}>
                        <div className={sectionGridCls}>
                          <div>
                            <label className={labelCls}>{RIGHT_COLUMN_LABELS.vendorName}</label>
                            <LockedInput>
                              <input
                                readOnly
                                value={form.vendorName || "—"}
                                className={readonlyCls}
                              />
                            </LockedInput>
                          </div>

                          <div>
                            <label className={labelCls}>{RIGHT_COLUMN_LABELS.activityLineId}</label>
                            <LockedInput>
                              <input
                                readOnly
                                value={form.activityLineId || "—"}
                                className={readonlyCls}
                              />
                            </LockedInput>
                          </div>

                          <div>
                            <label className={labelCls}>
                              {RIGHT_COLUMN_LABELS.accountManagerName}
                            </label>
                            <LockedInput>
                              <input
                                readOnly
                                value={form.accountManagerName || "—"}
                                className={readonlyCls}
                              />
                            </LockedInput>
                          </div>

                          <div>
                            <label className={labelCls}>
                              {RIGHT_COLUMN_LABELS.accountManagerEmail}
                            </label>
                            <LockedInput>
                              <input
                                readOnly
                                type="text"
                                value={form.accountManagerEmail || "—"}
                                className={readonlyCls}
                              />
                            </LockedInput>
                          </div>

                          <div className="sm:col-span-2">
                            <label className={labelCls}>
                              {RIGHT_COLUMN_LABELS.accountManagerPhone}
                            </label>
                            <LockedInput>
                              <input
                                readOnly
                                type="text"
                                value={form.accountManagerPhone || "—"}
                                className={readonlyCls}
                              />
                            </LockedInput>
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>

                  <details className={accordionCls}>
                    <summary className={accordionSummaryCls}>
                      <FiChevronRight className={accordionChevronCls} aria-hidden />
                      <div className="flex flex-col">
                        <span className={sectionTitleCls}>Renewal & Audit</span>
                        <span className={sectionHintCls}>
                          Administrative details reviewed at renewal
                        </span>
                      </div>
                    </summary>
                    <div className={accordionPanelCls}>
                      <div className={accordionPanelInnerCls}>
                        <div className={sectionGridCls}>
                          <div className="relative sm:col-span-2" style={{ minHeight: 63 }}>
                            <label className={labelCls}>
                              {RIGHT_COLUMN_LABELS.doyourequireapart}
                            </label>
                            <div className="mt-2.5 flex flex-wrap gap-3 sm:gap-4">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="doyourequireapart"
                                  checked={form.doyourequireapart === true}
                                  onChange={() => update("doyourequireapart", true)}
                                  className="h-4 w-4 shrink-0 accent-indigo-400"
                                />
                                <span className="text-sm text-slate-700">Yes</span>
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="doyourequireapart"
                                  checked={form.doyourequireapart === false}
                                  onChange={() => update("doyourequireapart", false)}
                                  className="h-4 w-4 shrink-0 accent-indigo-400"
                                />
                                <span className="text-sm text-slate-700">No</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className={labelCls}>{RIGHT_COLUMN_LABELS.lastUpdated}</label>
                            <LockedInput>
                              <input
                                readOnly
                                value={form.lastUpdated || "—"}
                                className={readonlyCls}
                              />
                            </LockedInput>
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                  <section className={sectionCls}>
                    <div className={sectionHeaderCls}>
                      <div>
                        <h6 className={sectionTitleCls}>Financial Details</h6>
                        <p className={sectionHintCls}>Everything money-related in one place</p>
                      </div>
                    </div>
                    <div className={sectionGridCls}>
                      <div className="relative">
                        <label className={labelCls}>Subscription Contract Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={form.subscontractamount}
                          onChange={(e) => update("subscontractamount", e.target.value)}
                          onBlur={handleContractAmountBlur}
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>{RIGHT_COLUMN_LABELS.subscriptionAmount}</label>
                        <LockedInput>
                          <input
                            readOnly
                            type="text"
                            value={
                              form.subscriptionAmount != null && form.subscriptionAmount !== ""
                                ? `$ ${form.subscriptionAmount}`
                                : "$ —"
                            }
                            className={readonlyCls}
                          />
                        </LockedInput>
                      </div>

                      <div className="relative">
                        <label className={labelCls}>{RIGHT_COLUMN_LABELS.licenses}</label>
                        <input
                          type="number"
                          min={0}
                          max={100000}
                          placeholder="Enter Number of Licenses"
                          value={form.licenses}
                          onChange={(e) => update("licenses", e.target.value)}
                          onKeyDown={handleNumKeyDown}
                          className={inputCls}
                        />
                      </div>

                      <div className="relative">
                        <label className={labelCls}>{RIGHT_COLUMN_LABELS.currentusers}</label>
                        <input
                          type="number"
                          min={0}
                          max={100000}
                          placeholder="Enter Number of Current Users"
                          value={form.currentusers}
                          onChange={(e) => update("currentusers", e.target.value)}
                          onKeyDown={handleNumKeyDown}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="shrink-0 px-5 sm:px-7 py-4 sm:py-5 border-t border-slate-200/70 bg-gradient-to-r from-slate-50/90 via-indigo-50/30 to-slate-50/90 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              className="w-full sm:w-auto min-h-11 px-6 rounded-xl border border-slate-200/90 bg-white text-sm font-medium text-slate-600 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="w-full sm:w-auto min-h-11 px-7 rounded-xl border border-indigo-300/70 bg-indigo-50/60 text-sm font-semibold text-indigo-800 shadow-sm transition-[background-color,border-color] duration-200 hover:bg-indigo-100/80 hover:border-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-55"
              onClick={() => saveSubscription({ closeAfterSave: false, showSavedAlert: true })}
              disabled={actionDisabled}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="w-full sm:w-auto min-h-11 px-8 rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-400/25 transition-[filter,opacity] duration-200 hover:from-indigo-500 hover:to-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
              onClick={() => saveSubscription({ closeAfterSave: true })}
              disabled={actionDisabled}
            >
              {isSaving ? "Saving..." : "Save and Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
