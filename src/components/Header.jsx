import { useAuthStore } from "../stores";
import { useMsal } from "@azure/msal-react";
import SkeletonLoader from "./SkeletonLoader";
import { useState, useEffect, useRef } from "react";
import { FiBell, FiChevronDown } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { instance } = useMsal();
  const [timeAgo, setTimeAgo] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userAuth = useAuthStore((state) => state.userAuth);
  const isUserLoading = useAuthStore((state) => state.userAuthLoading);
  const userName = userAuth
    ? `${userAuth.firstname || ""} ${userAuth.lastname || ""}`.trim() || "User"
    : "User";
  const userPhoto = userAuth?.entityimage_url || null;
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
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
          {/* Last Update */}
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

          {/* Bell Icon */}
          <div className="relative cursor-pointer group">
            <div className="p-2 rounded-lg hover:bg-[#f6f7fb] transition-all duration-200">
              <FiBell className="text-xl text-[#172B4D] group-hover:text-[#000435] transition-colors" />
            </div>
            {/* Notification Badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC3545] rounded-full border-2 border-white"></span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
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
                    <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
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
