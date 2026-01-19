import "./menu.css";
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
    { name: "My Tasks", icon: MyTasksIcon, path: "/mytasks" },
    { name: "FAQs", icon: FAQsIcon, path: "/faqs" },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        {/* Logo + Toggle */}
        <div className="logo-row">
          {!isCollapsed && (
            <div className="logo">
              <img src={Logo} alt="Logo" />
              <span>Subscriptionist</span>
            </div>
          )}
          <img
            src={ToggleIcon}
            alt="Toggle"
            className={`toggle ${isCollapsed ? "collapsed" : ""}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* Menu */}
        <nav className="menu">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link to={item.path} key={item.name} className="menu-link">
                <div
                  className={`menu-item ${isActive ? "active" : ""} ${
                    isCollapsed ? "collapsed-item" : ""
                  }`}
                >
                  <img src={item.icon} alt={item.name} />
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
