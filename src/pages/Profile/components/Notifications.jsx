import { FiInfo } from "react-icons/fi";
import React, { useState, useEffect } from "react";
import { getNotificationData, updateNotificationData } from "../../../lib/api/profile/profile";
import { usePopup } from "../../../components/Popup";

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

const EXPIRATION_DAYS_OPTIONS = ["7 days", "14 days", "30 days", "60 days", "90 days"];

function apiDaysToOption(val) {
  if (val == null || val === "") return "30 days";
  const s = String(val).trim();
  if (EXPIRATION_DAYS_OPTIONS.includes(s)) return s;
  const num = parseInt(s, 10);
  if (!Number.isNaN(num)) return `${num} days`;
  return "30 days";
}

function optionToApiDays(option) {
  if (option == null || typeof option !== "string") return "30";
  const num = parseInt(option.replace(/\s*days?$/i, ""), 10);
  return Number.isNaN(num) ? "30" : String(num);
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
  const [notificationData, setNotificationData] = useState(null);
  const [isLoadingNotificationData, setIsLoadingNotificationData] = useState(false);
  const [isSavingNotification, setIsSavingNotification] = useState(false);
  const [emailToggles, setEmailToggles] = useState(
    Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.id, false]))
  );
  const [pushToggles, setPushToggles] = useState(
    Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.id, false]))
  );
  const [emailExpirationDays, setEmailExpirationDays] = useState("30 days");
  const [pushExpirationDays, setPushExpirationDays] = useState("30 days");
  const [savedNotificationState, setSavedNotificationState] = useState(null);

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
      emailExpirationDays !== savedNotificationState.emailExpirationDays ||
      pushExpirationDays !== savedNotificationState.pushExpirationDays);

  const handleCancel = () => {
    if (savedNotificationState) {
      setEmailToggles(savedNotificationState.emailToggles);
      setPushToggles(savedNotificationState.pushToggles);
      setEmailExpirationDays(savedNotificationState.emailExpirationDays);
      setPushExpirationDays(savedNotificationState.pushExpirationDays);
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
        setSavedNotificationState({
          emailToggles: { ...emailToggles },
          pushToggles: { ...pushToggles },
          emailExpirationDays,
          pushExpirationDays,
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
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#172B4D] focus:ring-offset-2 ${
                        emailToggles[opt.id] ? "bg-[#172B4D]" : "bg-[#e9ecef]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-out ${
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
                    <select
                      value={emailExpirationDays}
                      onChange={(e) => setEmailExpirationDays(e.target.value)}
                      disabled={!emailToggles[opt.id]}
                      className="flex-shrink-0 rounded-lg border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] bg-white outline-none focus:border-[#172B4D] min-w-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {EXPIRATION_DAYS_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
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
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#172B4D] focus:ring-offset-2 ${
                        pushToggles[opt.id] ? "bg-[#172B4D]" : "bg-[#e9ecef]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-out ${
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
                    <select
                      value={pushExpirationDays}
                      onChange={(e) => setPushExpirationDays(e.target.value)}
                      disabled={!pushToggles[opt.id]}
                      className="flex-shrink-0 rounded-lg border border-[#e9ecef] px-3 py-2 text-sm text-[#343A40] bg-white outline-none focus:border-[#172B4D] min-w-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {EXPIRATION_DAYS_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
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
