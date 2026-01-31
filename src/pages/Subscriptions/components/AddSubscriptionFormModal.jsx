import { useState, useEffect, useCallback, useRef } from "react";
import { FiCalendar, FiLock } from "react-icons/fi";
import { addSubscription, checkSubscriptionExistance } from "../../../lib/utils/subscriptions";

const DESC_MAX = 2000;

const RIGHT_COLUMN_LABELS = {
  vendorProfile: "Vendor Profile",
  activityLineId: "Activity Line ID",
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
    yiic_subscriptioncontractamount: form.subscontractamount ? Number(form.subscontractamount) : 0,
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
      ? Number(form.subsfrequencynumber)
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

export default function AddSubscriptionFormModal({
  open,
  onClose,
  onSuccess,
  departments,
  selectedVendor,
}) {
  const [form, setForm] = useState(defaultFormState(selectedVendor));
  const [isSaving, setIsSaving] = useState(false);
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  const lastDueDatePickerRef = useRef(null);

  const openDatePicker = (ref) => {
    if (ref?.current) {
      ref.current.focus();
      if (typeof ref.current.showPicker === "function") {
        ref.current.showPicker();
      }
    }
  };

  useEffect(() => {
    if (!open) {
      setForm(defaultFormState(selectedVendor));
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
    setForm((prev) => ({
      ...prev,
      subscontractamount: formatContractAmount(prev.subscontractamount),
    }));
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

  const handleSave = useCallback(async () => {
    if (
      !form.vendorProfile?.trim() ||
      !form.subsname?.trim() ||
      !form.lastduedate?.trim() ||
      !form.departmentId?.trim()
    ) {
      return;
    }
    const payload = buildAddPayload(form);
    setIsSaving(true);
    try {
      const result = await checkSubscriptionExistance(
        payload.yiic_subscriptionname,
        form.activityLineId
      );
      const value = result?.value;
      const hasDuplicate = Array.isArray(value) && value.length > 0;
      if (hasDuplicate) {
        alert("Subscription Exist");
        return;
      }
      await addSubscription(payload);
      alert("Subscription added successfully");
      onClose?.();
      onSuccess?.();
    } catch (err) {
      console.error("Add subscription failed:", err);
      alert("Failed to add subscription");
    } finally {
      setIsSaving(false);
    }
  }, [form, onClose, onSuccess]);

  if (!open) return null;

  const descriptionCount = form.description.length;

  const inputCls =
    "h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]";
  const readonlyCls =
    "h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 pl-8 sm:pl-[34px] bg-gray-100 cursor-not-allowed";
  const lockIcon = (
    <i className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400" />
  );

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex justify-center items-center z-[80] p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-lg sm:rounded-[14px] w-full max-w-[1200px] flex flex-col overflow-hidden">
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="p-3 sm:p-4 md:p-[18px_28px] border-b border-gray-200 flex justify-between items-center gap-3 sm:gap-4">
            <h5 className="text-base sm:text-lg font-semibold text-slate-900 m-0 flex-1">
              Add Subscription
            </h5>
            <button
              type="button"
              className="border-none bg-transparent text-2xl sm:text-[28px] cursor-pointer text-gray-600 p-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center leading-none rounded-md transition-all duration-200 flex-shrink-0 hover:bg-gray-100 hover:text-[#1d225d]"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {/* BODY - identical to EditSubscriptionModal */}
          <div className="p-3 sm:p-4 md:p-[22px_28px] overflow-y-auto flex-1 max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-7">
                {/* LEFT COLUMN */}
                <div className="flex-1 lg:border-r lg:border-gray-200 lg:pr-4 lg:pr-7">
                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Subscription Activity ID
                    </label>
                    <input readOnly value={form.yiic_activityid} className={readonlyCls} />
                  </div>

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Subscription Name <span className="text-red-600 ml-1">*</span>
                    </label>
                    <input
                      maxLength={87}
                      value={form.subsname}
                      onChange={(e) => update("subsname", e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Subscription Contract Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.subscontractamount}
                      onChange={(e) => update("subscontractamount", e.target.value)}
                      onBlur={handleContractAmountBlur}
                      className={inputCls}
                    />
                  </div>

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Description
                    </label>
                    <textarea
                      maxLength={DESC_MAX}
                      rows={4}
                      value={form.description}
                      onChange={handleDescriptionChange}
                      className="h-auto resize-none py-1.5 px-2 sm:px-2.5 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                    />
                    <small className="text-[10px] sm:text-xs text-gray-500 flex justify-end">
                      <span>{descriptionCount}</span>/2000
                    </small>
                  </div>

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
                    <div className="mb-3.5 relative" key={key}>
                      <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                        {label}
                      </label>
                      {locked ? (
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            placeholder="dd/mm/yyyy"
                            value={formatDateToDDMMYYYY(form[key])}
                            className={`${inputCls} pl-8 sm:pl-10 bg-gray-50 cursor-not-allowed`}
                            aria-label={label}
                          />
                          <FiLock
                            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none text-gray-500"
                            aria-hidden
                          />
                        </div>
                      ) : (
                        <div
                          className="relative cursor-pointer"
                          onClick={() => openDatePicker(pickerRef)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openDatePicker(pickerRef);
                            }
                          }}
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
                            className={`${inputCls} pl-8 sm:pl-10 pointer-events-none`}
                            tabIndex={-1}
                            aria-hidden
                          />
                          <FiCalendar
                            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none text-gray-500"
                            aria-hidden
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Subscription Frequency Number
                    </label>
                    <input
                      type="number"
                      value={form.subsfrequencynumber}
                      onChange={(e) => update("subsfrequencynumber", e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Subscription Frequency Unit
                    </label>
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

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Subscription Frequency
                    </label>
                    <input readOnly value={form.subsfrequency} className={readonlyCls} />
                  </div>

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Is it Auto Renew Contract?
                    </label>
                    <div className="mt-2.5 flex flex-wrap gap-3 sm:gap-4">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="autorenewcontract"
                          checked={form.autorenewcontract === true}
                          onChange={() => update("autorenewcontract", true)}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        <span className="text-xs sm:text-sm">Yes</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="autorenewcontract"
                          checked={form.autorenewcontract === false}
                          onChange={() => update("autorenewcontract", false)}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        <span className="text-xs sm:text-sm">No</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Last Due Date <span className="text-red-500">*</span>
                    </label>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => openDatePicker(lastDueDatePickerRef)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDatePicker(lastDueDatePickerRef);
                        }
                      }}
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
                        className={`${inputCls} pl-8 sm:pl-10 pointer-events-none`}
                        tabIndex={-1}
                        aria-hidden
                      />
                      <FiCalendar
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none text-gray-500"
                        aria-hidden
                      />
                    </div>
                  </div>

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Next Due Date
                    </label>
                    <input
                      readOnly
                      value={formatDateToDDMMYYYY(form.nextduedate) || "—"}
                      className={readonlyCls}
                    />
                  </div>

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Activity Status
                    </label>
                    <input readOnly value={form.activityStatus || "—"} className={readonlyCls} />
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex-1 lg:pl-4 xl:pl-7">
                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.vendorProfile}{" "}
                      <span className="text-red-600 ml-1">*</span>
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

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      Subscription Department <span className="text-red-600 ml-1">*</span>
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

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.activityLineId}
                    </label>
                    <input readOnly value={"—"} className={readonlyCls} />
                  </div>

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.vendorName}
                    </label>
                    <input readOnly value={form.vendorName || ""} className={readonlyCls} />
                  </div>

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.subscriptionAmount}
                    </label>
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
                  </div>

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.lastUpdated}
                    </label>
                    <input readOnly value={form.lastUpdated || "—"} className={readonlyCls} />
                  </div>

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.account}
                    </label>
                    <input readOnly value={form.account || "—"} className={readonlyCls} />
                  </div>

                  <div className="mb-3.5 relative" style={{ minHeight: 63 }}>
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.doyourequireapart}
                    </label>
                    <div className="mt-2.5 flex flex-wrap gap-3 sm:gap-4">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="doyourequireapart"
                          checked={form.doyourequireapart === true}
                          onChange={() => update("doyourequireapart", true)}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        <span className="text-xs sm:text-sm">Yes</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="doyourequireapart"
                          checked={form.doyourequireapart === false}
                          onChange={() => update("doyourequireapart", false)}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        <span className="text-xs sm:text-sm">No</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.licenses}
                    </label>
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

                  <div className="mb-3.5 relative">
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.currentusers}
                    </label>
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

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.accountManagerName}
                    </label>
                    <input
                      readOnly
                      value={form.accountManagerName || "—"}
                      className={readonlyCls}
                    />
                  </div>

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.accountManagerEmail}
                    </label>
                    <input
                      readOnly
                      type="text"
                      value={form.accountManagerEmail || "—"}
                      className={readonlyCls}
                    />
                  </div>

                  <div className="mb-3.5 relative">
                    {lockIcon}
                    <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                      {RIGHT_COLUMN_LABELS.accountManagerPhone}
                    </label>
                    <input
                      readOnly
                      type="text"
                      value={form.accountManagerPhone || "—"}
                      className={readonlyCls}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="p-3 sm:p-4 md:p-[18px_28px] border-t border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              className="w-full sm:w-auto px-6 h-10 sm:h-[42px] rounded-lg bg-white border border-gray-300 text-sm sm:text-base font-medium whitespace-nowrap hover:bg-gray-50"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="w-full sm:w-auto px-7 h-10 sm:h-[42px] rounded-lg bg-[#1b1f6a] text-white text-sm sm:text-base font-semibold whitespace-nowrap hover:bg-[#15195a] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={
                isSaving ||
                !form.vendorProfile?.trim() ||
                !form.subsname?.trim() ||
                !form.lastduedate?.trim() ||
                !form.departmentId?.trim()
              }
            >
              {isSaving ? "Saving..." : "Add Subscription"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
