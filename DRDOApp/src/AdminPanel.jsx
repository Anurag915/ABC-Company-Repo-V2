import { useState, useEffect } from "react";
import axios from "axios";
import ManageLabInfo from "./pages/ManageLabInfo";
import ManageNoticesCirculars from "./ManageNoticesCirculars";
import ManageProductAdvertisements from "./ManageProductAdvertisements";
import ManageUsers from "./ManageUsers";
import Directors from "./Directors";
import ManageGroups from "./ManageGroups";
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const adminSections = [
  "Manage Labs",
  "Manage Directors",
  "Manage Notices & Circulars",
  "Manage Products & Achievements",
  "Manage Users",
  // "Manage Groups",
];
// const labId = "6831e91d804bf498865b819d"; // Replace with the actual lab ID

function AdminPanel() {
  const [selectedSection, setSelectedSection] = useState("Manage Labs");
  const [labId, setLabId] = useState(null);

  useEffect(() => {
    const fetchLab = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/labs/only`);
        setLabId(res.data._id);
      } catch (err) {
        console.error("Failed to load lab", err);
      }
    };
    fetchLab();
  }, []);
  const renderAdminContent = () => {
    if (!labId) return <p>Loading...</p>;
    switch (selectedSection) {
      case "Manage Labs":
        return <ManageLabInfo labId={labId} />;
      case "Manage Directors":
        return <Directors labId={labId} />;
      case "Manage Notices & Circulars":
        return <ManageNoticesCirculars labId={labId} />;
      case "Manage Products & Achievements":
        return <ManageProductAdvertisements labId={labId} />;
      case "Manage Users":
        return <ManageUsers />;
      // case "Manage Groups":
      //   return <ManageGroups />;
      default:
        return <p>Select a section to manage.</p>;
    }
  };

  return (
    <div className=" bg-amber-50 font-sans text-gray-900 mt-16">
      <main className="flex flex-col md:flex-row mx-auto shadow-lg rounded-lg bg-white">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4 bg-amber-100 p-6 space-y-4 rounded-l-lg border-r border-amber-300 shadow-inner">
          {adminSections.map((section) => (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                selectedSection === section
                  ? "bg-amber-700 text-white shadow-md"
                  : "bg-white text-amber-800 hover:bg-amber-300"
              }`}
              aria-current={selectedSection === section ? "page" : undefined}
            >
              {section}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <section className="flex-1 p-8 overflow-auto rounded-r-lg">
          <h2 className="text-3xl font-extrabold text-amber-700 mb-6 border-b border-amber-300 pb-2">
            {selectedSection}
          </h2>
          <div className="text-gray-700 leading-relaxed">
            {renderAdminContent()}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminPanel;
