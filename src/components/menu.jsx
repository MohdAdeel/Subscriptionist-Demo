import { useState } from "react";
import Logo from "../assets/Logo.svg";
import HomeIcon from "../assets/Home.svg";
import FAQsIcon from "../assets/FAQs.svg";
import MyTasksIcon from "../assets/Mytask.svg";
import ReportsIcon from "../assets/Reports.svg";
import ToggleIcon from "../assets/Frame (1).svg";
import HeartbeatIcon from "../assets/Heartbeat.svg";
import { Link, useLocation } from "react-router-dom";
import SubscriptionsIcon from "../assets/Subscriptions.svg";

const Menu = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { name: "Home", icon: HomeIcon, path: "/" },
    { name: "Reports", icon: ReportsIcon, path: "/reports" },
    { name: "Subscriptions", icon: SubscriptionsIcon, path: "/subscriptions" },
    { name: "Vendors", icon: HeartbeatIcon, path: "/vendors" },
    { name: "My Tasks", icon: MyTasksIcon, path: "/mytasks" },
    { name: "FAQs", icon: FAQsIcon, path: "/faqs" },
  ];

  return (
    <aside
      className={`flex flex-col justify-between rounded-r-2xl bg-[#000435] py-6 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20 px-3" : "w-[245px] px-6"
      }`}
    >
      <div className="flex flex-col gap-14">
        {/* Logo + Toggle */}
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <img src={Logo} alt="Logo" className="h-8 w-8" />
              <span className="text-sm font-semibold text-white">Subscriptionist</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="group relative flex items-center justify-center rounded-xl p-1.5 outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#000435] hover:scale-110 active:scale-95"
            aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          >
            <span className="absolute inset-0 rounded-xl bg-white/0 ring-2 ring-transparent transition-all duration-300 ease-out group-hover:bg-white/10 group-hover:ring-white/20 group-hover:scale-125 group-active:bg-white/5 group-active:ring-white/10" />
            <img
              src={ToggleIcon}
              alt="Toggle"
              className={`relative z-10 h-6 w-6 cursor-pointer transition-all duration-300 ease-out drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link to={item.path} key={item.name} className="no-underline">
                <div
                  className={`relative flex cursor-pointer items-center rounded-lg py-3 transition-all duration-300 ease-in-out ${
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-[#001479]"
                  } ${isCollapsed ? "w-full justify-center px-0" : "gap-4 px-5"}`}
                  onMouseEnter={() => isCollapsed && setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <img
                    src={item.icon}
                    alt={item.name}
                    className={`${item.name === "Vendors" ? "h-6 w-6" : "h-5 w-5"} shrink-0`}
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                  {isCollapsed && hoveredItem === item.name && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#000435] shadow-xl border border-[#E4E7EC] animate-fadeIn">
                      {item.name}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Menu;
