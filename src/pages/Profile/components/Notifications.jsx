import { FiInfo } from "react-icons/fi";
import { usePopup } from "../../../components/Popup";
import React, { useState, useEffect, useRef } from "react";
import { useNotifications } from "../../../hooks/useNotifications";
import { getNotificationsFromProfilePage } from "../../../lib/api/Notifications/Notification";
import { getNotificationData, updateNotificationData } from "../../../lib/api/profile/profile";

const NOTIFICATION_OPTIONS = [
  {
    id: "expiration",
    title: "Subscription Expiration Reminder",
    description:
      "Get notified before your subscription expires. Choose one or more days in advance for receiving reminders.",
    hasDropdown: true,
  },
  {
    id: "planChange",
    title: "Plan Change Confirmation",
    description: "Receive an email when your subscription plan is changed.",
    hasDropdown: false,
  },
  {
    id: "policyUpdates",
    title: "Important Policy Updates",
    description: "Get notified about important policy or terms of service updates.",
    hasDropdown: false,
  },
  {
    id: "cancelled",
    title: "Subscription Cancelled",
    description: "Receive a confirmation when a subscription is cancelled.",
    hasDropdown: false,
  },
];

const EXPIRATION_DAYS_VALUES = ["7", "15", "30", "60"];
const EXPIRATION_DAYS_OPTIONS = [
  { label: "Select All", value: "all" },
  ...EXPIRATION_DAYS_VALUES.map((d) => ({ label: `${d} days`, value: d })),
];

function apiDaysToOption(val) {
  if (val == null || val === "") return ["30"];
  const s = String(val).trim();
  const parts = s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const valid = parts.filter((n) => EXPIRATION_DAYS_VALUES.includes(n));
  if (valid.length === 0) return ["30"];
  return valid;
}

function optionToApiDays(selectedDays) {
  if (!Array.isArray(selectedDays) || selectedDays.length === 0) return "30";
  const valid = selectedDays.filter((d) => EXPIRATION_DAYS_VALUES.includes(String(d)));
  return valid.length > 0 ? valid.join(",") : "30";
}

function notificationStateToPayload(
  contactId,
  emailToggles,
  pushToggles,
  emailExpirationDays,
  pushExpirationDays
) {
  return {
    contactId,
    yiic_subscriptionexpirationreminder: !!pushToggles.expiration,
    yiic_planchangeconfirmation: !!pushToggles.planChange,
    yiic_importantpolicyupdate: !!pushToggles.policyUpdates,
    yiic_subscriptioncancelled: !!pushToggles.cancelled,
    yiic_daysforreminder: optionToApiDays(pushExpirationDays),
    yiic_emailsubscriptionexpirationreminder: !!emailToggles.expiration,
    yiic_emailplanchangeconfirmation: !!emailToggles.planChange,
    yiic_emailimportantpolicyupdate: !!emailToggles.policyUpdates,
    yiic_emailsubscriptioncancelled: !!emailToggles.cancelled,
    yiic_emaildaysforreminder: optionToApiDays(emailExpirationDays),
  };
}

function Notifications({ contactId, isActive }) {
  const { showSuccess, showError } = usePopup();
  const { invalidate: invalidateNotifications } = useNotifications();
  const [notificationData, setNotificationData] = useState(null);
  const [isLoadingNotificationData, setIsLoadingNotificationData] = useState(false);
  const [isSavingNotification, setIsSavingNotification] = useState(false);
  const [emailToggles, setEmailToggles] = useState(
    Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.id, false]))
  );
  const [pushToggles, setPushToggles] = useState(
    Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.id, false]))
  );
  const [emailExpirationDays, setEmailExpirationDays] = useState(["30"]);
  const [pushExpirationDays, setPushExpirationDays] = useState(["30"]);
  const [savedNotificationState, setSavedNotificationState] = useState(null);
  const emailDaysDropdownRef = useRef(null);
  const pushDaysDropdownRef = useRef(null);
  const [emailDaysDropdownOpen, setEmailDaysDropdownOpen] = useState(false);
  const [pushDaysDropdownOpen, setPushDaysDropdownOpen] = useState(false);

  const setEmailToggle = (id, value) => {
    setEmailToggles((prev) => ({ ...prev, [id]: value }));
  };
  const setPushToggle = (id, value) => {
    setPushToggles((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    if (!isActive || !contactId) return;
    setIsLoadingNotificationData(true);
    getNotificationData(contactId)
      .then((data) => {
        const raw = Array.isArray(data) ? data[0] : (data?.value?.[0] ?? data);
        setNotificationData(raw ?? null);
      })
      .catch((err) => {
        console.error("Failed to load notification data:", err);
        showError("Unable to load your notification preferences. Please refresh the page.");
      })
      .finally(() => {
        setIsLoadingNotificationData(false);
      });
  }, [isActive, contactId, showError]);

  useEffect(() => {
    if (!notificationData || typeof notificationData !== "object") return;
    const emailT = {
      expiration: !!notificationData.yiic_emailsubscriptionexpirationreminder,
      planChange: !!notificationData.yiic_emailplanchangeconfirmation,
      policyUpdates: !!notificationData.yiic_emailimportantpolicyupdate,
      cancelled: !!notificationData.yiic_emailsubscriptioncancelled,
    };
    const pushT = {
      expiration: !!notificationData.yiic_subscriptionexpirationreminder,
      planChange: !!notificationData.yiic_planchangeconfirmation,
      policyUpdates: !!notificationData.yiic_importantpolicyupdate,
      cancelled: !!notificationData.yiic_subscriptioncancelled,
    };
    const emailDays = apiDaysToOption(notificationData.yiic_emaildaysforreminder);
    const pushDays = apiDaysToOption(notificationData.yiic_daysforreminder);
    setEmailToggles(emailT);
    setPushToggles(pushT);
    setEmailExpirationDays(emailDays);
    setPushExpirationDays(pushDays);
    setSavedNotificationState({
      emailToggles: emailT,
      pushToggles: pushT,
      emailExpirationDays: emailDays,
      pushExpirationDays: pushDays,
    });
  }, [notificationData]);

  const hasNotificationChanges =
    savedNotificationState != null &&
    (JSON.stringify(emailToggles) !== JSON.stringify(savedNotificationState.emailToggles) ||
      JSON.stringify(pushToggles) !== JSON.stringify(savedNotificationState.pushToggles) ||
      JSON.stringify(emailExpirationDays) !==
        JSON.stringify(savedNotificationState.emailExpirationDays) ||
      JSON.stringify(pushExpirationDays) !==
        JSON.stringify(savedNotificationState.pushExpirationDays));

  const handleCancel = () => {
    if (savedNotificationState) {
      setEmailToggles(savedNotificationState.emailToggles);
      setPushToggles(savedNotificationState.pushToggles);
      setEmailExpirationDays([...savedNotificationState.emailExpirationDays]);
      setPushExpirationDays([...savedNotificationState.pushExpirationDays]);
    }
  };

  const handleSave = () => {
    if (!hasNotificationChanges || isSavingNotification) return;
    const payload = notificationStateToPayload(
      contactId,
      emailToggles,
      pushToggles,
      emailExpirationDays,
      pushExpirationDays
    );
    setIsSavingNotification(true);
    updateNotificationData(payload)
      .then(() => {
        getNotificationsFromProfilePage();
        setSavedNotificationState({
          emailToggles: { ...emailToggles },
          pushToggles: { ...pushToggles },
          emailExpirationDays: [...emailExpirationDays],
          pushExpirationDays: [...pushExpirationDays],
        });
        setNotificationData((prev) => (prev ? { ...prev, ...payload } : null));
        showSuccess("Your notification preferences have been saved successfully.");
      })
      .catch((err) => {
        console.error("Failed to save notification data:", err);
        showError("Unable to save your notification preferences. Please try again.");
      })
      .finally(() => {
        setIsSavingNotification(false);
      });
  };

  const isAllSelected = (arr) =>
    EXPIRATION_DAYS_VALUES.length > 0 && EXPIRATION_DAYS_VALUES.every((d) => arr.includes(d));
  const formatExpirationDisplay = (selected) =>
    isAllSelected(selected) ? "All" : selected.map((d) => `${d} days`).join(", ") || "None";
  const toggleExpirationDay = (current, setter, value) => {
    if (value === "all") {
      setter(isAllSelected(current) ? [] : [...EXPIRATION_DAYS_VALUES]);
      return;
    }
    setter(current.includes(value) ? current.filter((d) => d !== value) : [...current, value]);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emailDaysDropdownRef.current && !emailDaysDropdownRef.current.contains(e.target)) {
        setEmailDaysDropdownOpen(false);
      }
      if (pushDaysDropdownRef.current && !pushDaysDropdownRef.current.contains(e.target)) {
        setPushDaysDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-[#e9ecef] shadow-sm p-4 sm:p-6">
      {isLoadingNotificationData ? (
        <>
          <div className="pb-8 mb-8 border-b border-[#e9ecef] flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            <div className="md:w-[200px] lg:w-[600px] flex-shrink-0 space-y-2">
              <div className="h-4 w-40 bg-[#e9ecef] rounded animate-pulse" />
              <div className="h-3 w-72 bg-[#e9ecef] rounded animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-6 w-11 rounded-full bg-[#e9ecef] animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-48 bg-[#e9ecef] rounded animate-pulse" />
                    <div className="h-3 w-64 bg-[#e9ecef] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pb-8 mb-8 border-b border-[#e9ecef] flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            <div className="md:w-[200px] lg:w-[600px] flex-shrink-0 space-y-2">
              <div className="h-4 w-36 bg-[#e9ecef] rounded animate-pulse" />
              <div className="h-3 w-72 bg-[#e9ecef] rounded animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-6 w-11 rounded-full bg-[#e9ecef] animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-48 bg-[#e9ecef] rounded animate-pulse" />
                    <div className="h-3 w-64 bg-[#e9ecef] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <div className="h-9 w-20 bg-[#e9ecef] rounded-lg animate-pulse" />
            <div className="h-9 w-16 bg-[#e9ecef] rounded-lg animate-pulse" />
          </div>
        </>
      ) : (
        <>
          <div className="pb-8 mb-8 border-b border-[#e9ecef] flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            <div className="md:w-[200px] lg:w-[600px] flex-shrink-0">
              <h3 className="text-base font-bold text-[#343A40] mb-1">Email Notifications</h3>
              <p className="text-xs sm:text-sm text-[#6C757D]">
                Receive emails to stay informed about your subscriptions and renewals.
              </p>
            </div>
            <div className="flex-1 min-w-0 space-y-6">
              {NOTIFICATION_OPTIONS.map((opt) => (
                <div
                  key={`email-${opt.id}`}
                  className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailToggles[opt.id]}
                      onClick={() => setEmailToggle(opt.id, !emailToggles[opt.id])}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#172B4D] focus:ring-offset-2 cursor-pointer ${
                        emailToggles[opt.id] ? "bg-[#172B4D]" : "bg-[#e9ecef]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-out ${
                          emailToggles[opt.id] ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#343A40]">{opt.title}</span>
                        {opt.hasDropdown && (
                          <FiInfo className="w-4 h-4 text-[#6C757D] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#6C757D] mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                  {opt.hasDropdown && (
                    <div className="flex-shrink-0 relative" ref={emailDaysDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setEmailDaysDropdownOpen((o) => !o)}
                        disabled={!emailToggles[opt.id]}
                        className="rounded-lg border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] bg-white outline-none focus:border-[#172B4D] min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed text-left flex items-center justify-between gap-2"
                      >
                        <span className="truncate">
                          {formatExpirationDisplay(emailExpirationDays)}
                        </span>
                        <span
                          className={`transition-transform ${emailDaysDropdownOpen ? "rotate-180" : ""}`}
                          aria-hidden
                        >
                          ▼
                        </span>
                      </button>
                      {emailDaysDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-[#e9ecef] rounded-lg shadow-lg py-1 min-w-[140px]">
                          {EXPIRATION_DAYS_OPTIONS.map((item) => (
                            <label
                              key={item.value}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8F9FA] cursor-pointer text-sm text-[#343A40]"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  item.value === "all"
                                    ? isAllSelected(emailExpirationDays)
                                    : emailExpirationDays.includes(item.value)
                                }
                                onChange={() =>
                                  toggleExpirationDay(
                                    emailExpirationDays,
                                    setEmailExpirationDays,
                                    item.value
                                  )
                                }
                                className="rounded border-[#e9ecef] text-[#172B4D] focus:ring-[#172B4D]"
                              />
                              {item.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pb-8 mb-8 border-b border-[#e9ecef] flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            <div className="md:w-[200px] lg:w-[600px] flex-shrink-0">
              <h3 className="text-base font-bold text-[#343A40] mb-1">Push Notifications</h3>
              <p className="text-xs sm:text-sm text-[#6C757D]">
                Receive push notifications in-app to find out what&apos;s going on when you&apos;re
                online.
              </p>
            </div>
            <div className="flex-1 min-w-0 space-y-6">
              {NOTIFICATION_OPTIONS.map((opt) => (
                <div
                  key={`push-${opt.id}`}
                  className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pushToggles[opt.id]}
                      onClick={() => setPushToggle(opt.id, !pushToggles[opt.id])}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#172B4D] focus:ring-offset-2 cursor-pointer ${
                        pushToggles[opt.id] ? "bg-[#172B4D]" : "bg-[#e9ecef]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-out ${
                          pushToggles[opt.id] ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#343A40]">{opt.title}</span>
                        {opt.hasDropdown && (
                          <FiInfo className="w-4 h-4 text-[#6C757D] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#6C757D] mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                  {opt.hasDropdown && (
                    <div className="flex-shrink-0 relative" ref={pushDaysDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setPushDaysDropdownOpen((o) => !o)}
                        disabled={!pushToggles[opt.id]}
                        className="rounded-lg border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] bg-white outline-none focus:border-[#172B4D] min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed text-left flex items-center justify-between gap-2"
                      >
                        <span className="truncate">
                          {formatExpirationDisplay(pushExpirationDays)}
                        </span>
                        <span
                          className={`transition-transform ${pushDaysDropdownOpen ? "rotate-180" : ""}`}
                          aria-hidden
                        >
                          ▼
                        </span>
                      </button>
                      {pushDaysDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-[#e9ecef] rounded-lg shadow-lg py-1 min-w-[140px]">
                          {EXPIRATION_DAYS_OPTIONS.map((item) => (
                            <label
                              key={item.value}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8F9FA] cursor-pointer text-sm text-[#343A40]"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  item.value === "all"
                                    ? isAllSelected(pushExpirationDays)
                                    : pushExpirationDays.includes(item.value)
                                }
                                onChange={() =>
                                  toggleExpirationDay(
                                    pushExpirationDays,
                                    setPushExpirationDays,
                                    item.value
                                  )
                                }
                                className="rounded border-[#e9ecef] text-[#172B4D] focus:ring-[#172B4D]"
                              />
                              {item.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!hasNotificationChanges || isSavingNotification}
              className="px-4 py-2 rounded-lg border border-[#e9ecef] text-[#343A40] text-sm font-semibold bg-white hover:bg-[#F8F9FA] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!hasNotificationChanges || isSavingNotification}
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingNotification ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Notifications;
