import { useAuthStore } from "../stores";
import { useMsal } from "@azure/msal-react";
import SkeletonLoader from "./SkeletonLoader";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { dismissNotification } from "../lib/api/Notifications/Notification";
import { FiBell, FiChevronDown, FiCheckCircle, FiCalendar, FiX } from "react-icons/fi";

/** Format ISO date string to "X seconds/minutes/hours ago" or "Just now" */
function formatTimeAgo(isoString) {
  if (!isoString) return "Just now";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffSec > 0) return `${diffSec} second${diffSec > 1 ? "s" : ""} ago`;
  return "Just now";
}

/**
 * Transform API notification response into flat list for UI.
 * API: { todaySubscriptionsadded: [], subscriptionsDueInDays: [] }
 */
function transformNotificationsPayload(data) {
  if (!data) return [];
  const list = [];
  (data.todaySubscriptionsadded || []).forEach((item) => {
    list.push({
      id: `new-${item.activityId}`,
      type: "new",
      title: `${item.subscriptionName} subscription was added`,
      message:
        [item.subscriptionName, item.vendorName].filter(Boolean).join(" · ") ||
        item.subscriptionName,
      // time: formatTimeAgo(item.subscriptionCreatedOn),
    });
  });

  (data.subscriptionsDueInDays || []).forEach((item) => {
    const days = item.daysUntilDue ?? 0;
    const title =
      days === 0
        ? `${item.subscriptionName} due today`
        : days === 1
          ? `${item.subscriptionName} due date is tomorrow`
          : `${item.subscriptionName} due date is in ${days} days`;
    list.push({
      id: `due-${item.activityId}`,
      type: "due",
      title,
      message: item.subscriptionName || "Subscription",
      // time: days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`,
    });
  });

  return list;
}

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const { instance } = useMsal();
  const [timeAgo, setTimeAgo] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dismissHoveredId, setDismissHoveredId] = useState(null);

  const userAuth = useAuthStore((state) => state.userAuth);
  const isUserLoading = useAuthStore((state) => state.userAuthLoading);
  const userName = userAuth
    ? `${userAuth.firstname || ""} ${userAuth.lastname || ""}`.trim() || "User"
    : "User";
  const userPhoto = userAuth?.entityimage || null;
  const lastUpdateTime = userAuth?.yiic_subscriptionlastupdate
    ? new Date(userAuth.yiic_subscriptionlastupdate)
    : null;
  // Map routes to page names
  const getPageName = () => {
    const pathMap = {
      "/": null, // Welcome + userName rendered separately on home
      "/reports": "Reports",
      "/subscriptions": "Subscriptions",
      "/vendors": "Vendors",
      "/mytasks": "My Tasks",
      "/faqs": "FAQs",
    };
    return pathMap[location.pathname] ?? "Dashboard";
  };

  const isWelcomePage = location.pathname === "/";

  // Calculate time ago
  useEffect(() => {
    const calculateTimeAgo = () => {
      if (!lastUpdateTime) {
        setTimeAgo("Just now");
        return;
      }

      const now = new Date();
      const updateTime = new Date(lastUpdateTime);
      const diffInMs = now - updateTime;
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays > 0) {
        setTimeAgo(`${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`);
      } else if (diffInHours > 0) {
        setTimeAgo(`${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`);
      } else if (diffInMinutes > 0) {
        setTimeAgo(`${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`);
      } else {
        setTimeAgo("Just now");
      }
    };

    calculateTimeAgo();
    const interval = setInterval(calculateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isProfileClick =
        profileDropdownRef.current && profileDropdownRef.current.contains(event.target);
      const isNotificationClick =
        notificationDropdownRef.current && notificationDropdownRef.current.contains(event.target);

      if (!isProfileClick) setIsDropdownOpen(false);
      if (!isNotificationClick) setIsNotificationOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    instance.logoutRedirect();
  };

  const removeSpecificNotification = (item) => {
    const activityId = item.id?.replace(/^(new|due)-/, "");
    const contactId = userAuth?.contactid;
    const isRead = false;
    const payload = {
      contactId,
      activityId,
      isRead,
    };
    console.log(payload);
    dismissNotification(payload)
      .then(() => {
        invalidateNotifications();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const {
    data: notificationsPayload,
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications,
    invalidate: invalidateNotifications,
  } = useNotifications();

  const notificationsList = useMemo(
    () => transformNotificationsPayload(notificationsPayload),
    [notificationsPayload]
  );
  const unreadCount = notificationsList.length;

  const removeAllNotifications = () => {
    const contactId = userAuth?.contactid;
    if (!contactId) return;
    const payload = { contactId, isRead: true };
    dismissNotification(payload)
      .then(() => {
        invalidateNotifications();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const notificationThemes = {
    new: {
      accent: "#28A745",
      softBg: "#E9F7EF",
      icon: <FiCheckCircle className="text-lg" />,
      label: "New Subscription",
    },
    due: {
      accent: "#F59E0B",
      softBg: "#FFF7E6",
      icon: <FiCalendar className="text-lg" />,
      label: "Renewal Reminder",
    },
  };

  return (
    <header className="bg-white border-b border-[#e9ecef] px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Side - User Name or Page Name */}
        <div className="flex items-center min-w-0">
          {isUserLoading ? (
            <div className="flex items-center gap-2">
              <SkeletonLoader
                variant="text"
                count={1}
                width="7rem"
                height="1.75rem"
                className="skeleton-smooth rounded-lg bg-[#e9ecef]"
              />
              <SkeletonLoader
                variant="text"
                count={1}
                width="8rem"
                height="1.75rem"
                className="skeleton-smooth rounded-lg bg-[#e9ecef]"
              />
            </div>
          ) : (
            <h1 className="text-xl sm:text-2xl font-bold m-0 flex items-baseline gap-1 flex-wrap">
              {isWelcomePage ? (
                <>
                  <span className="text-[#172B4D]">Welcome</span>
                  <span className="text-[#172B4D] font-bold ">{userName}</span>
                </>
              ) : (
                <span className="text-[#172B4D]">{getPageName()}</span>
              )}
            </h1>
          )}
        </div>

        {/* Right Side - Last Update, Bell, Profile */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Last Update - hidden on profile page */}
          {location.pathname !== "/profile" && (
            <div className="hidden sm:flex items-center gap-2">
              {isUserLoading ? (
                <>
                  <SkeletonLoader
                    variant="text"
                    count={1}
                    width="4rem"
                    height="0.875rem"
                    className="skeleton-smooth rounded bg-[#e9ecef]"
                  />
                  <SkeletonLoader
                    variant="text"
                    count={1}
                    width="3.5rem"
                    height="0.875rem"
                    className="skeleton-smooth rounded bg-[#e9ecef]"
                  />
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-sm text-[#6C757D] font-medium">Last Update</span>
                  <span className="text-xs sm:text-sm text-[#343A40] font-semibold">{timeAgo}</span>
                </>
              )}
            </div>
          )}

          {/* Bell Icon */}
          <div
            className="relative cursor-pointer group"
            ref={notificationDropdownRef}
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsDropdownOpen(false);
            }}
          >
            <div className="p-2 rounded-lg hover:bg-[#f6f7fb] transition-all duration-200 flex items-center">
              <FiBell className="text-xl text-[#172B4D] group-hover:text-[#000435] transition-colors" />
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-semibold text-[#172B4D] bg-[#f6f7fb] px-2 py-0.5 rounded-full border border-[#e9ecef]">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC3545] rounded-full border-2 border-white"></span>
            )}

            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-96 max-w-[22rem] bg-white rounded-xl shadow-xl border border-[#e9ecef] overflow-hidden z-50 animate-fadeIn">
                <div className="flex items-start justify-between px-4 py-3 border-b border-[#e9ecef] bg-[#f6f7fb]">
                  <div>
                    <p className="text-sm font-semibold text-[#172B4D]">Notifications</p>
                    <p className="text-xs text-[#6C757D]">
                      {notificationsLoading ? "Loading…" : `${unreadCount} new updates`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAllNotifications()}
                    className="text-xs font-semibold text-[#172B4D] hover:text-[#000435] transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-[#6C757D]">
                      Loading notifications…
                    </div>
                  ) : notificationsError ? (
                    <div className="px-4 py-6 text-center text-sm text-[#6C757D]">
                      <p className="text-[#DC3545] mb-2">Failed to load notifications.</p>
                      <button
                        type="button"
                        onClick={() => refetchNotifications()}
                        className="text-xs font-semibold text-[#172B4D] hover:text-[#000435] underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : notificationsList.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-[#6C757D]">
                      No notifications
                    </div>
                  ) : (
                    notificationsList.map((item) => {
                      const theme = notificationThemes[item.type];
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 px-4 py-3 border-b border-[#f1f3f5] last:border-b-0 hover:bg-[#f9fafb] transition-colors"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: theme.softBg, color: theme.accent }}
                          >
                            {theme.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#172B4D] truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs text-[#6C757D] mt-0.5 truncate">
                                  {item.message}
                                </p>
                              </div>
                              <button
                                type="button"
                                aria-label="Dismiss notification"
                                className="flex items-center justify-center w-8 h-8 text-[#6C757D] hover:text-[#172B4D] rounded-lg border border-[#e9ecef] bg-white transition-all duration-200 ease-out hover:bg-[#f6f7fb] hover:border-[#d0d7de] hover:scale-105 active:scale-95 flex-shrink-0"
                                onMouseEnter={() => setDismissHoveredId(item.id)}
                                onMouseLeave={() => setDismissHoveredId(null)}
                                onClick={() => removeSpecificNotification(item)}
                              >
                                <span
                                  className={`inline-flex transition-transform duration-200 ease-out ${dismissHoveredId === item.id ? "rotate-90" : ""}`}
                                >
                                  <FiX className="text-sm" />
                                </span>
                              </button>
                            </div>
                            <p className="text-[11px] text-[#6C757D] mt-1">{item.time}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            {isUserLoading ? (
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#e9ecef] skeleton-smooth flex-shrink-0 border-2 border-[#e9ecef]"
                  aria-hidden
                />
                <div
                  className="w-4 h-4 rounded-full bg-[#e9ecef] skeleton-smooth flex-shrink-0"
                  aria-hidden
                />
              </div>
            ) : (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 sm:gap-3 hover:bg-[#f6f7fb] rounded-lg px-2 sm:px-3 py-2 transition-all duration-200 group"
              >
                {/* User Photo */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#172B4D] to-[#000435] flex items-center justify-center overflow-hidden border-2 border-[#e9ecef] group-hover:border-[#172B4D] transition-all shadow-sm">
                  {userPhoto ? (
                    <img
                      src={
                        userPhoto.startsWith("data:")
                          ? userPhoto
                          : `data:image/png;base64,${userPhoto}`
                      }
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Dropdown Arrow */}
                <FiChevronDown
                  className={`text-[#6C757D] text-sm sm:text-base transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#e9ecef] overflow-hidden animate-fadeIn">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-[#e9ecef] bg-[#f6f7fb]">
                  <p className="text-sm font-semibold text-[#172B4D] truncate">{userName}</p>
                  <p className="text-xs text-[#6C757D] mt-0.5">User Account</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#343A40] hover:bg-[#f6f7fb] hover:text-[#172B4D] transition-all duration-200 font-medium"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#DC3545] hover:bg-red-50 transition-all duration-200 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Last Update (shown below on small screens) */}
      <div className="flex sm:hidden items-center gap-2 mt-3 pt-3 border-t border-[#e9ecef]">
        {isUserLoading ? (
          <>
            <SkeletonLoader
              variant="text"
              count={1}
              width="4rem"
              height="0.75rem"
              className="skeleton-smooth rounded bg-[#e9ecef]"
            />
            <SkeletonLoader
              variant="text"
              count={1}
              width="3.5rem"
              height="0.75rem"
              className="skeleton-smooth rounded bg-[#e9ecef]"
            />
          </>
        ) : (
          <>
            <span className="text-xs text-[#6C757D] font-medium">Last Update</span>
            <span className="text-xs text-[#343A40] font-semibold">{timeAgo}</span>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
