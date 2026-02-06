import ExcelJS from "exceljs";
import { usePopup } from "../../../components/Popup";
import { useState, useCallback, useRef } from "react";
import AddVendorManually from "./AddSubscriptionManually";
import UploadSubscriptionModal from "./UploadSubscriptionModal";
import { FiX, FiPlus, FiUpload, FiDownload } from "react-icons/fi";
import {
  fetchVendorList,
  getDeparments,
  getCategories,
} from "../../../lib/api/Subscription/subscriptions";

export default function AddSubscriptionModal({
  open = false,
  setOpen,
  onAddManually,
  onDownloadTemplate,
  onAddSuccess,
  vendors: vendorsProp = [],
  departments = [],
}) {
  const { showError } = usePopup();
  const fileInputRef = useRef(null);
  const [vendors, setVendors] = useState([]);
  const [vendorsError, setVendorsError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadParsedData, setUploadParsedData] = useState(null);

  const vendorsList = vendorsProp.length > 0 ? vendorsProp : vendors;

  const handleClose = () => {
    setShowVendorModal(false);
    setShowUploadModal(false);
    setUploadParsedData(null);
    setVendorsError(null);
    setOpen?.(false);
  };

  const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];
  const isAcceptedFile = (file) => {
    const name = (file?.name ?? "").toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  };

  const TEMPLATE_HEADERS = [
    "Subscription Name",
    "Subscription Contract Amount",
    "Description",
    "Subscription Start Date",
    "Subscription End Date",
    "Number of Licenses",
    "Number of Current Users",
    "Is it Auto Renew Contract?",
    "Do you require a partner for renewal?",
    "Subscription Frequency Number",
    "Subscription Frequency Unit",
    "Vendor Profile",
    "Subscription Category",
    "Subscription Department",
  ];

  const normalizeHeader = (value) => String(value ?? "").trim();

  const processFile = useCallback(
    async (file) => {
      if (!file) return;
      try {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) {
          showError("No sheet found in file.", "Upload failed");
          return;
        }
        const headerRow = sheet.getRow(1);
        const headerValues = Array.isArray(headerRow.values) ? headerRow.values.slice(1) : [];
        const maxColumns = Math.max(headerValues.length, TEMPLATE_HEADERS.length);
        const headers = Array.from({ length: maxColumns }, (_, i) =>
          normalizeHeader(headerValues[i])
        );

        if (headers.length === 0 || headers.every((h) => !h)) {
          showError("No headers found in the first row.", "Upload failed");
          return;
        }

        const normalizedTemplate = TEMPLATE_HEADERS.map((h) => h.toLowerCase().trim());
        const normalizedUploaded = headers.map((h) => h.toLowerCase().trim()).filter(Boolean);
        const templateSet = new Set(normalizedTemplate);
        const uploadedSet = new Set(normalizedUploaded);
        const missing = normalizedTemplate.filter((h) => !uploadedSet.has(h));
        const extra = normalizedUploaded.filter((h) => !templateSet.has(h));

        if (missing.length > 0 || extra.length > 0) {
          const missingMessage =
            missing.length > 0 ? `Missing headers: ${missing.join(", ")}. ` : "";
          const extraMessage = extra.length > 0 ? `Unexpected headers: ${extra.join(", ")}.` : "";
          showError(
            `Uploaded file does not match the template. ${missingMessage}${extraMessage}`.trim(),
            "Upload failed"
          );
          return;
        }

        const rows = [];
        for (let r = 2; r <= sheet.rowCount; r++) {
          const row = sheet.getRow(r);
          const obj = {};
          headers.forEach((h, i) => {
            const cell = row.getCell(i + 1);
            let val = cell?.value;
            if (val != null && typeof val === "object" && val.text != null) val = val.text;
            obj[h] = val != null ? String(val).trim() : "";
          });
          const hasValue = headers.some((h) => (obj[h] ?? "").trim() !== "");
          if (hasValue) {
            rows.push(obj);
          }
        }
        setUploadParsedData({ headers, rows });
        setShowUploadModal(true);
      } catch (err) {
        console.error("Excel parse error:", err);
        showError(err?.message ?? "Failed to read Excel file.", "Upload failed");
      }
    },
    [showError]
  );

  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!isAcceptedFile(file)) {
        showError("Please upload only Excel files (.xlsx, .xls).", "Invalid file type");
        e.target.value = "";
        return;
      }
      await processFile(file);
      e.target.value = "";
    },
    [processFile, showError]
  );

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!isAcceptedFile(file)) {
        showError("Please upload only Excel files (.xlsx, .xls).", "Invalid file type");
        return;
      }
      await processFile(file);
    },
    [processFile, showError]
  );

  const handleAddManually = async () => {
    if (onAddManually) {
      onAddManually();
      return;
    }
    setVendorsLoading(true);
    setVendorsError(null);
    try {
      const result = await fetchVendorList();
      const raw = result?.value ?? [];
      const list = (Array.isArray(raw) ? raw : [])
        .map((item) => ({
          ...item,
          id: item?.activityid ?? item?.id,
          name: item?.yiic_vendorname ?? item?.vendorName ?? item?.name ?? "",
        }))
        .filter((v) => v?.yiic_vendorname !== "");
      setVendors(list);
      setShowVendorModal(true);
    } catch (err) {
      console.error("Fetch vendor list failed:", err);
      setVendorsError(err?.message ?? "Failed to load vendors");
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleVendorModalBack = () => setShowVendorModal(false);

  const handleDownloadTemplate = useCallback(
    async (e) => {
      e.preventDefault();

      if (onDownloadTemplate) {
        onDownloadTemplate();
        return;
      }

      setIsDownloading(true);
      try {
        // Fetch lookup data
        const [categoriesResult, departmentsResult] = await Promise.all([
          getCategories().catch(() => ({ value: [] })),
          getDeparments().catch(() => ({ value: [] })),
        ]);

        const categories = categoriesResult?.value || [];
        const departmentsData = departmentsResult?.value || [];

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Template");

        // Define columns
        sheet.columns = [
          { header: "Subscription Name", key: "name", width: 30 },
          { header: "Subscription Contract Amount", key: "amount", width: 20 },
          { header: "Description", key: "description", width: 40 },
          { header: "Subscription Start Date", key: "startDate", width: 15 },
          { header: "Subscription End Date", key: "endDate", width: 15 },
          { header: "Number of Licenses", key: "licenses", width: 15 },
          { header: "Number of Current Users", key: "users", width: 20 },
          { header: "Is it Auto Renew Contract?", key: "autoRenew", width: 15 },
          { header: "Do you require a partner for renewal?", key: "partnerRenew", width: 15 },
          { header: "Subscription Frequency Number", key: "freqNumber", width: 20 },
          { header: "Subscription Frequency Unit", key: "freqUnit", width: 15 },
          { header: "Vendor Profile", key: "vendorProfile", width: 15 },
          { header: "Subscription Category", key: "subCategory", width: 20 },
          { header: "Subscription Department", key: "subDepartment", width: 20 },
        ];

        // Add example row
        sheet.addRow({
          name: "Example1",
          amount: 100,
          description: "example description",
          startDate: "01/01/2025",
          endDate: "12/31/2025",
          licenses: 21,
          users: 12,
          autoRenew: "Yes",
          partnerRenew: "No",
          freqNumber: 13,
          freqUnit: "Months",
          vendorProfile: "Strategic",
          subCategory: categories[0]?.yiic_name || "",
          subDepartment: departmentsData[0]?.yiic_name || "",
        });

        // Apply dropdowns for static fields
        const staticChoices = {
          autoRenew: ["Yes", "No"],
          partnerRenew: ["Yes", "No"],
          freqUnit: ["Months", "Years"],
          vendorProfile: ["Strategic", "Tactical", "Operational"],
        };

        // Validate 2 to 50 rows
        for (let r = 2; r <= 50; r++) {
          // Static dropdowns
          for (let key in staticChoices) {
            const col = sheet.getColumn(key).letter;
            sheet.getCell(`${col}${r}`).dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [`"${staticChoices[key].join(",")}"`],
            };
          }

          // Whole number restriction: 1-1000
          for (let key of ["licenses", "users", "freqNumber"]) {
            const col = sheet.getColumn(key).letter;
            sheet.getCell(`${col}${r}`).dataValidation = {
              type: "whole",
              operator: "between",
              allowBlank: true,
              formulae: [1, 1000],
              showErrorMessage: true,
              errorTitle: "Invalid Input",
              error: "Please enter a whole number between 1 and 1000.",
            };
          }

          // Dynamic dropdowns
          if (categories.length > 0) {
            const categoryNames = categories.map((o) => o.yiic_name).join(",");
            const categoryCol = sheet.getColumn("subCategory").letter;
            sheet.getCell(`${categoryCol}${r}`).dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [`"${categoryNames}"`],
            };
          }

          if (departmentsData.length > 0) {
            const departmentNames = departmentsData.map((o) => o.yiic_name).join(",");
            const departmentCol = sheet.getColumn("subDepartment").letter;
            sheet.getCell(`${departmentCol}${r}`).dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [`"${departmentNames}"`],
            };
          }
        }

        // Trigger download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "subscription_template.xlsx";
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to download template:", error);
        alert("Failed to download template. Please try again.");
      } finally {
        setIsDownloading(false);
      }
    },
    [onDownloadTemplate]
  );

  return (
    <>
      {open && showVendorModal ? (
        <AddVendorManually
          open
          onBack={handleVendorModalBack}
          onClose={handleClose}
          onAddSuccess={onAddSuccess}
          vendors={vendorsList}
          departments={departments}
        />
      ) : open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-[580px] shadow-2xl animate-[slideUp_0.3s_ease-out] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER with gradient accent */}
            <div className="relative px-8 py-6 border-b border-gray-100/80 bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/50">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <FiPlus className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Add Subscription
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="group p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BODY with improved spacing and visual hierarchy */}
            <div className="px-8 py-8 space-y-7">
              {/* Error Message with better styling */}
              {vendorsError && (
                <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-[shake_0.3s_ease-in-out]">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">{vendorsError}</span>
                </div>
              )}

              {/* Manual Add Button with enhanced styling */}
              <button
                type="button"
                onClick={handleAddManually}
                disabled={vendorsLoading}
                className="group relative w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                {vendorsLoading ? (
                  <div className="flex items-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Loading vendors...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FiPlus className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <span>Add Subscription Manually</span>
                  </>
                )}
              </button>

              {/* Divider with improved styling */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5 bg-gray-50 rounded-full">
                  or
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>

              {/* Excel Import Section with card-like design */}
              <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/60">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-800">Import from Excel</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={isDownloading}
                    className="group flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiDownload className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" />
                    <span>{isDownloading ? "Downloading..." : "Download Template"}</span>
                  </button>
                </div>

                {/* Upload Area with enhanced interactivity and drag-and-drop */}
                <label
                  className={`group relative block border-2 border-dashed rounded-2xl h-[150px] flex flex-col items-center justify-center cursor-pointer text-gray-600 transition-all duration-300 overflow-hidden bg-white/50 hover:border-indigo-400 hover:bg-white ${
                    isDragging ? "border-indigo-500 bg-indigo-50/80" : "border-gray-300"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-purple-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:via-purple-50/30 group-hover:to-indigo-50/50 transition-all duration-500"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 mb-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-indigo-100 group-hover:to-purple-100 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md">
                      <FiUpload
                        className="w-7 h-7 text-gray-500 group-hover:text-indigo-600 group-hover:-translate-y-1 transition-all duration-300"
                        strokeWidth={2}
                      />
                    </div>
                    <p className="text-base font-semibold text-gray-700 group-hover:text-gray-900 mb-1 transition-colors duration-200">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                      Excel files (.xlsx, .xls)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <UploadSubscriptionModal
            open={showUploadModal}
            onClose={() => {
              setShowUploadModal(false);
              setUploadParsedData(null);
            }}
            parsedData={uploadParsedData}
            vendors={vendorsList}
            departments={departments}
            onUploadComplete={(payload) => {
              setShowUploadModal(false);
              setUploadParsedData(null);
              onAddSuccess?.();
            }}
          />

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to { 
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-4px); }
              75% { transform: translateX(4px); }
            }
          `}</style>
        </div>
      ) : null}
    </>
  );
}
