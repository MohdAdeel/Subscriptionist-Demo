import {
  getProfile,
  updateContact,
  getProfileImage,
  updateProfilePicture,
} from "../../lib/api/profile/profile";
import { FiUpload } from "react-icons/fi";
import { useAuthStore } from "../../stores";
import { usePopup } from "../../components/Popup";
import React, { useState, useEffect } from "react";
import Notifications from "./components/Notifications";
import AssociatedUsers from "./components/AssociatedUsers";

const TABS = [
  { id: "personal", label: "Personal Information" },
  { id: "notification", label: "Notification Settings" },
  { id: "associated", label: "Associated Users" },
];

// Map API contact object to form fields (API returns array with one object)
// Fields: contactid, telephone1, emailaddress1, firstname, lastname, adx_organizationname, accountrolecode, websiteurl
function mapProfileToForm(contact) {
  if (!contact || typeof contact !== "object") return null;
  return {
    firstName: contact.firstname != null ? contact.firstname : "",
    lastName: contact.lastname != null ? contact.lastname : "",
    email: contact.emailaddress1 != null ? contact.emailaddress1 : "",
    role: contact.accountrolecode != null ? contact.accountrolecode : "",
    businessPhone: contact.telephone1 != null ? contact.telephone1 : "",
    organizationName: contact.adx_organizationname != null ? contact.adx_organizationname : "",
    website: contact.websiteurl != null ? contact.websiteurl : "",
  };
}

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  businessPhone: "",
  organizationName: "",
  website: "",
};

// Map form fields back to API update payload
function formToUpdatePayload(form) {
  return {
    firstname: form.firstName ?? "",
    lastname: form.lastName ?? "",
    emailaddress1: form.email ?? "",
    accountrolecode: form.role ?? "",
    telephone1: form.businessPhone ?? "",
    adx_organizationname: form.organizationName ?? "",
    websiteurl: form.website ?? "",
  };
}

function Profile() {
  const { showError, showSuccess } = usePopup();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const userAuth = useAuthStore((state) => state.userAuth);
  const contactId = userAuth?.contactid;

  useEffect(() => {
    getProfile(contactId)
      .then((data) => {
        const contact = Array.isArray(data) ? data[0] : (data?.value?.[0] ?? data);
        setProfile(contact ?? null);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        showError("Unable to load your profile. Please refresh the page.");
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [showError]);

  // When we have profile, populate the form
  useEffect(() => {
    if (profile && typeof profile === "object") {
      const mapped = mapProfileToForm(profile);
      if (mapped) {
        setForm(mapped);
      }
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    const contactId = profile?.contactid;
    const payload = formToUpdatePayload(form);
    setIsSaving(true);
    updateContact(contactId, payload)
      .then((data) => {
        setProfile((prev) => (prev ? { ...prev, ...payload } : null));
        showSuccess("Your profile has been updated successfully.");
      })
      .catch((err) => {
        showError("Unable to save your profile. Please try again.");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleCancel = () => {
    if (profile) {
      const mapped = mapProfileToForm(profile);
      if (mapped) setForm(mapped);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const contactId = profile?.contactid;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 =
        typeof dataUrl === "string" && dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      setIsUploadingImage(true);
      updateProfilePicture(contactId, base64)
        .then(() => {
          setProfileImageUrl(dataUrl);
          showSuccess("Your profile photo has been updated successfully.");
        })
        .catch((err) => {
          console.error("Failed to update profile picture:", err);
          showError("Unable to update your profile photo. Please try again.");
        })
        .finally(() => {
          setIsUploadingImage(false);
        });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const avatarInitials =
    form.firstName || form.lastName
      ? ((form.firstName?.[0] ?? "") + (form.lastName?.[0] ?? "")).toUpperCase() || "?"
      : "PP";

  useEffect(() => {
    getProfileImage(contactId)
      .then((data) => {
        setProfileImageUrl(data?.value[0]?.entityimage_url);
      })
      .catch((err) => {
        console.error("Failed to load profile image:", err);
        showError("Unable to load your profile photo. Please refresh the page.");
      });
  }, [showError]);

  return (
    <div className="bg-[#f6f7fb] p-3 sm:p-4 md:p-6 font-sans min-h-screen">
      {/* Tabs */}
      <div className="border-b border-[#e9ecef] mb-6 flex justify-between items-center">
        <div className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#172B4D] text-[#172B4D] bg-white/50"
                  : "border-transparent text-[#6C757D] hover:text-[#343A40] hover:border-[#e9ecef]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="order-5 sm:order-none px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors"
        >
          Reset Password
        </button>
      </div>

      {/* Content - Personal Information */}
      {activeTab === "personal" && (
        <div className="bg-white rounded-lg border border-[#e9ecef] shadow-sm p-6">
          {isLoadingProfile ? (
            /* Skeleton when data is not available */
            <>
              <div className="pb-6 mb-6 border-b border-[#e9ecef]">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-[280px] flex-shrink-0 space-y-2">
                    <div className="h-4 w-24 bg-[#e9ecef] rounded animate-pulse" />
                    <div className="h-3 w-48 bg-[#e9ecef] rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-[72px] h-[72px] rounded-full bg-[#e9ecef] animate-pulse flex-shrink-0" />
                    <div className="flex-1 h-[120px] rounded-lg bg-[#e9ecef] animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="pb-6 mb-6 border-b border-[#e9ecef]">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-[280px] flex-shrink-0 space-y-2">
                    <div className="h-4 w-28 bg-[#e9ecef] rounded animate-pulse" />
                    <div className="h-3 w-56 bg-[#e9ecef] rounded animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-4 max-w-[600px]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="h-3 w-20 bg-[#e9ecef] rounded animate-pulse" />
                        <div className="h-10 w-full bg-[#e9ecef] rounded-md animate-pulse" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="h-3 w-20 bg-[#e9ecef] rounded animate-pulse" />
                        <div className="h-10 w-full bg-[#e9ecef] rounded-md animate-pulse" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 w-14 bg-[#e9ecef] rounded animate-pulse" />
                      <div className="h-10 w-full bg-[#e9ecef] rounded-md animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 w-12 bg-[#e9ecef] rounded animate-pulse" />
                      <div className="h-10 w-full bg-[#e9ecef] rounded-md animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-[280px] flex-shrink-0 space-y-2">
                    <div className="h-4 w-36 bg-[#e9ecef] rounded animate-pulse" />
                    <div className="h-3 w-52 bg-[#e9ecef] rounded animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-4 max-w-[600px]">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="h-3 w-28 bg-[#e9ecef] rounded animate-pulse" />
                        <div className="h-10 w-full bg-[#e9ecef] rounded-md animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <div className="h-9 w-20 bg-[#e9ecef] rounded-md animate-pulse" />
                <div className="h-9 w-16 bg-[#e9ecef] rounded-md animate-pulse" />
              </div>
            </>
          ) : (
            /* Form when data is available */
            <>
              {/* Your Photo */}
              <div className="pb-6 mb-6 border-b border-[#e9ecef]">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-[280px] flex-shrink-0">
                    <h3 className="text-sm font-bold text-[#343A40] mb-1">Your Photo</h3>
                    <p className="text-xs text-[#6C757D]">This Will be displayed on you profile.</p>
                  </div>
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-[72px] h-[72px] rounded-full bg-[#6C757D] flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0 overflow-hidden">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        avatarInitials
                      )}
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-[#e9ecef] rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:border-[#172B4D]/30 hover:bg-[#f8f9fa] transition-colors">
                        <FiUpload className="w-6 h-6 text-[#6C757D]" />
                        <span className="text-sm font-medium text-[#343A40]">
                          {isUploadingImage ? "Uploading..." : "Click to upload"}
                        </span>
                        <span className="text-xs text-[#6C757D] text-center">
                          SVG, PNG, JPG or GIF (max. 800x400px)
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".svg,.png,.jpg,.jpeg,.gif"
                        onChange={handlePhotoChange}
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Main Information */}
              <div className="pb-6 mb-6 border-b border-[#e9ecef]">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-[280px] flex-shrink-0">
                    <h3 className="text-sm font-bold text-[#343A40] mb-1">Main Information</h3>
                    <p className="text-xs text-[#6C757D]">
                      Fill in the main information about yourself, it will be displayed on your
                      profile.
                    </p>
                  </div>
                  <div className="flex-1 space-y-4 max-w-[600px]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#343A40] font-medium">First Name</label>
                        <input
                          type="text"
                          value={form.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          className="w-full rounded-md border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] outline-none focus:border-[#172B4D] focus:ring-1 focus:ring-[#172B4D]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#343A40] font-medium">Last Name</label>
                        <input
                          type="text"
                          value={form.lastName}
                          onChange={(e) => handleChange("lastName", e.target.value)}
                          className="w-full rounded-md border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] outline-none focus:border-[#172B4D] focus:ring-1 focus:ring-[#172B4D]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#343A40] font-medium">E-mail</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="w-full rounded-md border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] outline-none focus:border-[#172B4D] focus:ring-1 focus:ring-[#172B4D]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#343A40] font-medium">Role</label>
                      <input
                        type="text"
                        value={form.role}
                        onChange={(e) => handleChange("role", e.target.value)}
                        placeholder="Provide a Role"
                        className="w-full rounded-md border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] placeholder:text-[#9CA3AF] outline-none focus:border-[#172B4D] focus:ring-1 focus:ring-[#172B4D]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-[280px] flex-shrink-0">
                    <h3 className="text-sm font-bold text-[#343A40] mb-1">
                      Additional Information
                    </h3>
                    <p className="text-xs text-[#6C757D]">
                      Fill in the additional information about yourself, it will be displayed on
                      your profile.
                    </p>
                  </div>
                  <div className="flex-1 space-y-4 max-w-[600px]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#343A40] font-medium">Business Phone</label>
                      <input
                        type="tel"
                        value={form.businessPhone}
                        onChange={(e) => handleChange("businessPhone", e.target.value)}
                        placeholder="Provide a telephone number"
                        className="w-full rounded-md border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] placeholder:text-[#9CA3AF] outline-none focus:border-[#172B4D] focus:ring-1 focus:ring-[#172B4D]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#343A40] font-medium">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={form.organizationName}
                        onChange={(e) => handleChange("organizationName", e.target.value)}
                        placeholder="Provide an organization name"
                        className="w-full rounded-md border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] placeholder:text-[#9CA3AF] outline-none focus:border-[#172B4D] focus:ring-1 focus:ring-[#172B4D]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#343A40] font-medium">Web Site</label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => handleChange("website", e.target.value)}
                        placeholder="Provide a link"
                        className="w-full rounded-md border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] placeholder:text-[#9CA3AF] outline-none focus:border-[#172B4D] focus:ring-1 focus:ring-[#172B4D]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-md border border-[#e9ecef] text-[#343A40] text-sm font-semibold bg-white hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-md bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Notification Settings tab */}
      {activeTab === "notification" && (
        <Notifications contactId={profile?.contactid} isActive={activeTab === "notification"} />
      )}

      {/* Associated Users tab */}
      {activeTab === "associated" && (
        <AssociatedUsers contactId={profile?.contactid} isActive={activeTab === "associated"} />
      )}
    </div>
  );
}

export default Profile;
