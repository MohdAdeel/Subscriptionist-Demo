import {
  addAssociatedUser,
  getAssociatedUsers,
  deleteAssociatedUser,
} from "../../../lib/api/profile/profile";
import { FiTrash2, FiX } from "react-icons/fi";
import React, { useState, useEffect } from "react";
import { usePopup } from "../../../components/Popup";

/**
 * Turn API error into a short, clear message for the user.
 * Handles JSON body and common HTTP status codes (400, 401, 403, 404, 500, network).
 */
function getAddUserErrorMessage(err) {
  const raw = err?.message ?? "";

  // 500 – Server error
  if (raw.includes("500")) {
    return "Our servers are temporarily unavailable. Please try again in a few minutes.";
  }
  // 503 – Service unavailable
  if (raw.includes("503")) {
    return "The service is temporarily unavailable. Please try again later.";
  }
  // 401 / 403 – Auth
  if (raw.includes("401") || raw.includes("403")) {
    return "You don't have permission to add a user. Please sign in again or contact support.";
  }
  // 404 – Not found
  if (raw.includes("404")) {
    return "The request could not be completed. Please refresh the page and try again.";
  }
  // Network / fetch failed
  if (raw.includes("Failed to fetch") || raw.includes("NetworkError") || raw.includes("network")) {
    return "Please check your internet connection and try again.";
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]);
      let msg = data?.error ?? data?.message;
      if (typeof msg === "string") {
        const lower = msg.toLowerCase();
        if (
          lower.includes("required") &&
          (lower.includes("firstname") || lower.includes("field"))
        ) {
          return "Please fill in First Name, Last Name, and Email before adding the user.";
        }
        msg = msg
          .replace(/\bFirstName\b/gi, "First Name")
          .replace(/\bLastName\b/gi, "Last Name")
          .replace(/\bLoginContactId\b/gi, "account")
          .replace(/\bEmail\b/g, "Email");
        return msg;
      }
    } catch (_) {
      // ignore parse errors
    }
  }

  if (raw.includes("400") || raw.includes("required")) {
    return "Please fill in First Name, Last Name, and Email, then try again.";
  }
  return "Something went wrong. Please try again.";
}

function AssociatedUsers({ contactId, isActive }) {
  const { showError, showSuccess } = usePopup();
  const [associatedUsers, setAssociatedUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isLoadingAssociatedUsers, setIsLoadingAssociatedUsers] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    if (!isActive || !contactId) return;
    setIsLoadingAssociatedUsers(true);
    getAssociatedUsers(contactId)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.value ?? []);
        setAssociatedUsers(list);
      })
      .catch((err) => {
        console.error("Failed to load associated users:", err);
        setAssociatedUsers([]);
        showError("Unable to load associated users. Please refresh the page.");
      })
      .finally(() => {
        setIsLoadingAssociatedUsers(false);
      });
  }, [isActive, contactId, showError]);

  const openAddUserModal = () => {
    setAddUserForm({ firstName: "", lastName: "", email: "" });
    setShowAddUserModal(true);
  };

  const closeAddUserModal = () => {
    setShowAddUserModal(false);
    setAddUserForm({ firstName: "", lastName: "", email: "" });
  };

  const handleAddUserFieldChange = (field, value) => {
    setAddUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const openDeleteConfirm = (userId, displayName) => {
    setDeleteConfirm({ userId, displayName: displayName || "this user" });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm?.userId || !contactId) return;
    setIsDeletingUser(true);
    deleteAssociatedUser(deleteConfirm.userId)
      .then(() => {
        closeDeleteConfirm();
        showSuccess("User has been removed from associated users.");
        return getAssociatedUsers(contactId);
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.value ?? []);
        setAssociatedUsers(list);
      })
      .catch((err) => {
        showError("Unable to remove this user. Please try again.");
      })
      .finally(() => {
        setIsDeletingUser(false);
      });
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!contactId) return;
    const payload = {
      FirstName: addUserForm.firstName.trim(),
      LastName: addUserForm.lastName.trim(),
      Email: addUserForm.email.trim(),
      LoginContactId: contactId,
    };
    setIsAddingUser(true);
    addAssociatedUser(payload)
      .then(() => {
        closeAddUserModal();
        showSuccess("Associated user has been added successfully.");
        return getAssociatedUsers(contactId);
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.value ?? []);
        setAssociatedUsers(list);
      })
      .catch((err) => {
        console.error("Failed to add associated user:", err);
        showError(getAddUserErrorMessage(err));
      })
      .finally(() => {
        setIsAddingUser(false);
      });
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-[#e9ecef] shadow-sm p-6">
      {isLoadingAssociatedUsers ? (
        <div className="overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#e9ecef]">
                <th className="text-left py-3 px-2 text-sm font-bold text-[#343A40]">
                  <div className="h-4 w-24 bg-[#e9ecef] rounded animate-pulse" />
                </th>
                <th className="text-center py-3 px-2 text-sm font-bold text-[#343A40]">
                  <div className="h-4 w-16 bg-[#e9ecef] rounded animate-pulse mx-auto" />
                </th>
                <th className="text-right py-3 px-2 text-sm font-bold text-[#343A40]">
                  <div className="h-4 w-14 bg-[#e9ecef] rounded animate-pulse ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-[#e9ecef]">
                  <td className="py-3 px-2">
                    <div className="h-4 w-28 bg-[#e9ecef] rounded animate-pulse" />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="h-4 w-32 bg-[#e9ecef] rounded animate-pulse mx-auto" />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="h-5 w-5 bg-[#e9ecef] rounded animate-pulse ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end gap-3 mt-6 pt-4">
            <div className="h-9 w-20 bg-[#e9ecef] rounded-lg animate-pulse" />
            <div className="h-9 w-24 bg-[#e9ecef] rounded-lg animate-pulse" />
          </div>
        </div>
      ) : !associatedUsers?.length ? (
        <div className="py-12 text-center">
          <p className="text-[#6C757D] text-sm mb-2">No associated users available.</p>
          <p className="text-[#6C757D] text-xs">Add a new user to see them listed here.</p>
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-[#e9ecef] text-[#343A40] text-sm font-semibold bg-white hover:bg-[#F8F9FA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={openAddUserModal}
              className="px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors"
            >
              Add User
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e9ecef]">
                  <th className="text-left py-3 px-2 text-sm font-bold text-[#343A40]">
                    Full Name
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-bold text-[#343A40]">Email</th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-[#343A40]">Delete</th>
                </tr>
              </thead>
              <tbody>
                {associatedUsers
                  .filter((a) => a.record2id_contact?.contactid)
                  .map((association, index) => {
                    const c2 = association.record2id_contact;
                    const fullName =
                      c2.fullname ?? ([c2.firstname, c2.lastname].filter(Boolean).join(" ") || "—");
                    const email = c2.emailaddress1 ?? c2.email ?? c2.emailaddress ?? "";
                    const rowKey = c2.contactid ?? association._record2id_value ?? index;
                    return (
                      <tr key={rowKey} className="border-b border-[#e9ecef] hover:bg-[#F8F9FA]">
                        <td className="py-3 px-2 text-sm text-[#343A40]">{fullName}</td>
                        <td className="py-3 px-2 text-center">
                          {email ? (
                            <a
                              href={`mailto:${email}`}
                              className="text-sm text-[#172B4D] hover:underline"
                            >
                              {email}
                            </a>
                          ) : (
                            <span className="text-sm text-[#6C757D]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm(c2.contactid, fullName)}
                            className="p-1.5 text-[#DC3545] hover:bg-[#DC3545]/10 rounded transition-colors"
                            aria-label="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-[#e9ecef] text-[#343A40] text-sm font-semibold bg-white hover:bg-[#F8F9FA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={openAddUserModal}
              className="px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors"
            >
              Add User
            </button>
          </div>
        </>
      )}

      {/* Add New User modal */}
      {showAddUserModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeAddUserModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-user-modal-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e9ecef]">
              <h2 id="add-user-modal-title" className="text-lg font-bold text-[#343A40]">
                Add New User
              </h2>
              <button
                type="button"
                onClick={closeAddUserModal}
                className="p-2 rounded-lg text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#343A40] transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="add-user-firstname"
                    className="block text-sm font-medium text-[#343A40]"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="add-user-firstname"
                    type="text"
                    value={addUserForm.firstName}
                    onChange={(e) => handleAddUserFieldChange("firstName", e.target.value)}
                    placeholder="Enter First Name"
                    required
                    className="w-full rounded-lg border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] placeholder:text-[#6C757D] outline-none focus:border-[#172B4D]"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="add-user-email"
                    className="block text-sm font-medium text-[#343A40]"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="add-user-email"
                    type="email"
                    value={addUserForm.email}
                    onChange={(e) => handleAddUserFieldChange("email", e.target.value)}
                    placeholder="Enter Email"
                    required
                    className="w-full rounded-lg border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] placeholder:text-[#6C757D] outline-none focus:border-[#172B4D]"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor="add-user-lastname"
                    className="block text-sm font-medium text-[#343A40]"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="add-user-lastname"
                    type="text"
                    value={addUserForm.lastName}
                    onChange={(e) => handleAddUserFieldChange("lastName", e.target.value)}
                    placeholder="Enter Last Name"
                    required
                    className="w-full rounded-lg border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] placeholder:text-[#6C757D] outline-none focus:border-[#172B4D]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#e9ecef]">
                <button
                  type="button"
                  onClick={closeAddUserModal}
                  disabled={isAddingUser}
                  className="px-4 py-2 rounded-lg border border-[#e9ecef] text-[#343A40] text-sm font-semibold bg-white hover:bg-[#F8F9FA] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAddingUser ? "Adding…" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeDeleteConfirm()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-[#e9ecef]">
              <h2 id="delete-confirm-title" className="text-lg font-bold text-[#343A40]">
                Confirm Delete
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#343A40]">
                Are you sure you want to remove <strong>{deleteConfirm.displayName}</strong> from
                associated users? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6 pt-4">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  disabled={isDeletingUser}
                  className="px-4 py-2 rounded-lg border border-[#e9ecef] text-[#343A40] text-sm font-semibold bg-white hover:bg-[#F8F9FA] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingUser}
                  className="px-4 py-2 rounded-lg bg-[#DC3545] text-white text-sm font-semibold hover:bg-[#c82333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeletingUser ? "Deleting…" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssociatedUsers;
