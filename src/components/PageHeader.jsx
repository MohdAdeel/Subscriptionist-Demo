import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiUser, FiSearch } from "react-icons/fi";
import ProfileImg from "../assets/Image.jpg";

/**
 * Reusable top navbar / page header.
 *
 * Variants:
 * - "home"    → Home dashboard welcome bar
 * - "list"    → Table/list pages (Subscriptions, Vendors)
 * - "reports" → Reports dashboard header
 */
export default function PageHeader({
  title,
  variant = "list",
  lastUpdatedText,
  isLoadingLastUpdated = false,
  invitationLabel = "Test Subscriptionist Invitation",
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const resolvedLastUpdated =
    lastUpdatedText !== undefined
      ? isLoadingLastUpdated
        ? "Loading..."
        : lastUpdatedText
      : null;

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    navigate("/profile");
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    // Placeholder logout behaviour – navigation only for now
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  if (variant === "home") {
    return (
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-[#0B0B3B]">{title}</h1>
        <div className="flex items-center gap-3">
          {resolvedLastUpdated && (
            <span className="text-xs text-gray-500">{resolvedLastUpdated}</span>
          )}
          <img
            src={ProfileImg}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover"
          />
        </div>
      </div>
    );
  }

  if (variant === "reports") {
    return (
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{title}</h1>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {resolvedLastUpdated && (
            <span className="text-xs sm:text-sm text-gray-500">
              {resolvedLastUpdated}
            </span>
          )}

          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiSearch className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {invitationLabel}
              </span>
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border border-gray-100 bg-white py-1 shadow-lg z-20">
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default "list" variant (Subscriptions, Vendors, etc.)
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <h2 className="m-0 text-lg sm:text-xl md:text-[22px] font-bold">
          {title}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {resolvedLastUpdated && (
          <span className="text-[10px] xs:text-xs sm:text-[13px] text-[#8b8b8b] order-1 sm:order-none">
            {resolvedLastUpdated}
          </span>
        )}
        <FiBell className="text-lg sm:text-xl cursor-pointer order-2 sm:order-none" />
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-full flex items-center justify-center order-3 sm:order-none">
          <FiUser className="text-white text-base sm:text-lg" />
        </div>
        <span className="text-xs sm:text-sm font-medium order-4 sm:order-none truncate max-w-[180px] xs:max-w-[250px] sm:max-w-none">
          {invitationLabel}
        </span>
      </div>
    </div>
  );
}

