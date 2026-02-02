import { useState } from "react";
import Logo from "../assets/Logo.svg";
import HomeIcon from "../assets/Home.svg";
import FAQsIcon from "../assets/FAQs.svg";
import MyTasksIcon from "../assets/Mytask.svg";
import ReportsIcon from "../assets/Reports.svg";
import ToggleIcon from "../assets/Frame (1).svg";
import { Link, useLocation } from "react-router-dom";
import SubscriptionsIcon from "../assets/Subscriptions.svg";

const Menu = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: "Home", icon: HomeIcon, path: "/" },
    { name: "Reports", icon: ReportsIcon, path: "/reports" },
    { name: "Subscriptions", icon: SubscriptionsIcon, path: "/subscriptions" },
    { name: "Vendors", icon: MyTasksIcon, path: "/vendors" },
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
              <img src={Logo} alt="Logo" className="h-6 w-6" />
              <span className="text-sm font-semibold text-white">Subscriptionist</span>
            </div>
          )}
          <img
            src={ToggleIcon}
            alt="Toggle"
            className={`h-6 w-6 cursor-pointer transition-transform duration-300 ease-in-out ${
              isCollapsed ? "rotate-180" : ""
            }`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link to={item.path} key={item.name} className="no-underline">
                <div
                  className={`flex cursor-pointer items-center rounded-lg py-3 transition-all duration-300 ease-in-out ${
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-[#001479]"
                  } ${isCollapsed ? "w-full justify-center px-0" : "gap-4 px-5"}`}
                >
                  <img src={item.icon} alt={item.name} className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
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
