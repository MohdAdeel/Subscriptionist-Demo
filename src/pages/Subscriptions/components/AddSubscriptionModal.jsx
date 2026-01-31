import { useState } from "react";

export default function AddSubscriptionModal({ open = false, setOpen }) {
  const [step, setStep] = useState("upload");
  // upload | vendor | addVendor

  const handleClose = () => {
    setOpen?.(false);
    setStep("upload");
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-xl">
            {/* HEADER */}
            <div className="flex items-center justify-between px-8 py-5 border-b">
              <div className="flex items-center gap-4">
                {step !== "upload" && (
                  <button
                    onClick={() => setStep(step === "addVendor" ? "vendor" : "upload")}
                    className="border rounded-lg px-3 py-1.5 text-lg font-medium"
                  >
                    ←
                  </button>
                )}

                <h2 className="text-xl font-semibold text-gray-800">
                  {step === "addVendor" ? "Add New Vendor" : "Add Subscription"}
                </h2>
              </div>

              <button onClick={handleClose} className="text-gray-500 text-2xl font-bold">
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="px-8 py-8 text-base">
              {/* ================= STEP 1 ================= */}
              {step === "upload" && (
                <>
                  <button
                    onClick={() => setStep("vendor")}
                    className="w-full border rounded-2xl py-4 text-lg font-semibold"
                  >
                    + Add Subscription Manually
                  </button>

                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gray-300" />
                    <span className="text-base text-gray-500">or</span>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>

                  <label
                    className="border-2 border-dashed rounded-2xl h-[180px]
                    flex flex-col items-center justify-center cursor-pointer text-lg font-medium"
                  >
                    ⬆️
                    <p className="text-base mt-2 text-gray-700 text-center px-2">
                      <b>Click to upload</b> or drag Excel file
                    </p>
                    <input type="file" className="hidden" />
                  </label>
                </>
              )}

              {/* ================= STEP 2 ================= */}
              {step === "vendor" && (
                <>
                  <button
                    onClick={() => setStep("addVendor")}
                    className="w-full border rounded-2xl py-4 mb-6 text-lg font-semibold"
                  >
                    + Add Vendor Manually
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-300" />
                    <span className="text-base text-gray-500">or</span>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>

                  <p className="text-base font-medium mb-3">Select from available list</p>

                  <select className="w-full border rounded-2xl px-4 py-3 text-base">
                    <option>Select Vendor</option>
                    <option>Vendor A</option>
                    <option>Vendor B</option>
                  </select>

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 border rounded-2xl py-3 text-base font-medium"
                    >
                      Close
                    </button>
                    <button className="flex-1 bg-[#1d225d] text-white rounded-2xl py-3 text-base font-semibold">
                      Next Stage
                    </button>
                  </div>
                </>
              )}

              {/* ================= STEP 3 (ADD VENDOR FORM) ================= */}
              {step === "addVendor" && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-base font-semibold">Vendor Name *</label>
                      <input
                        className="w-full border rounded-lg px-4 py-3 mt-2 text-base"
                        placeholder="Enter Vendor Name"
                      />
                    </div>

                    <div>
                      <label className="text-base font-semibold">Account Manager Email</label>
                      <input
                        className="w-full border rounded-lg px-4 py-3 mt-2 text-base"
                        placeholder="Enter Email"
                      />
                    </div>

                    <div>
                      <label className="text-base font-semibold">Account Manager Name</label>
                      <input
                        className="w-full border rounded-lg px-4 py-3 mt-2 text-base"
                        placeholder="Enter Name"
                      />
                    </div>

                    <div>
                      <label className="text-base font-semibold">Account Manager Phone</label>
                      <input
                        className="w-full border rounded-lg px-4 py-3 mt-2 text-base"
                        placeholder="Enter Phone"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button
                      onClick={() => setStep("vendor")}
                      className="flex-1 border rounded-2xl py-3 text-base font-medium"
                    >
                      Cancel
                    </button>

                    <button className="flex-1 bg-[#1d225d] text-white rounded-2xl py-3 text-base font-semibold">
                      Add Vendor
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
