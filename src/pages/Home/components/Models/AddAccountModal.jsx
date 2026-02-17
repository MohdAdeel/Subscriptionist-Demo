import { createPortal } from "react-dom";
import {
  addAccount,
  updateAccount,
  activateAccount,
  getAccountFieldChoices,
} from "../../../../lib/api/Account/Account";
import { useState, useEffect, useRef } from "react";
import { usePopup } from "../../../../components/Popup";
import { FiX, FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";

/** Searchable dropdown for options with { attributevalue, value }. Displays value, stores attributevalue. Menu renders in a portal so it is not clipped by modal overflow. */
function SearchableDropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  hasError,
  onOpenChange,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((o) => o.attributevalue === value);
  const displayLabel = selectedOption ? selectedOption.value : "";

  const filtered = options.filter((o) =>
    (o.value ?? "").toLowerCase().includes((searchTerm ?? "").toLowerCase())
  );

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) {
        setIsOpen(false);
        setSearchTerm("");
        onOpenChange?.(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  const handleSelect = (item) => {
    onChange(item.attributevalue);
    setIsOpen(false);
    setSearchTerm("");
    onOpenChange?.(false);
  };

  const menuContent = isOpen && (
    <div
      ref={menuRef}
      className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
      style={{
        position: "fixed",
        top: menuPosition.top,
        left: menuPosition.left,
        width: menuPosition.width,
        zIndex: 99999,
        maxHeight: `min(20rem, calc(100vh - ${menuPosition.top}px - 1rem))`,
      }}
    >
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#3730A3]/40 focus:border-[#3730A3] outline-none"
          />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const isSelected = value === item.attributevalue;
            return (
              <button
                key={item.attributevalue}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  isSelected ? "bg-[#3730A3]/10 text-[#3730A3] font-medium" : "text-gray-700"
                }`}
              >
                {item.value}
              </button>
            );
          })
        ) : (
          <div className="px-3 py-6 text-center text-sm text-gray-500">No results found</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          onOpenChange?.(next);
        }}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left bg-white focus:outline-none focus:ring-1 transition-all ${
          hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 hover:border-gray-400 focus:border-[#3730A3] focus:ring-[#3730A3]"
        }`}
      >
        <span className={displayLabel ? "text-gray-900" : "text-gray-400"}>
          {displayLabel || placeholder}
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {typeof document !== "undefined" && createPortal(menuContent, document.body)}
    </div>
  );
}

/** Map API contact/address response to Draft form fields */
function mapInitialDataToForm(data) {
  if (!data || typeof data !== "object") return null;
  return {
    accountName: data.companyname ?? data.yiic_companyname ?? data.company ?? "",
    phone: data.companyphonenumber ?? "",
    fax: data.companyFaxNumber ?? "",
    organizationEmail: data.companyEmail ?? "",
    street1: data.address2_line1 ?? "",
    street2: data.address2_line2 ?? "",
    street3: data.address2_line3 ?? "",
    city: data.address2_city ?? "",
    stateProvince: data.address2_stateorprovince ?? "",
    zipPostalCode: data.address2_postalcode ?? "",
    countryRegion: data.address2_country ?? "",
  };
}

const STAGES = ["Draft", "Active"];

const FIELD = (name, label, placeholder, required = false) => ({
  name,
  label,
  placeholder,
  required,
});

const LEFT_FIELDS = [
  FIELD("accountName", "Account Name", "Enter Account Name", true),
  FIELD("phone", "Phone", "Enter Phone Number"),
  FIELD("fax", "Fax", "Enter Fax Number"),
  FIELD("organizationEmail", "Organization Email", "Enter Email"),
  FIELD("street1", "Address 1: Street 1", "Enter Street 1", true),
  FIELD("street2", "Address 1: Street 2", "Enter Street 2"),
];

const RIGHT_FIELDS = [
  FIELD("street3", "Address 1: Street 3", "Enter Street 3"),
  FIELD("city", "Address 1: City", "Enter City", true),
  FIELD("stateProvince", "Address 1: State/Province", "Enter State/Province", true),
  FIELD("zipPostalCode", "Address 1: ZIP/Postal Code", "Enter ZIP/Postal Code", true),
  FIELD("countryRegion", "Address 1: Country/Region", "Enter Country/Region", true),
];

const DRAFT_REQUIRED_FIELDS = [
  ...LEFT_FIELDS.filter((f) => f.required),
  ...RIGHT_FIELDS.filter((f) => f.required),
].map((f) => f.name);

const ACTIVE_FIELDS = [
  FIELD("website", "Website", "Enter Website", true),
  FIELD("employeeSize", "Employee Size", "Select employee size", true),
  FIELD("countryOfCorporation", "Country of Corporation", "Select country", true),
  FIELD("industry", "Industry", "Select industry", true),
];

const EMPTY_FIELD_CHOICES = { employeeSize: [], country: [], industry: [] };

const EMPTY_DRAFT_FORM = {
  accountName: "",
  phone: "",
  fax: "",
  organizationEmail: "",
  street1: "",
  street2: "",
  street3: "",
  city: "",
  stateProvince: "",
  zipPostalCode: "",
  countryRegion: "",
};

const buildDraftBodyFromForm = (formData, contactId) => ({
  name: (formData.accountName ?? "").trim(),
  contactId: contactId ?? "",
  telephone1: (formData.phone ?? "").trim(),
  fax: (formData.fax ?? "").trim(),
  emailaddress1: (formData.organizationEmail ?? "").trim(),
  address1_line1: (formData.street1 ?? "").trim(),
  address1_line2: (formData.street2 ?? "").trim(),
  address1_line3: (formData.street3 ?? "").trim(),
  address1_city: (formData.city ?? "").trim(),
  address1_stateorprovince: (formData.stateProvince ?? "").trim(),
  address1_postalcode: (formData.zipPostalCode ?? "").trim(),
  address1_country: (formData.countryRegion ?? "").trim(),
  yiic_accountstatusreason: 664160000,
});

const isDraftBodyEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function AddAccountModal({ open = false, onClose, initialData }) {
  const { showSuccess, showError } = usePopup();
  const [errors, setErrors] = useState({});
  const [stageIndex, setStageIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMovingToNextStage, setIsMovingToNextStage] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [fieldChoices, setFieldChoices] = useState(EMPTY_FIELD_CHOICES);
  const [form, setForm] = useState(EMPTY_DRAFT_FORM);
  const [activeForm, setActiveForm] = useState({
    website: "",
    employeeSize: "",
    countryOfCorporation: "",
    industry: "",
  });

  useEffect(() => {
    if (open && initialData) {
      const mapped = mapInitialDataToForm(initialData);
      if (mapped) setForm(mapped);
    }
  }, [open, initialData]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleActiveChange = (name, value) => {
    setActiveForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateDraft = () => {
    const next = {};
    for (const key of DRAFT_REQUIRED_FIELDS) {
      const value = (form[key] ?? "").toString().trim();
      if (!value) next[key] = "This field is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleClose = () => {
    setStageIndex(0);
    setErrors({});
    setForm(EMPTY_DRAFT_FORM);
    setActiveForm({
      website: "",
      employeeSize: "",
      countryOfCorporation: "",
      industry: "",
    });
    setFieldChoices(EMPTY_FIELD_CHOICES);
    setIsMovingToNextStage(false);
    setIsActivating(false);
    setIsDropdownOpen(false);
    onClose?.();
  };

  const buildDraftBody = () => buildDraftBodyFromForm(form, initialData?.contactId);

  const getInitialFormForComparison = () =>
    initialData ? (mapInitialDataToForm(initialData) ?? EMPTY_DRAFT_FORM) : EMPTY_DRAFT_FORM;

  const handleNextStage = async () => {
    if (stageIndex === 0) {
      if (!validateDraft()) return;
      setErrors({});
      setIsMovingToNextStage(true);
      try {
        const body = buildDraftBody();
        const initialBody = buildDraftBodyFromForm(
          getInitialFormForComparison(),
          initialData?.contactId
        );
        const hasChanges = !isDraftBodyEqual(body, initialBody);

        if (hasChanges) {
          if (initialData) {
            await updateAccount(body); // Send Account Id here
          } else {
            await addAccount(body);
          }
        }

        const data = await getAccountFieldChoices();
        setFieldChoices({
          employeeSize: Array.isArray(data?.employeeSize) ? data.employeeSize : [],
          country: Array.isArray(data?.country) ? data.country : [],
          industry: Array.isArray(data?.industry) ? data.industry : [],
        });
        setStageIndex(1);
      } catch (e) {
        console.error("addAccount or getAccountFieldChoices failed", e);
        setFieldChoices(EMPTY_FIELD_CHOICES);
      } finally {
        setIsMovingToNextStage(false);
      }
    } else {
      handleClose();
    }
  };

  const handleCancelActive = () => {
    setStageIndex(0);
    setErrors({});
  };

  const validateActive = () => {
    const next = {};
    if (!(activeForm.website ?? "").toString().trim()) next.website = "This field is required.";
    if (!(activeForm.employeeSize ?? "").toString().trim())
      next.employeeSize = "This field is required.";
    if (!(activeForm.countryOfCorporation ?? "").toString().trim())
      next.countryOfCorporation = "This field is required.";
    if (!(activeForm.industry ?? "").toString().trim()) next.industry = "This field is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildActivateBody = () => ({
    websiteurl: (activeForm.website ?? "").trim(),
    yiic_employeesize:
      activeForm.employeeSize != null && activeForm.employeeSize !== ""
        ? Number(activeForm.employeeSize)
        : undefined,
    yiic_industry:
      activeForm.industry != null && activeForm.industry !== ""
        ? Number(activeForm.industry)
        : undefined,
    yiic_countryofincorporation:
      activeForm.countryOfCorporation != null && activeForm.countryOfCorporation !== ""
        ? String(activeForm.countryOfCorporation)
        : undefined,
  });

  const handleActivateAccount = async () => {
    if (!validateActive()) return;
    setIsActivating(true);
    try {
      const body = buildActivateBody();
      await activateAccount(body);
      showSuccess("Account activated successfully.");
      handleClose();
    } catch (e) {
      console.error("activateAccount failed", e);
      showError(e?.message ?? "Failed to activate account. Please try again.");
    } finally {
      setIsActivating(false);
    }
  };

  if (!open) return null;

  const isActiveStage = stageIndex === 1;

  const renderInput = (field) => {
    const hasError = errors[field.name];
    return (
      <div key={field.name} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type="text"
          value={form[field.name] ?? ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
            hasError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-[#3730A3] focus:ring-[#3730A3]"
          }`}
        />
        {hasError && <p className="text-xs text-red-500">{errors[field.name]}</p>}
      </div>
    );
  };

  const renderActiveField = (field) => {
    const hasError = errors[field.name];
    const value = activeForm[field.name] ?? "";
    let input;
    if (field.name === "website") {
      input = (
        <input
          type="text"
          value={value}
          onChange={(e) => handleActiveChange("website", e.target.value)}
          placeholder={field.placeholder}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
            hasError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-[#3730A3] focus:ring-[#3730A3]"
          }`}
        />
      );
    } else if (field.name === "employeeSize") {
      input = (
        <SearchableDropdown
          options={fieldChoices.employeeSize ?? []}
          value={value}
          onChange={(v) => handleActiveChange("employeeSize", v)}
          placeholder="Select employee size"
          searchPlaceholder="Search employee size..."
          hasError={hasError}
          onOpenChange={setIsDropdownOpen}
        />
      );
    } else if (field.name === "countryOfCorporation") {
      input = (
        <SearchableDropdown
          options={fieldChoices.country ?? []}
          value={value}
          onChange={(v) => handleActiveChange("countryOfCorporation", v)}
          placeholder="Select country"
          searchPlaceholder="Search country..."
          hasError={hasError}
          onOpenChange={setIsDropdownOpen}
        />
      );
    } else {
      input = (
        <SearchableDropdown
          options={fieldChoices.industry ?? []}
          value={value}
          onChange={(v) => handleActiveChange("industry", v)}
          placeholder="Select industry"
          searchPlaceholder="Search industry..."
          hasError={hasError}
          onOpenChange={setIsDropdownOpen}
        />
      );
    }
    return (
      <div key={field.name} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {input}
        {hasError && <p className="text-xs text-red-500">{errors[field.name]}</p>}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-3xl min-w-[min(100%,36rem)] min-h-[32rem] max-h-[90vh] flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {isActiveStage ? "Account Activation" : "Add Account"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 px-6 pt-4 flex-shrink-0">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-2">
              {i < stageIndex ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              ) : (
                <div
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    i === stageIndex ? "border-[#3730A3] bg-[#3730A3]" : "border-gray-300 bg-white"
                  }`}
                />
              )}
              <span
                className={`text-sm font-medium ${
                  i <= stageIndex ? "text-[#3730A3]" : "text-gray-400"
                }`}
              >
                {stage}
              </span>
              {i < STAGES.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${i < stageIndex ? "bg-[#3730A3]" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div
          className={`flex-1 min-h-[22rem] flex flex-col px-6 py-6 ${isDropdownOpen ? "overflow-hidden" : "overflow-auto"}`}
        >
          {isActiveStage ? (
            <div className="space-y-4 max-w-xl">{ACTIVE_FIELDS.map(renderActiveField)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-4">{LEFT_FIELDS.map(renderInput)}</div>
              <div className="space-y-4">{RIGHT_FIELDS.map(renderInput)}</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          {isActiveStage ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[#3730A3] bg-white px-4 py-2.5 text-sm font-medium text-[#3730A3] shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3730A3] focus:ring-offset-2"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleActivateAccount}
                disabled={isActivating}
                className="rounded-lg bg-[#3730A3] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2d2880] focus:outline-none focus:ring-2 focus:ring-[#3730A3] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isActivating ? "Activating..." : "Activate Account"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3730A3] focus:ring-offset-2"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleNextStage}
                disabled={isMovingToNextStage}
                className="rounded-lg bg-[#3730A3] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2d2880] focus:outline-none focus:ring-2 focus:ring-[#3730A3] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#3730A3]"
              >
                {isMovingToNextStage ? "Moving to Next Stage ...." : "Next Stage"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
