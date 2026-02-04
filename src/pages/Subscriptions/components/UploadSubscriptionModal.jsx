import {
  addSubscription,
  fetchVendorList,
  checkSubscriptionExistance,
} from "../../../lib/utils/subscriptions";
import AddNewVendor from "./AddNewVendor";
import { useState, useMemo, useEffect, useRef } from "react";
import { usePopup } from "../../../components/Popup";
import { FiX, FiCheck, FiTrash2, FiPlus, FiSearch, FiChevronDown } from "react-icons/fi";

const STEP_LABELS = ["Upload CSV/Excel", "Field Mapping", "Vendor Associations"];

const CRM_FIELD_META = [
  { logicalName: "Subscription Name", dataType: "text" },
  { logicalName: "Description", dataType: "text" },
  { logicalName: "Subscription End Date", dataType: "date" },
  { logicalName: "Number of Current Users", dataType: "number" },
  { logicalName: "Subscription Contract Amount", dataType: "number" },
  { logicalName: "Subscription Start Date", dataType: "date" },
  { logicalName: "Number of Licenses", dataType: "number" },
  { logicalName: "Is it Auto Renew Contract?", dataType: "boolean" },
  { logicalName: "Do you require a partner for renewal?", dataType: "boolean" },
  { logicalName: "Subscription Frequency Number", dataType: "number" },
  { logicalName: "Subscription Frequency Unit", dataType: "choice" },
  { logicalName: "Vendor Profile", dataType: "choice" },
  { logicalName: "Subscription Category", dataType: "choice" },
  { logicalName: "Subscription Department", dataType: "choice" },
];

const CRM_FIELDS = CRM_FIELD_META.map((field) => field.logicalName);

const CRM_FIELD_META_BY_NAME = CRM_FIELD_META.reduce((acc, field) => {
  acc[field.logicalName] = field;
  return acc;
}, {});

const VALIDATION_RULES = {
  "Subscription Frequency Unit": ["Months", "Years"],
  "Vendor Profile": ["Strategic", "Tactical", "Operational"],
};

const getVendorLabel = (vendor) => {
  if (!vendor) return "";
  return typeof vendor === "object"
    ? (vendor?.yiic_vendorname ?? vendor?.vendorName ?? vendor?.name ?? vendor?.id ?? "")
    : String(vendor);
};

const getVendorId = (vendor) => {
  if (!vendor || typeof vendor !== "object") return null;
  return vendor?.activityid ?? vendor?.id ?? vendor?.yiic_subscriptionsactivityid ?? null;
};

const normalizeVendorList = (list = []) => {
  if (!Array.isArray(list)) return [];
  return list.filter((vendor) => Boolean(getVendorLabel(vendor)));
};

const toISODateString = (val) => {
  if (val == null || val === "") return "";
  const s = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [mm, dd, yyyy] = s.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T00:00:00.000Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return `${s.substring(0, 10)}T00:00:00.000Z`;
  }
  return s;
};

const formatSubscriptionFrequencyDisplay = (number, unitCode) => {
  if (number == null || number === "" || !unitCode) return "";
  const n = parseInt(number, 10);
  if (Number.isNaN(n)) return "";
  if (String(unitCode) === "664160002") {
    return n === 1 ? "1 Month" : `${n} Months`;
  }
  if (String(unitCode) === "664160003") {
    return n === 1 ? "1 Year" : `${n} Years`;
  }
  return "";
};

export default function UploadSubscriptionModal({
  open = false,
  onClose,
  parsedData = null,
  vendors = [],
  departments = [],
  onUploadComplete,
}) {
  const { showError, showSuccess, showWarning } = usePopup();
  const [step, setStep] = useState(2);
  const bulkVendorDropdownRef = useRef(null);
  const bulkVendorSearchInputRef = useRef(null);
  const [bulkVendor, setBulkVendor] = useState("");
  const [fieldMapping, setFieldMapping] = useState({});
  const [activityRows, setActivityRows] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [openRowVendorId, setOpenRowVendorId] = useState(null);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidHeaders, setInvalidHeaders] = useState(new Set());
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [duplicateRowIds, setDuplicateRowIds] = useState(new Set());
  const [showConfirmUpload, setShowConfirmUpload] = useState(false);
  const [rowVendorSearchTerm, setRowVendorSearchTerm] = useState("");
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showMappingWarning, setShowMappingWarning] = useState(false);
  const [bulkVendorSearchTerm, setBulkVendorSearchTerm] = useState("");
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [addVendorTargetRowId, setAddVendorTargetRowId] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [showAssociationWarning, setShowAssociationWarning] = useState(false);
  const [isBulkVendorDropdownOpen, setIsBulkVendorDropdownOpen] = useState(false);
  const [rowDropdownPosition, setRowDropdownPosition] = useState({ top: 0, left: 0 });
  const [invalidAssociationRowIds, setInvalidAssociationRowIds] = useState(new Set());

  const headers = useMemo(() => {
    if (!parsedData?.headers?.length) return [];
    return parsedData.headers;
  }, [parsedData?.headers]);

  const rows = useMemo(() => {
    if (!parsedData?.rows?.length) return [];
    return parsedData.rows;
  }, [parsedData?.rows]);

  useEffect(() => {
    if (!open || step !== 3 || rows.length === 0) return;
    const mappedSubscriptionHeader = Object.entries(fieldMapping).find(
      ([, crmField]) => crmField === "Subscription Name"
    )?.[0];
    const fallbackHeader = headers.find(
      (header) => String(header).toLowerCase().trim() === "subscription name"
    );
    const descriptionKey = mappedSubscriptionHeader || fallbackHeader || null;

    setActivityRows((prev) =>
      rows.map((row, idx) => {
        const prevRow = prev?.[idx];
        const rawDescription = descriptionKey ? row?.[descriptionKey] : "";
        const description = rawDescription != null ? String(rawDescription).trim() : "";
        return {
          id: prevRow?.id ?? `row-${idx}`,
          index: idx + 1,
          description: description || `Row ${idx + 1}`,
          vendor: prevRow?.vendor ?? "",
          vendorId: prevRow?.vendorId ?? null,
          rowData: row,
        };
      })
    );
  }, [open, step, rows, headers, fieldMapping]);

  useEffect(() => {
    if (!open || step !== 3) return;
    const normalizedPropVendors = normalizeVendorList(vendors);
    if (normalizedPropVendors.length > 0) {
      setAvailableVendors(normalizedPropVendors);
      return;
    }

    let cancelled = false;
    const loadVendors = async () => {
      setVendorsLoading(true);
      try {
        const result = await fetchVendorList();
        const raw = result?.value ?? [];
        const normalized = normalizeVendorList(raw);
        if (!cancelled) {
          setAvailableVendors(normalized);
        }
      } catch (err) {
        console.error("Fetch vendor list failed:", err);
        if (!cancelled) {
          showError(err?.message ?? "Failed to load vendors", "Upload failed");
        }
      } finally {
        if (!cancelled) {
          setVendorsLoading(false);
        }
      }
    };

    loadVendors();
    return () => {
      cancelled = true;
    };
  }, [open, step, vendors, showError]);

  const vendorOptions = useMemo(
    () =>
      availableVendors
        .map((vendor, idx) => {
          const label = getVendorLabel(vendor);
          if (!label) return null;
          const key =
            typeof vendor === "object"
              ? (vendor?.activityid ?? vendor?.id ?? idx)
              : `${label}-${idx}`;
          return { key, label };
        })
        .filter(Boolean),
    [availableVendors]
  );

  const filteredBulkVendorOptions = useMemo(() => {
    const term = bulkVendorSearchTerm.trim().toLowerCase();
    if (!term) return vendorOptions;
    return vendorOptions.filter((option) => option.label.toLowerCase().includes(term));
  }, [vendorOptions, bulkVendorSearchTerm]);

  const filteredRowVendorOptions = useMemo(() => {
    const term = rowVendorSearchTerm.trim().toLowerCase();
    if (!term) return vendorOptions;
    return vendorOptions.filter((option) => option.label.toLowerCase().includes(term));
  }, [vendorOptions, rowVendorSearchTerm]);

  const handleBulkVendorSelect = (option) => {
    const value = option.label?.trim() || "";
    setBulkVendor(value);
    setIsBulkVendorDropdownOpen(false);
    setBulkVendorSearchTerm("");
    if (!value || selectedRowIds.size === 0) return;
    const match = availableVendors.find(
      (vendor) => getVendorLabel(vendor).toLowerCase() === value.toLowerCase()
    );
    const vendorId = match ? getVendorId(match) : null;
    setActivityRows((prev) =>
      prev.map((r) => (selectedRowIds.has(r.id) ? { ...r, vendor: value, vendorId } : r))
    );
    if (vendorId) {
      setInvalidAssociationRowIds((prev) => {
        const next = new Set(prev);
        selectedRowIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  useEffect(() => {
    if (!isBulkVendorDropdownOpen) return;
    const handleClickOutside = (event) => {
      if (bulkVendorDropdownRef.current && !bulkVendorDropdownRef.current.contains(event.target)) {
        setIsBulkVendorDropdownOpen(false);
        setBulkVendorSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isBulkVendorDropdownOpen]);

  useEffect(() => {
    if (isBulkVendorDropdownOpen && bulkVendorSearchInputRef.current) {
      bulkVendorSearchInputRef.current.focus();
    }
  }, [isBulkVendorDropdownOpen]);

  useEffect(() => {
    if (!openRowVendorId) return;
    const handleClickOutside = (event) => {
      const container = event.target.closest(`[data-row-vendor-dropdown="${openRowVendorId}"]`);
      if (!container) {
        setOpenRowVendorId(null);
        setRowVendorSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openRowVendorId]);

  const crmToCsvMap = useMemo(() => {
    const mapping = {};
    headers.forEach((csvHeader) => {
      const crmField = (
        fieldMapping[csvHeader] ?? (CRM_FIELDS.includes(csvHeader) ? csvHeader : "")
      ).trim();
      if (crmField && !mapping[crmField]) {
        mapping[crmField] = csvHeader;
      }
    });
    return mapping;
  }, [fieldMapping, headers]);

  const getMappedValue = (rowData, crmField) => {
    const csvHeader = crmToCsvMap[crmField];
    if (!csvHeader) return "";
    const raw = rowData?.[csvHeader];
    return raw != null ? String(raw).trim() : "";
  };

  const resolveDepartmentId = (departmentName) => {
    if (!departmentName) return null;
    const normalized = String(departmentName).trim().toLowerCase();
    const match = (Array.isArray(departments) ? departments : []).find((dept) => {
      const label =
        dept?.yiic_name ??
        dept?.name ??
        dept?.departmentName ??
        dept?.id ??
        dept?.yiic_departmentid;
      return (
        String(label ?? "")
          .trim()
          .toLowerCase() === normalized
      );
    });
    return match?.yiic_departmentid ?? match?.yiic_departmentId ?? match?.id ?? null;
  };

  const buildPayloadForRow = (activityRow) => {
    const rowData = activityRow?.rowData ?? {};
    const subscriptionName =
      getMappedValue(rowData, "Subscription Name") || activityRow.description;
    const description = getMappedValue(rowData, "Description");
    const startDate = getMappedValue(rowData, "Subscription Start Date");
    const endDate = getMappedValue(rowData, "Subscription End Date");
    const amount = getMappedValue(rowData, "Subscription Contract Amount");
    const licenses = getMappedValue(rowData, "Number of Licenses");
    const currentUsers = getMappedValue(rowData, "Number of Current Users");
    const autoRenew = getMappedValue(rowData, "Is it Auto Renew Contract?");
    const partnerRenew = getMappedValue(rowData, "Do you require a partner for renewal?");
    const frequencyNumber = getMappedValue(rowData, "Subscription Frequency Number");
    const frequencyUnit = getMappedValue(rowData, "Subscription Frequency Unit");
    const vendorProfile = getMappedValue(rowData, "Vendor Profile");
    const departmentName = getMappedValue(rowData, "Subscription Department");

    const vendorProfileCode = vendorProfile
      ? vendorProfile.trim().toLowerCase() === "strategic"
        ? 1
        : vendorProfile.trim().toLowerCase() === "tactical"
          ? 2
          : vendorProfile.trim().toLowerCase() === "operational"
            ? 3
            : null
      : null;

    const frequencyUnitCode =
      frequencyUnit.trim().toLowerCase() === "months"
        ? "664160002"
        : frequencyUnit.trim().toLowerCase() === "years"
          ? "664160003"
          : null;

    const frequencyDisplay = formatSubscriptionFrequencyDisplay(frequencyNumber, frequencyUnitCode);

    const departmentId = resolveDepartmentId(departmentName);

    return {
      yiic_subscriptionname: subscriptionName ?? "",
      yiic_vendorprofile: vendorProfileCode,
      "yiic_Subscriptionactivity_yiic_subscriptionsactivityline@odata.bind": activityRow.vendorId
        ? `/yiic_subscriptionsactivities(${activityRow.vendorId})`
        : undefined,
      "yiic_SubscriptionDepartment_yiic_subscriptionsactivityline@odata.bind": departmentId
        ? `/yiic_departments(${departmentId})`
        : undefined,
      yiic_subscriptioncontractamount: amount ? Number(amount) : 0,
      description: description ?? "",
      yiic_nooflicenses: licenses === "" || licenses == null ? null : Number(licenses),
      yiic_noofcurrentusers:
        currentUsers === "" || currentUsers == null ? null : Number(currentUsers),
      yiic_subscriptionstartdate: toISODateString(startDate),
      yiic_subscriptionenddate: toISODateString(endDate),
      yiic_subscriptionfrequency: frequencyDisplay ?? "",
      yiic_subscriptionfrequencynumber: frequencyNumber ? Number(frequencyNumber) : null,
      yiic_subscriptionfrequencyunit: frequencyUnitCode ? Number(frequencyUnitCode) : null,
      yiic_isitautorenewcontract:
        autoRenew.trim().toLowerCase() === "yes"
          ? true
          : autoRenew.trim().toLowerCase() === "no"
            ? false
            : null,
      yiic_doyourequireapartnerforrenewal:
        partnerRenew.trim().toLowerCase() === "yes"
          ? true
          : partnerRenew.trim().toLowerCase() === "no"
            ? false
            : null,
    };
  };

  const handleMappingChange = (csvHeader, crmField) => {
    setFieldMapping((prev) => ({ ...prev, [csvHeader]: crmField }));
    setInvalidHeaders((prev) => {
      if (!prev.has(csvHeader)) return prev;
      const next = new Set(prev);
      next.delete(csvHeader);
      return next;
    });
  };

  const handleNext = () => {
    if (step !== 2) return;
    const mappings = headers.map((csvHeader) => ({
      csvField: csvHeader,
      crmField: (
        fieldMapping[csvHeader] ?? (CRM_FIELDS.includes(csvHeader) ? csvHeader : "")
      ).trim(),
    }));

    const missingMappings = mappings.filter((mapping) => !mapping.crmField);
    if (missingMappings.length > 0) {
      setInvalidHeaders(new Set(missingMappings.map((mapping) => mapping.csvField)));
      setShowMappingWarning(true);
      return;
    }

    const errors = [];
    rows.forEach((row, rowIndex) => {
      mappings.forEach(({ csvField, crmField }) => {
        const rawValue = row?.[csvField];
        const value = rawValue != null ? String(rawValue).trim() : "";
        const crmFieldMeta = CRM_FIELD_META_BY_NAME[crmField];
        if (!crmFieldMeta) return;

        const allowedList = VALIDATION_RULES[crmField];
        if (allowedList && value) {
          const allowedValues = allowedList.map((v) => v.toLowerCase());
          if (!allowedValues.includes(value.toLowerCase())) {
            errors.push({
              row: rowIndex + 2,
              field: csvField,
              value: value || "(empty)",
              issue: `Value not in allowed list: ${allowedList.join(", ")}`,
            });
          }
        }

        const dataType = crmFieldMeta.dataType?.toLowerCase();
        if (dataType === "date") {
          const parsedDate = new Date(value);
          const isValidFormat = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value);
          if (value && (isNaN(parsedDate.getTime()) || !isValidFormat)) {
            errors.push({
              row: rowIndex + 2,
              field: csvField,
              value: value || "(empty)",
              issue: "Invalid date format. Use MM/DD/YYYY",
            });
          }
        }

        if (dataType === "number") {
          if (value && (isNaN(value) || !isFinite(Number(value)))) {
            errors.push({
              row: rowIndex + 2,
              field: csvField,
              value: value || "(empty)",
              issue: "Expected a numeric value",
            });
          }
        }

        if (dataType === "boolean") {
          if (value && !["yes", "no"].includes(value.toLowerCase())) {
            errors.push({
              row: rowIndex + 2,
              field: csvField,
              value: value || "(empty)",
              issue: 'Only "Yes" or "No" allowed',
            });
          }
        }
      });
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    setValidationErrors([]);
    setShowValidationModal(false);
    setStep(3);
  };

  const handleVendorChange = (rowId, value) => {
    const match = availableVendors.find(
      (vendor) => getVendorLabel(vendor).toLowerCase() === value.trim().toLowerCase()
    );
    const vendorId = match ? getVendorId(match) : null;
    setActivityRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, vendor: value, vendorId } : r))
    );
    setInvalidAssociationRowIds((prev) => {
      if (!prev.has(rowId) || !vendorId) return prev;
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
  };

  const handleBulkVendorApply = () => {
    if (!bulkVendor.trim()) return;
    const match = availableVendors.find(
      (vendor) => getVendorLabel(vendor).toLowerCase() === bulkVendor.trim().toLowerCase()
    );
    const vendorId = match ? getVendorId(match) : null;
    setActivityRows((prev) =>
      prev.map((r) =>
        selectedRowIds.has(r.id) ? { ...r, vendor: bulkVendor.trim(), vendorId } : r
      )
    );
    if (vendorId) {
      setInvalidAssociationRowIds((prev) => {
        const next = new Set(prev);
        selectedRowIds.forEach((id) => next.delete(id));
        return next;
      });
    }
    setSelectedRowIds(new Set());
    setBulkVendor("");
  };

  const toggleRowSelection = (id) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteRow = (id) => {
    setActivityRows((prev) => prev.filter((r) => r.id !== id));
    setInvalidAssociationRowIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDuplicateRowIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleAddVendor = (rowId) => {
    setAddVendorTargetRowId(rowId);
    setShowAddVendorModal(true);
  };

  const handleAddVendorClose = () => {
    setShowAddVendorModal(false);
    setAddVendorTargetRowId(null);
  };

  const handleVendorCreated = (vendor) => {
    const label = getVendorLabel(vendor);
    const vendorId = getVendorId(vendor);
    if (label) {
      setAvailableVendors((prev) => normalizeVendorList([...prev, vendor]));
      if (addVendorTargetRowId) {
        setActivityRows((prev) =>
          prev.map((row) =>
            row.id === addVendorTargetRowId ? { ...row, vendor: label, vendorId } : row
          )
        );
      }
    }
    handleAddVendorClose();
  };

  const handleUploadClick = async () => {
    if (activityRows.length === 0) {
      showError("No activity rows available to upload.", "Upload failed");
      return;
    }
    setDuplicateRowIds(new Set());
    const invalidRows = new Set();
    activityRows.forEach((row) => {
      if (!row.vendorId) {
        invalidRows.add(row.id);
      }
    });

    if (invalidRows.size > 0) {
      setInvalidAssociationRowIds(invalidRows);
      setShowAssociationWarning(true);
      return;
    }
    setShowAssociationWarning(false);

    const missingNameRows = activityRows.filter(
      (row) => !getMappedValue(row.rowData, "Subscription Name")?.trim()
    );
    if (missingNameRows.length > 0) {
      showError("Please provide a Subscription Name for all rows.", "Missing data");
      return;
    }

    setIsCheckingDuplicates(true);
    try {
      const duplicates = [];
      for (const row of activityRows) {
        const subscriptionName =
          getMappedValue(row.rowData, "Subscription Name") || row.description;
        const result = await checkSubscriptionExistance(subscriptionName, row.vendorId);
        const value = result?.value;
        const hasDuplicate = Array.isArray(value) && value.length > 0;
        if (hasDuplicate) {
          duplicates.push(row);
        }
      }

      if (duplicates.length > 0) {
        setDuplicateRowIds(new Set(duplicates.map((row) => row.id)));
        setShowDuplicateWarning(true);
        return;
      }

      setShowDuplicateWarning(false);
      setShowConfirmUpload(true);
    } catch (err) {
      console.error("Duplicate check failed:", err);
      showError(err?.message ?? "Failed to check duplicates.", "Upload failed");
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleConfirmUpload = async () => {
    setShowConfirmUpload(false);
    setIsUploading(true);
    try {
      const payloads = activityRows.map((row) => buildPayloadForRow(row));
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const failures = [];

      for (let i = 0; i < payloads.length; i += 1) {
        try {
          await addSubscription(payloads[i]);
          if (i < payloads.length - 1) {
            await delay(400);
          }
        } catch (err) {
          console.error(`Failed to upload row ${i + 1}:`, err);
          failures.push({ index: i + 1, error: err });
        }
      }

      if (failures.length > 0) {
        showWarning(
          `Uploaded ${payloads.length - failures.length} of ${payloads.length} subscriptions.`
        );
      } else {
        showSuccess("Subscriptions uploaded successfully.");
      }
      onUploadComplete?.({ mapping: fieldMapping, rows: activityRows, headers });
      onClose?.();
    } catch (err) {
      console.error("Upload failed:", err);
      showError(err?.message ?? "Upload failed. Please try again.", "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setStep(2);
    setFieldMapping({});
    setActivityRows([]);
    setSelectedRowIds(new Set());
    setBulkVendor("");
    setInvalidHeaders(new Set());
    setValidationErrors([]);
    setShowValidationModal(false);
    setShowMappingWarning(false);
    setAvailableVendors([]);
    setVendorsLoading(false);
    setShowAddVendorModal(false);
    setAddVendorTargetRowId(null);
    setInvalidAssociationRowIds(new Set());
    setDuplicateRowIds(new Set());
    setShowAssociationWarning(false);
    setShowDuplicateWarning(false);
    setShowConfirmUpload(false);
    setIsUploading(false);
    setIsCheckingDuplicates(false);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 z-0 bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-4xl h-[80vh] flex flex-col rounded-2xl border border-[#e9ecef] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e9ecef] px-6 py-4">
          <h2 className="text-xl font-bold text-[#172B4D]">
            {step === 2
              ? "Map CSV Fields to CRM Fields"
              : "Associate Activity Lines to Subscriptions"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-[#6C757D] hover:bg-[#f6f7fb] hover:text-[#172B4D] transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2 border-b border-[#e9ecef]">
          <div className="flex items-center justify-between gap-2">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const done = step > stepNum;
              const active = step === stepNum;
              return (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : active
                            ? "bg-[#172B4D] border-[#172B4D] text-white"
                            : "bg-white border-[#e9ecef] text-[#6C757D]"
                      }`}
                    >
                      {done ? (
                        <FiCheck className="w-5 h-5" strokeWidth={2.5} />
                      ) : (
                        <span className="text-sm font-semibold">{stepNum}</span>
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-xs font-medium ${
                        active ? "text-[#172B4D]" : "text-[#6C757D]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 rounded ${
                        done ? "bg-emerald-400" : "bg-[#e9ecef]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 px-6 py-6 ${step === 2 ? "overflow-y-auto" : ""}`}>
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {headers.map((csvHeader) => (
                <div key={csvHeader} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#343A40]">
                    CSV Field: {csvHeader}
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg bg-white text-[#172B4D] focus:ring-2 focus:ring-[#172B4D]/20 focus:border-[#172B4D] outline-none ${
                      invalidHeaders.has(csvHeader)
                        ? "border-red-400 ring-1 ring-red-200"
                        : "border-[#e9ecef]"
                    }`}
                    value={
                      fieldMapping[csvHeader] ?? (CRM_FIELDS.includes(csvHeader) ? csvHeader : "")
                    }
                    onChange={(e) => handleMappingChange(csvHeader, e.target.value)}
                  >
                    <option value="">-- Select CRM Field --</option>
                    {CRM_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {activityRows.length > 1 && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-2">
                    <div ref={bulkVendorDropdownRef} className="relative w-56">
                      <button
                        type="button"
                        onClick={() => setIsBulkVendorDropdownOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-lg border border-[#e9ecef] bg-white px-3 py-2 text-sm text-[#172B4D] focus:ring-2 focus:ring-[#172B4D]/20 focus:border-[#172B4D] outline-none"
                        disabled={vendorsLoading}
                      >
                        <span className="truncate">
                          {bulkVendor ||
                            (vendorsLoading
                              ? "Loading vendors..."
                              : "Select vendor for Selected Rows")}
                        </span>
                        <FiChevronDown
                          className={`ml-2 h-4 w-4 text-[#6C757D] transition-transform duration-200 ${
                            isBulkVendorDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isBulkVendorDropdownOpen && (
                        <div className="absolute z-50 mt-2 w-full rounded-lg border border-[#e9ecef] bg-white shadow-xl overflow-visible">
                          <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                ref={bulkVendorSearchInputRef}
                                type="text"
                                placeholder="Search vendors..."
                                value={bulkVendorSearchTerm}
                                onChange={(e) => setBulkVendorSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#172B4D]/20 focus:border-[#172B4D] outline-none"
                              />
                            </div>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {filteredBulkVendorOptions.length > 0 ? (
                              filteredBulkVendorOptions.map((option) => (
                                <button
                                  key={option.key}
                                  type="button"
                                  onClick={() => handleBulkVendorSelect(option)}
                                  className={`w-full text-left px-4 py-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors ${
                                    bulkVendor === option.label
                                      ? "bg-[#1f2a7c]/5 text-[#1f2a7c] font-medium"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-6 text-center text-xs sm:text-sm text-gray-500">
                                No vendors found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="border border-[#e9ecef] rounded-xl">
                <div className="max-h-[50vh] overflow-y-auto overflow-x-hidden">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-[#f6f7fb]">
                      <tr className="border-b border-[#e9ecef]">
                        <th className="w-10 py-3 px-3 text-left font-semibold text-[#172B4D]"></th>
                        <th className="py-3 px-3 text-left font-semibold text-[#172B4D]">#</th>
                        <th className="py-3 px-3 text-left font-semibold text-[#172B4D]">
                          Activity Line Description
                        </th>
                        <th className="py-3 px-3 text-left font-semibold text-[#172B4D]">
                          Select Vendor
                        </th>
                        <th className="w-12 py-3 px-3 text-left font-semibold text-[#172B4D]">
                          Delete
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`border-b border-[#e9ecef] last:border-0 hover:bg-[#f6f7fb]/50 ${
                            duplicateRowIds.has(row.id) ? "bg-red-50" : ""
                          }`}
                        >
                          <td className="py-2 px-3">
                            <input
                              type="radio"
                              checked={selectedRowIds.has(row.id)}
                              onChange={() => toggleRowSelection(row.id)}
                              className="rounded-full border-[#e9ecef] text-[#172B4D] focus:ring-[#172B4D]"
                            />
                          </td>
                          <td className="py-2 px-3 font-medium text-[#343A40]">{row.index}</td>
                          <td className="py-2 px-3 text-[#6C757D]">{row.description}</td>
                          <td className="py-2 px-3">
                            <div
                              className="flex items-center gap-2 relative"
                              data-row-vendor-dropdown={row.id}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (openRowVendorId === row.id) {
                                    setOpenRowVendorId(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setRowDropdownPosition({
                                      top: rect.bottom + 8,
                                      left: rect.left,
                                    });
                                    setOpenRowVendorId(row.id);
                                  }
                                  setRowVendorSearchTerm("");
                                }}
                                className={`flex w-44 min-w-0 items-center justify-between px-3 py-1.5 rounded-lg text-[#172B4D] bg-white focus:ring-2 focus:ring-[#172B4D]/20 focus:border-[#172B4D] outline-none ${
                                  invalidAssociationRowIds.has(row.id)
                                    ? "border border-red-400 ring-1 ring-red-200"
                                    : "border border-[#e9ecef]"
                                }`}
                                disabled={vendorsLoading}
                              >
                                <span className="truncate">
                                  {row.vendor ||
                                    (vendorsLoading ? "Loading vendors..." : "Search vendor")}
                                </span>
                                <FiChevronDown
                                  className={`ml-2 h-4 w-4 text-[#6C757D] transition-transform duration-200 ${
                                    openRowVendorId === row.id ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {openRowVendorId === row.id && (
                                <div
                                  className="fixed z-50 w-44 min-w-0 rounded-lg border border-[#e9ecef] bg-white shadow-xl"
                                  style={{
                                    top: `${rowDropdownPosition.top}px`,
                                    left: `${rowDropdownPosition.left}px`,
                                  }}
                                >
                                  <div className="p-3 border-b border-gray-100">
                                    <div className="relative">
                                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Search vendors..."
                                        value={rowVendorSearchTerm}
                                        onChange={(e) => setRowVendorSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#172B4D]/20 focus:border-[#172B4D] outline-none"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto">
                                    {filteredRowVendorOptions.length > 0 ? (
                                      filteredRowVendorOptions.map((option) => (
                                        <button
                                          key={option.key}
                                          type="button"
                                          onClick={() => {
                                            handleVendorChange(row.id, option.label);
                                            setOpenRowVendorId(null);
                                            setRowVendorSearchTerm("");
                                          }}
                                          className={`w-full text-left px-4 py-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors ${
                                            row.vendor === option.label
                                              ? "bg-[#1f2a7c]/5 text-[#1f2a7c] font-medium"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          {option.label}
                                        </button>
                                      ))
                                    ) : (
                                      <div className="px-4 py-6 text-center text-xs sm:text-sm text-gray-500">
                                        No vendors found
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAddVendor(row.id)}
                                className="p-2 rounded-lg text-[#6C757D] hover:bg-green-50 hover:text-green-600 transition-colors"
                                aria-label="Add vendor"
                              >
                                <FiPlus className="w-4 h-4" strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-2 rounded-lg text-[#6C757D] hover:bg-red-50 hover:text-red-600 transition-colors"
                              aria-label="Delete row"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#e9ecef] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-[#e9ecef] bg-white text-[#343A40] font-semibold hover:bg-[#f6f7fb] transition-colors"
          >
            Cancel
          </button>
          {step === 2 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-[#172B4D] text-white font-semibold hover:bg-[#000435] transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading || isCheckingDuplicates}
              className="px-5 py-2.5 rounded-xl bg-[#172B4D] text-white font-semibold hover:bg-[#000435] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCheckingDuplicates ? "Checking..." : isUploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>
      </div>

      <AddNewVendor
        open={showAddVendorModal}
        onBack={handleAddVendorClose}
        onClose={handleAddVendorClose}
        onAddVendor={handleVendorCreated}
      />

      {showAssociationWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAssociationWarning(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-lg rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172B4D]">Missing vendor selection</h3>
                <p className="text-sm text-[#6C757D] mt-1">
                  Please select a vendor for every activity line.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssociationWarning(false)}
                className="p-2 rounded-lg text-[#6C757D] hover:bg-[#f6f7fb] hover:text-[#172B4D] transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 max-h-48 overflow-auto border border-[#e9ecef] rounded-lg">
              <ul className="text-sm text-[#343A40] divide-y divide-[#e9ecef]">
                {activityRows
                  .filter((row) => invalidAssociationRowIds.has(row.id))
                  .map((row) => (
                    <li key={row.id} className="px-4 py-2">
                      Row {row.index}: {row.description}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAssociationWarning(false)}
                className="px-4 py-2 rounded-lg bg-[#172B4D] text-white font-semibold hover:bg-[#000435] transition-colors"
              >
                Fix selections
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDuplicateWarning(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-lg rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172B4D]">Duplicate subscriptions</h3>
                <p className="text-sm text-[#6C757D] mt-1">
                  These subscriptions already exist for the selected vendors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicateWarning(false)}
                className="p-2 rounded-lg text-[#6C757D] hover:bg-[#f6f7fb] hover:text-[#172B4D] transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 max-h-48 overflow-auto border border-[#e9ecef] rounded-lg">
              <ul className="text-sm text-[#343A40] divide-y divide-[#e9ecef]">
                {activityRows
                  .filter((row) => duplicateRowIds.has(row.id))
                  .map((row) => (
                    <li key={row.id} className="px-4 py-2">
                      Row {row.index}: {row.description}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDuplicateWarning(false)}
                className="px-4 py-2 rounded-lg bg-[#172B4D] text-white font-semibold hover:bg-[#000435] transition-colors"
              >
                Review duplicates
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirmUpload(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172B4D]">Confirm upload</h3>
                <p className="text-sm text-[#6C757D] mt-1">
                  This will upload {activityRows.length} subscription
                  {activityRows.length === 1 ? "" : "s"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmUpload(false)}
                className="p-2 rounded-lg text-[#6C757D] hover:bg-[#f6f7fb] hover:text-[#172B4D] transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmUpload(false)}
                className="px-4 py-2 rounded-lg border border-[#e9ecef] bg-white text-[#343A40] font-semibold hover:bg-[#f6f7fb] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                className="px-4 py-2 rounded-lg bg-[#172B4D] text-white font-semibold hover:bg-[#000435] transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {showMappingWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMappingWarning(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-lg rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172B4D]">Missing field mappings</h3>
                <p className="text-sm text-[#6C757D] mt-1">
                  Please map all CSV fields to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMappingWarning(false)}
                className="p-2 rounded-lg text-[#6C757D] hover:bg-[#f6f7fb] hover:text-[#172B4D] transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 max-h-48 overflow-auto border border-[#e9ecef] rounded-lg">
              <ul className="text-sm text-[#343A40] divide-y divide-[#e9ecef]">
                {[...invalidHeaders].map((header) => (
                  <li key={header} className="px-4 py-2">
                    {header}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMappingWarning(false)}
                className="px-4 py-2 rounded-lg bg-[#172B4D] text-white font-semibold hover:bg-[#000435] transition-colors"
              >
                Fix mappings
              </button>
            </div>
          </div>
        </div>
      )}

      {showValidationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowValidationModal(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl border border-[#e9ecef] bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#e9ecef] px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#172B4D]">Validation errors</h3>
                <p className="text-sm text-[#6C757D] mt-1">
                  Fix the issues below before continuing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="p-2 rounded-lg text-[#6C757D] hover:bg-[#f6f7fb] hover:text-[#172B4D] transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="border border-[#e9ecef] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f6f7fb] border-b border-[#e9ecef]">
                      <th className="py-3 px-3 text-left font-semibold text-[#172B4D]">Row</th>
                      <th className="py-3 px-3 text-left font-semibold text-[#172B4D]">Field</th>
                      <th className="py-3 px-3 text-left font-semibold text-[#172B4D]">Value</th>
                      <th className="py-3 px-3 text-left font-semibold text-[#172B4D]">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationErrors.map((err, idx) => (
                      <tr
                        key={`${err.row}-${err.field}-${idx}`}
                        className="border-b border-[#e9ecef] last:border-0"
                      >
                        <td className="py-2 px-3 text-[#343A40]">{err.row}</td>
                        <td className="py-2 px-3 text-[#343A40]">{err.field}</td>
                        <td className="py-2 px-3 text-red-600 font-semibold">
                          {err.value ?? "(empty)"}
                        </td>
                        <td className="py-2 px-3 text-[#6C757D]">{err.issue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e9ecef] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-lg bg-[#172B4D] text-white font-semibold hover:bg-[#000435] transition-colors"
              >
                Fix errors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
