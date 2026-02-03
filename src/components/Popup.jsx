import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";

const PopupContext = createContext();

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within PopupProvider");
  }
  return context;
};

const popupStyles = {
  success: {
    container:
      "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 shadow-lg shadow-green-500/20",
    icon: "text-green-600",
    iconBg: "bg-green-100",
    title: "text-green-900",
    message: "text-green-700",
    Icon: FiCheckCircle,
  },
  error: {
    container:
      "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 shadow-lg shadow-red-500/20",
    icon: "text-red-600",
    iconBg: "bg-red-100",
    title: "text-red-900",
    message: "text-red-700",
    Icon: FiAlertCircle,
  },
  warning: {
    container:
      "bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 shadow-lg shadow-orange-500/20",
    icon: "text-orange-600",
    iconBg: "bg-orange-100",
    title: "text-orange-900",
    message: "text-orange-700",
    Icon: FiAlertTriangle,
  },
  info: {
    container:
      "bg-gradient-to-r from-sky-50 to-blue-50 border-l-4 border-sky-500 shadow-lg shadow-sky-500/20",
    icon: "text-sky-600",
    iconBg: "bg-sky-100",
    title: "text-sky-900",
    message: "text-sky-700",
    Icon: FiInfo,
  },
};

const PopupItem = ({ popup, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const styles = popupStyles[popup.type] || popupStyles.info;
  const Icon = styles.Icon;

  useEffect(() => {
    if (popup.duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, popup.duration);
      return () => clearTimeout(timer);
    }
  }, [popup.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(popup.id);
    }, 300);
  };

  return (
    <div
      className={`
        relative rounded-xl p-4 pr-12 min-w-[320px] max-w-md transition-all duration-300 ease-out
        ${styles.container}
        ${
          isExiting
            ? "animate-[slideOut_0.3s_ease-out_forwards] opacity-0 translate-x-full"
            : "animate-[slideIn_0.3s_ease-out]"
        }
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {popup.title && (
            <h4 className={`text-sm font-bold ${styles.title} mb-1`}>{popup.title}</h4>
          )}
          <p className={`text-sm ${styles.message}`}>{popup.message}</p>
        </div>
      </div>
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#172B4D]"
        aria-label="Close notification"
      >
        <FiX className={`w-5 h-5 ${styles.icon}`} />
      </button>

      {popup.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 rounded-b-xl overflow-hidden">
          <div
            className={`h-full ${
              popup.type === "success"
                ? "bg-green-500"
                : popup.type === "error"
                  ? "bg-red-500"
                  : popup.type === "warning"
                    ? "bg-orange-500"
                    : "bg-sky-500"
            }`}
            style={{
              animation: `shrink ${popup.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export const PopupProvider = ({ children }) => {
  const [popups, setPopups] = useState([]);

  const showPopup = useCallback(({ type = "info", title, message, duration = 5000 }) => {
    const id = Date.now() + Math.random();
    setPopups((prev) => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  const hidePopup = useCallback((id) => {
    setPopups((prev) => prev.filter((popup) => popup.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message, title = "Success!", duration) => {
      return showPopup({ type: "success", title, message, duration });
    },
    [showPopup]
  );

  const showError = useCallback(
    (message, title = "Error!", duration) => {
      return showPopup({ type: "error", title, message, duration });
    },
    [showPopup]
  );

  const showWarning = useCallback(
    (message, title = "Warning!", duration) => {
      return showPopup({ type: "warning", title, message, duration });
    },
    [showPopup]
  );

  const showInfo = useCallback(
    (message, title = "Info", duration) => {
      return showPopup({ type: "info", title, message, duration });
    },
    [showPopup]
  );

  return (
    <PopupContext.Provider
      value={{
        showPopup,
        hidePopup,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}

      {/* Popup Container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {popups.map((popup) => (
          <div key={popup.id} className="pointer-events-auto">
            <PopupItem popup={popup} onClose={hidePopup} />
          </div>
        ))}
      </div>
    </PopupContext.Provider>
  );
};

export default PopupProvider;
