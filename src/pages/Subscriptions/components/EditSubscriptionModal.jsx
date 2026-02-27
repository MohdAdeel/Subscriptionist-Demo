import { FiCalendar } from "react-icons/fi";
import { useState, useEffect, useCallback, useRef } from "react";
import { InputSkeleton } from "../../../components/SkeletonLoader";

const UNIT_MAP = { 0: "Active", 1: "InActive", 2: "Canceled", 3: "Scheduled" };
const DESC_MAX = 2000;

const RIGHT_COLUMN_LABELS = {
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

/** Format date (yyyy-mm-dd or ISO) for display as dd/mm/yyyy */
function formatDateToDDMMYYYY(val) {
  if (val == null || val === "") return "";
  const s = String(val);
  const ymd = s.length >= 10 ? s.substring(0, 10) : s;
  const parts = ymd.split("-");
  if (parts.length !== 3) return val;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

/** Parse dd/mm/yyyy to yyyy-mm-dd for form state / API */
function parseDDMMYYYYToYYYYMMDD(val) {
  if (val == null || val === "") return "";
  const parts = String(val).trim().split("/");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  const day = d.padStart(2, "0");
  const month = m.padStart(2, "0");
  const year = y.trim();
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return "";
  const num = parseInt(year, 10) * 10000 + parseInt(month, 10) * 100 + parseInt(day, 10);
  if (Number.isNaN(num)) return "";
  return `${year}-${month}-${day}`;
}

function defaultFormState(editFormData) {
  return {
    ActivityAutoNumber: "",
    activityLineId: editFormData?.activityid ?? "",
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
    department: "",
    departmentName: "",
    account: "",
  };
}

/** Convert yyyy-mm-dd to ISO date string for server if needed */
function toISODateString(val) {
  if (val == null || val === "") return val;
  const s = String(val).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10) + "T00:00:00.000Z";
  }
  return s;
}

/** Build payload for server with exact property names the server accepts. Values from form. */
function buildSavePayload(form, editFormData) {
  const subsfrequencyunit =
    form.subsfrequencyunit === "null" || form.subsfrequencyunit === ""
      ? null
      : Number(form.subsfrequencyunit);
  return {
    ActivityAutoNumber: form.ActivityAutoNumber ?? "",
    activityLineId: editFormData[0]?.activityid ?? "",
    subsname: form.subsname ?? "",
    description: form.description ?? "",
    subsstartdate: toISODateString(form.subsstartdate) ?? "",
    subsenddate: toISODateString(form.subsenddate) ?? "",
    subsfrequencynumber: form.subsfrequencynumber ?? "",
    subsfrequencyunit: subsfrequencyunit ?? null,
    autorenewcontract: form.autorenewcontract ?? null,
    licenses: form.licenses === "" || form.licenses == null ? null : form.licenses,
    currentusers: form.currentusers === "" || form.currentusers == null ? null : form.currentusers,
    doyourequireapart: form.doyourequireapart ?? null,
    subscontractamount: form.subscontractamount ?? "",
    subsfrequency: form.subsfrequency ?? "",
    lastduedate: toISODateString(form.lastduedate) ?? "",
    nextduedate: toISODateString(form.nextduedate) ?? "",
    department: form.departmentId,
    departmentName:
      form.departmentName ||
      editFormData[0]?.yiic_SubscriptionDepartment_yiic_subscriptionsactivityline?.yiic_name,
  };
}

function mapEditFormDataToState(data) {
  if (!data) return defaultFormState();
  const al = data[0];
  const sub = al?.yiic_Subscriptionactivity_yiic_subscriptionsactivityline || {};
  const dept = al?.department || {};
  const subscriptionFrequencyRaw = al.yiic_subscriptionfrequency ?? "";
  const frequencyNumberFromApi =
    al.yiic_subscriptionfrequencynumber != null ? String(al.yiic_subscriptionfrequencynumber) : "";
  const frequencyUnitFromApi = al.yiic_subscriptionfrequencyunit ?? "null";
  // Normalize unit to string (API may return number e.g. 664160002)
  const frequencyUnitRaw =
    frequencyUnitFromApi !== "null" && frequencyUnitFromApi != null
      ? String(frequencyUnitFromApi)
      : null;
  // If backend sent subsfrequency (e.g. "1 Year", "2 Months", "100 Monthly") but number/unit missing, parse it
  const parsed = parseSubscriptionFrequency(subscriptionFrequencyRaw);
  const subsfrequencynumber =
    frequencyNumberFromApi !== "" ? frequencyNumberFromApi : parsed.number;
  const subsfrequencyunit = frequencyUnitRaw !== null ? frequencyUnitRaw : parsed.unit;
  const displayFreq =
    subsfrequencynumber && subsfrequencyunit !== "null"
      ? formatSubscriptionFrequencyDisplay(subsfrequencynumber, subsfrequencyunit)
      : subscriptionFrequencyRaw;
  return {
    ActivityAutoNumber: sub.yiic_activityid ?? "",
    activityLineId: al.yiic_activityid ?? "",
    subsname: al.yiic_subscriptionname ?? "",
    subscontractamount:
      al.yiic_subscriptioncontractamount != null ? String(al.yiic_subscriptioncontractamount) : "",
    description: al.description ?? "",
    subsstartdate: toDateInputValue(al.yiic_subscriptionstartdate),
    subsenddate: toDateInputValue(al.yiic_subscriptionenddate),
    lastduedate: toDateInputValue(al.yiic_lastduedate),
    nextduedate: toDateInputValue(al.yiic_nextduedate),
    subsfrequencynumber,
    subsfrequencyunit,
    subsfrequency: displayFreq || subscriptionFrequencyRaw || "",
    activityStatus: UNIT_MAP[al.statecode] ?? "",
    licenses: al.yiic_nooflicenses != null ? String(al.yiic_nooflicenses) : "",
    currentusers: al.yiic_noofcurrentusers != null ? String(al.yiic_noofcurrentusers) : "",
    doyourequireapart:
      al.yiic_doyourequireapartnerforrenewal === true
        ? true
        : al.yiic_doyourequireapartnerforrenewal === false
          ? false
          : null,
    autorenewcontract:
      al.yiic_isitautorenewcontract === true
        ? true
        : al.yiic_isitautorenewcontract === false
          ? false
          : null,
    departmentId:
      al.yiic_SubscriptionDepartment_yiic_subscriptionsactivityline?.yiic_departmentid ??
      al.departmentId ??
      "",
    departmentName: dept.yiic_name ?? "",
    vendorName: sub.yiic_vendorname ?? "",
    account:
      sub?.account?.name ??
      al?.yiic_Subscriptionactivity_yiic_subscriptionsactivityline?.account?.name,
    subscriptionAmount:
      sub.yiic_subscriptionamount != null ? String(sub.yiic_subscriptionamount) : "",
    lastUpdated: toDateInputValue(al.modifiedon),
    accountManagerName: sub.yiic_accountmanagername ?? "Not Available",
    accountManagerEmail: sub.yiic_accountmanageremail ?? "Not Available",
    accountManagerPhone: sub.yiic_accountmanagerphone ?? "Not Available",
  };
}

function formatContractAmount(val) {
  const n = parseFloat(val);
  if (Number.isNaN(n) || val === "" || val == null) return "";
  return n.toFixed(2);
}

/** Parse subsfrequency string from backend (e.g. "1 Year", "2 Months", "100 Monthly", "1 Yearly") into number and unit code */
function parseSubscriptionFrequency(str) {
  if (str == null || typeof str !== "string" || !str.trim()) return { number: "", unit: "null" };
  const s = str.trim();
  const match = s.match(/^(\d+)\s*(monthly|yearly|month|year|months|years)$/i);
  if (!match) return { number: "", unit: "null" };
  const num = match[1];
  const unitWord = (match[2] || "").toLowerCase();
  const isMonths = unitWord === "month" || unitWord === "months" || unitWord === "monthly";
  const unit = isMonths ? "664160002" : "664160003"; // Months : Years
  return { number: num, unit };
}

/** Build display string for Subscription Frequency (singular when 1: "1 Year", "1 Month") */
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

export default function EditSubscriptionModal({
  open,
  onClose,
  editFormData,
  departments,
  onSave,
  isSaving = false,
  isLoadingForm = false,
}) {
  const [form, setForm] = useState(defaultFormState());
  const [localSubmitting, setLocalSubmitting] = useState(false);
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

  // Clear form when modal closes
  useEffect(() => {
    if (!open) {
      setForm(defaultFormState(editFormData));
    }
  }, [open]);

  // Populate form when editFormData is available
  useEffect(() => {
    if (open && editFormData) {
      setForm(mapEditFormDataToState(editFormData));
    }
  }, [open, editFormData]);

  // Sync Subscription Frequency display when number or unit changes (use same singular/plural as backend)
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

  const handleSave = useCallback(() => {
    setLocalSubmitting(true);
    onSave?.(buildSavePayload(form, editFormData));
  }, [form, editFormData, onSave]);

  // Clear local submitting when parent reports save finished (e.g. isSaving went false) or modal closed
  useEffect(() => {
    if (!isSaving) setLocalSubmitting(false);
  }, [isSaving]);
  useEffect(() => {
    if (!open) setLocalSubmitting(false);
  }, [open]);

  if (!open) return null;

  const isLoading = (open && editFormData == null) || isLoadingForm;
  const descriptionCount = form.description.length;

  const inputCls =
    "h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]";
  const readonlyCls =
    "h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 pl-8 sm:pl-[34px] bg-gray-100 cursor-not-allowed";
  const lockIcon = (
    <i className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400" />
  );

  return (
    <div className="fixed top-0 right-0 bottom-0 left-[245px] z-[1000] bg-black/50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-lg sm:rounded-[14px] w-full max-w-[1200px] flex flex-col overflow-hidden my-auto max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] min-h-0 shadow-xl">
        <div className="flex flex-col h-full min-h-0">
          {/* HEADER */}
          <div className="p-3 sm:p-4 md:p-[18px_28px] border-b border-gray-200 flex justify-between items-center gap-3 sm:gap-4">
            <h5 className="text-base sm:text-lg font-semibold text-slate-900 m-0 flex-1">
              Edit Subscription
            </h5>
            <button
              type="button"
              className="group p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* BODY */}
          <div className="p-3 sm:p-4 md:p-[22px_28px] overflow-y-auto flex-1 max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
            {isLoading ? (
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-7 animate-pulse">
                <div className="flex-1 lg:border-r lg:border-gray-200 lg:pr-4 lg:pr-7 space-y-3.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <InputSkeleton key={i} className="mb-0" />
                  ))}
                </div>
                <div className="flex-1 lg:pl-4 xl:pl-7 space-y-3.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <InputSkeleton key={i} className="mb-0" />
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-7">
                  {/* LEFT COLUMN */}
                  <div className="flex-1 lg:border-r lg:border-gray-200 lg:pr-4 lg:pr-7">
                    <div className="mb-3.5 relative">
                      {lockIcon}
                      <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                        Subscription Activity ID
                      </label>
                      <input readOnly value={form.ActivityAutoNumber} className={readonlyCls} />
                    </div>

                    <div className="mb-3.5 relative">
                      <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                        Subscription Name
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
                        disabled: false,
                        pickerRef: startDatePickerRef,
                      },
                      {
                        key: "subsenddate",
                        label: "Subscription End Date",
                        disabled: false,
                        pickerRef: endDatePickerRef,
                      },
                    ].map(({ key, label, disabled, pickerRef }) => (
                      <div className="mb-3.5 relative" key={key}>
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          {label}
                        </label>
                        <div
                          className="relative cursor-pointer"
                          onClick={() => !disabled && openDatePicker(pickerRef)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (!disabled) openDatePicker(pickerRef);
                            }
                          }}
                          role="button"
                          tabIndex={disabled ? -1 : 0}
                          aria-label={`Open calendar for ${label}`}
                        >
                          <input
                            ref={pickerRef}
                            type="date"
                            value={form[key] || ""}
                            onChange={(e) => update(key, e.target.value)}
                            disabled={disabled}
                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none disabled:pointer-events-none"
                            aria-label={label}
                            tabIndex={-1}
                          />
                          <input
                            type="text"
                            readOnly
                            placeholder="dd/mm/yyyy"
                            value={formatDateToDDMMYYYY(form[key])}
                            className={`${inputCls} pl-8 sm:pl-10 pointer-events-none disabled:opacity-60`}
                            tabIndex={-1}
                            aria-hidden
                          />
                          <FiCalendar
                            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none text-gray-500"
                            aria-hidden
                          />
                        </div>
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
                            readOnly
                            className="bg-gray-100 cursor-not-allowed w-3.5 h-3.5 sm:w-4 sm:h-4"
                          />
                          <span className="text-xs sm:text-sm">Yes</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="autorenewcontract"
                            checked={form.autorenewcontract === false}
                            readOnly
                            className="bg-gray-100 cursor-not-allowed w-3.5 h-3.5 sm:w-4 sm:h-4"
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
                        value={formatDateToDDMMYYYY(form.nextduedate)}
                        className={readonlyCls}
                      />
                    </div>

                    <div className="mb-3.5 relative">
                      {lockIcon}
                      <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                        Activity Status
                      </label>
                      <input readOnly value={form.activityStatus} className={readonlyCls} />
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="flex-1 lg:pl-4 xl:pl-7">
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

                    {[
                      "activityLineId",
                      "vendorName",
                      "subscriptionAmount",
                      "lastUpdated",
                      "account",
                      "doyourequireapart",
                      "licenses",
                      "currentusers",
                      "accountManagerName",
                      "accountManagerEmail",
                      "accountManagerPhone",
                    ].map((key) =>
                      key === "doyourequireapart" ? (
                        <div className="mb-3.5 relative" key={key} style={{ minHeight: 63 }}>
                          <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                            {RIGHT_COLUMN_LABELS[key]}
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
                      ) : key === "licenses" ? (
                        <div className="mb-3.5 relative" key={key}>
                          <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                            {RIGHT_COLUMN_LABELS[key]}
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
                      ) : key === "currentusers" ? (
                        <div className="mb-3.5 relative" key={key}>
                          <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                            {RIGHT_COLUMN_LABELS[key]}
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
                      ) : key === "lastUpdated" ? (
                        <div className="mb-3.5 relative" key={key}>
                          {lockIcon}
                          <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                            {RIGHT_COLUMN_LABELS[key] ?? key}
                          </label>
                          <input
                            readOnly
                            value={formatDateToDDMMYYYY(form[key])}
                            className={readonlyCls}
                          />
                        </div>
                      ) : (
                        <div className="mb-3.5 relative" key={key}>
                          {lockIcon}
                          <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                            {RIGHT_COLUMN_LABELS[key] ?? key}
                          </label>
                          <input readOnly value={form[key]} className={readonlyCls} />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-3 sm:p-4 md:p-[18px_28px] border-t border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0">
            {!isLoading && (
              <>
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
                  disabled={isSaving || localSubmitting}
                >
                  {isSaving || localSubmitting ? "Saving..." : "Save changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
