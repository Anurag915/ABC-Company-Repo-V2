import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import axios from "axios";
import "./Navbar.css";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [groups, setGroups] = useState([]);
  const [labs, setLabs] = useState([]);
  const [openDesktopMainDropdown, setOpenDesktopMainDropdown] = useState(null);
  const [openDesktopNestedDropdown, setOpenDesktopNestedDropdown] = useState(null);
  const [openMobileMainDropdown, setOpenMobileMainDropdown] = useState(null);
  const [openMobileNestedDropdown, setOpenMobileNestedDropdown] = useState(null);
  const [openAccount, setOpenAccount] = useState(false);
  const [topOffset, setTopOffset] = useState(135);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const updateOffset = () => {
      const marqueeHeight = 40;
      const topNavbarEl = document.querySelector(".top-navbar");
      const topNavbarHeight = topNavbarEl?.offsetHeight || 0;
      setTopOffset(marqueeHeight + topNavbarHeight);
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, []);

  useEffect(() => {
    axios.get(`${apiUrl}/api/labs`)
      .then((res) => setLabs(res.data))
      .catch((err) => console.error("Failed to fetch labs:", err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    const roleFromStorage = localStorage.getItem("role");
    setUserRole(roleFromStorage);
  }, [pathname]);

  useEffect(() => {
    axios.get(`${apiUrl}/api/groups/name`)
      .then((res) => setGroups(res.data))
      .catch((err) => console.error("Failed to fetch groups:", err));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole(null);
    setOpenAccount(false);
    setIsOpen(false);
    setOpenDesktopMainDropdown(null);
    setOpenDesktopNestedDropdown(null);
    setOpenMobileMainDropdown(null);
    setOpenMobileNestedDropdown(null);
    navigate("/login");
  };

  useEffect(() => {
    setIsOpen(false);
    setOpenDesktopMainDropdown(null);
    setOpenDesktopNestedDropdown(null);
    setOpenMobileMainDropdown(null);
    setOpenMobileNestedDropdown(null);
    setOpenAccount(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && navRef.current.contains(event.target)) return;

      if (openDesktopMainDropdown || openDesktopNestedDropdown) {
        setOpenDesktopMainDropdown(null);
        setOpenDesktopNestedDropdown(null);
      }

      if (
        event.target.closest(".my-account-button") === null &&
        event.target.closest(".account-dropdown-menu") === null &&
        openAccount
      ) {
        setOpenAccount(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(".mobile-menu-toggle")
      ) {
        setIsOpen(false);
        setOpenMobileMainDropdown(null);
        setOpenMobileNestedDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDesktopMainDropdown, openDesktopNestedDropdown, openAccount, isOpen]);

  const accountItems = [
    { label: "View Profile", to: "/profile" },
    { label: "Sign Out", action: handleLogout },
  ];

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Lab Info", to: "/labInformation" },

    ...(isLoggedIn
      ? [
          {
            label: "Groups",
            dropdown: true,
            items: groups.map((group) => ({
              label: group.name,
              to: `/group/id/${group._id}`,
            })),
          },
          userRole === "admin" && {
            label: "Admin Panel",
            dropdown: true,
            items: [
              labs.length === 0 && { label: "Add Lab", to: "/admin/add-labs" },
              { label: "Add Group", to: "/admin/add-groups" },
              { label: "Manage Labs", to: "/admin" },
              {
                label: "Manage Groups",
                dropdown: true,
                items: groups.map((group) => ({
                  label: group.name,
                  to: `/admin/group/${group._id}`,
                })),
              },
              { label: "Manage Close Group", to: "/admin/closeGroup" },
              { label: "Approve Users", to: "/admin/approval" },
              { label: "Logs", to: "/admin/logs" },
              { label: "Manage Gallery", to: "/admin/manageGallery" },
              { label: "All Letters", to: "/allLetter" },
              { label: "All Software Repositories", to: "/view-repo" },
              { label: "All Trial Repositories", to: "/view-trialRepo" },
              { label: "Software Repository Upload", to: "/upload-repo" },
              { label: "Trial Repository Upload", to: "/upload-trialRepo" },
              { label: "Manage External Links", to: "/admin/external-Links" },
            ].filter(Boolean),
          },
          userRole === "director" && {
            label: "Director Panel",
            dropdown: true,
            items: [
              { label: "All Letters", to: "/allLetter" },
              { label: "All Software Repositories", to: "/view-repo" },
              { label: "All Trial Repositories", to: "/view-trialRepo" },
            ],
          },
          userRole === "associate_director" && {
            label: "Associate Director Panel",
            dropdown: true,
            items: [
              { label: "Software Repository Upload", to: "/upload-repo" },
              { label: "Trial Repository Upload", to: "/upload-trialRepo" },
            ],
          },
          userRole === "employee" && {
            label: "Upload Letter",
            to: "/dac",
          },
          { label: "Close Group Docs", to: "/closeGroup" },
        ].filter(Boolean)
      : [{ label: "Login", to: "/login" }]),
  ];

  return (
    <nav
      ref={navRef}
      className="main-navbar bg-[#003168] text-white shadow-lg w-full z-50"
      style={{ top: `${topOffset}px`, position: "fixed" }}
    >
      <div className="flex items-center justify-between h-16 px-3">
        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-4 items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            const isDropdownOpen = openDesktopMainDropdown === item.label;

            if (item.dropdown) {
              return (
                <div key={item.label} className="relative group">
                  <button
                    onClick={() =>
                      setOpenDesktopMainDropdown((prev) =>
                        prev === item.label ? null : item.label
                      )
                    }
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition ${
                      isDropdownOpen ? "bg-[#0066cc]" : "hover:bg-[#005bb5]"
                    }`}
                  >
                    {item.label}
                    {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-[#004b99] rounded-md w-48 shadow-lg z-[9999]">
                      {item.items?.map((subItem) => (
                        <button
                          key={subItem.to || subItem.label}
                          onClick={() => {
                            navigate(subItem.to);
                            setOpenDesktopMainDropdown(null);
                            setOpenAccount(false);
                          }}
                          className={`block w-full text-left px-4 py-1.5 text-sm text-white transition hover:bg-[#0066cc] ${
                            pathname === subItem.to ? "bg-[#0066cc]" : ""
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => {
                  item.action ? item.action() : navigate(item.to);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  isActive ? "bg-[#0066cc]" : "hover:bg-[#005bb5]"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {isLoggedIn && (
            <div className="relative">
              <button
                onClick={() => setOpenAccount(!openAccount)}
                className={`my-account-button px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition ${
                  openAccount ? "bg-[#0066cc]" : "hover:bg-[#005bb5]"
                }`}
              >
                My Account
                {openAccount ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {openAccount && (
                <div className="absolute right-0 mt-1 w-40 bg-[#004b99] rounded-md shadow-md z-[9999]">
                  {accountItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setOpenAccount(false);
                        item.action ? item.action() : navigate(item.to);
                      }}
                      className={`block w-full text-left px-4 py-1.5 text-sm text-white hover:bg-[#0066cc] ${
                        pathname === item.to ? "bg-[#0066cc]" : ""
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-toggle text-white"
          >
            {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
