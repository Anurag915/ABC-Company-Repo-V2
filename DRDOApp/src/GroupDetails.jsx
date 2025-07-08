import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import axios from "axios";
import AboutGroup from "./AboutGroup";
import VisionMissionGroup from "./VisionMissionGroup";
import GroupAD from "./GroupAD";
import ContactInfoGroup from "./ContactInfoGroup";
import GroupProducts from "./GroupProducts";
import GroupNoticesCirculars from "./GroupNoticesCirculars";
import GroupEmployees from "./GroupEmployees";
import AssistantDirectorsTable from "./AssistantDirectorsTable";
import GroupHistory from "./GroupHistory";
import OfficeOfGroupManager from "./OfficeOfGroupManager";
import CurrentADCard from "./CurrentADCard";
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const sections = [
  "About Group",
  "Vision and Mission",
  "Group Leader Profile",
  "O/o Group Leader",
  "Role & Honour",
  "Group History",
  "Members",
  "Notices & Circular",
  "Product & Advertisement",
  "Contact Us",
];

function GroupPage() {
  const { id } = useParams(); // group ID from URL
  const [selectedSection, setSelectedSection] = useState("About Group");
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    setLoading(true);
    setUnauthorized(false); // reset unauthorized state
    setGroup(null); // reset group state

    async function fetchGroup() {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const role = localStorage.getItem("role");

        const res = await axios.get(`${apiUrl}/api/groups/id/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const isMember = res.data.employees.some(
          (emp) => String(emp._id) === String(userId)
        );

        if (role === "director" || role === "admin" || isMember) {
          setGroup(res.data);
        } else {
          setUnauthorized(true);
        }
      } catch (error) {
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    }

    fetchGroup();
  }, [id]);

  if (loading) return <p>Loading group data...</p>;
  if (unauthorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-700">
            You are not authorized to view this group. You are not a member of
            this group.
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (selectedSection) {
      case "About Group":
        return <AboutGroup groupId={id} />;
      case "Vision and Mission":
        return <VisionMissionGroup groupId={id} />;
      case "Group Leader Profile":
        return <CurrentADCard groupId={id} />;
      case "O/o Group Leader":
        return <OfficeOfGroupManager groupId={id} />;
      case "Role & Honour":
        return <AssistantDirectorsTable groupId={id} />;
      case "Group History":
        return <GroupHistory groupId={id} />;
      case "Members":
        return <GroupEmployees groupId={id} />;
      case "Notices & Circular":
        return <GroupNoticesCirculars groupId={id} />;
      case "Product & Advertisement":
        return <GroupProducts groupId={id} />;
      case "Contact Us":
        return <ContactInfoGroup groupId={id} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 font-sans text-black mt-16">
      <main className="flex flex-col md:flex-row mx-auto shadow-lg rounded-lg bg-white">
        <aside className="w-full md:w-1/5 bg-green-100 p-6 space-y-4 rounded-l-lg border-r border-green-300 shadow-inner">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                selectedSection === section
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-white text-green-800 hover:bg-green-300"
              }`}
              aria-current={selectedSection === section ? "page" : undefined}
            >
              {section}
            </button>
          ))}
        </aside>

        <section className="flex-1 p-8 overflow-auto rounded-r-lg">
          <h2 className="text-3xl font-extrabold text-green-700 mb-6 border-b border-green-300 pb-2">
            {selectedSection}
          </h2>
          <div className="text-gray-700 leading-relaxed">{renderContent()}</div>
        </section>
      </main>
    </div>
  );
}

export default GroupPage;
