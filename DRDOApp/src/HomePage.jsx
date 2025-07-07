import React, { useEffect, useState } from "react";
import axios from "axios";

// Import all your components
import RoleOfHonourTable from "./RoleOfHonourTable";
import LabDetails from "./pages/Labs";
import DirectorProfile from "./pages/DirectorProfile";
import VisionMission from "./VisionMission";
import Contact from "./Contact";
import NoticesAndCirculars from "./NoticesAndCirculars";
import ProductsAndAdvertisements from "./ProductsAndAdvertisements";
import OfficeOfDirector from "./OfficeOfDirector";
import LabHistoryDetails from "./LabHistoryDetails";
import LabManpowerList from "./LabManpowerList";
import InfiniteLabPhotos from "./InfiniteLabPhotos";
import NC from "./NC";
import ExternalLinksViewer from "./ExternalLinksViewer";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const sections = [
  "About Lab",
  "Vision and Mission",
  "Director Profile",
  "O/o Director",
  "Role & Honour",
  "Lab History",
  "Personnel Details",
  "Notices & Circular",
  "Product & Achievements",
  "Contact Us",
];

function HomePage() {
  const [selectedSection, setSelectedSection] = useState("About Lab");
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

  const renderContent = () => {
    if (!labId) return <p className="text-gray-500">Loading content...</p>;

    switch (selectedSection) {
      case "About Lab":
        return <LabDetails labId={labId} />;
      case "Vision and Mission":
        return <VisionMission labId={labId} />;
      case "Director Profile":
        return <DirectorProfile labId={labId} />;
      case "O/o Director":
        return <OfficeOfDirector labId={labId} />;
      case "Role & Honour":
        return <RoleOfHonourTable labId={labId} />;
      case "Lab History":
        return <LabHistoryDetails labId={labId} />;
      case "Personnel Details":
        return <LabManpowerList labId={labId} />;
      case "Notices & Circular":
        return <NoticesAndCirculars labId={labId} />;
      case "Product & Achievements":
        return <ProductsAndAdvertisements />;
      case "Contact Us":
        return <Contact labId={labId} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 font-sans text-black mt-28 px-4 sm:px-6 lg:px-8">
      {/* Top Section: Gallery and Notices/Circulars Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mb-10 mx-auto">
        {/* Gallery Card - Takes 3 out of 6 columns (50% width) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-xl border border-gray-100 flex flex-col h-[480px] overflow-hidden">
          <h3 className="text-2xl font-bold text-blue-800 mb-4 border-b-2 border-blue-200 pb-2">
            Lab Gallery
          </h3>
          <div className="flex-grow flex items-center justify-center">
            {labId ? (
              <InfiniteLabPhotos labId={labId} />
            ) : (
              <p className="text-gray-500 text-lg">Loading gallery...</p>
            )}
          </div>
        </div>

        {/* Notices & Circulars Card - Takes 2 out of 6 columns (33.3% width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-xl border border-gray-100 flex flex-col h-[480px] overflow-hidden">
          <h3 className="text-2xl font-bold text-green-800 mb-4 border-b-2 border-green-200 pb-2">
            Latest Notices & Circulars
          </h3>
          <div className="flex-grow overflow-y-auto pr-2">
            {labId ? (
              <NC labId={labId} />
            ) : (
              <p className="text-gray-500 text-lg">Loading notices...</p>
            )}
          </div>
        </div>

        {/* External Links Card - Takes 1 out of 6 columns (16.6% width) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-xl border border-gray-100 flex flex-col h-[480px] overflow-hidden">
          <h3 className="text-2xl font-bold text-purple-800 mb-4 border-b-2 border-purple-200 pb-2">
            Useful External Links
          </h3>
          <div className="flex-grow overflow-y-auto pr-2">
            {labId ? (
              <ExternalLinksViewer labId={labId} />
            ) : (
              <p className="text-gray-500 text-lg">Loading links...</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Sidebar and Dynamic Content */}
      <main className="flex flex-col md:flex-row mx-auto shadow-xl rounded-lg bg-white overflow-hidden border border-gray-100 mb-10">
        {/* Sidebar */}
        <aside className="w-full md:w-1/5 bg-blue-50 p-6 space-y-3 border-r border-blue-100 shadow-inner">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 ${
                selectedSection === section
                  ? "bg-blue-700 text-white shadow-md font-bold"
                  : "bg-white text-blue-800 hover:bg-blue-200"
              }`}
              aria-current={selectedSection === section ? "page" : undefined}
            >
              {section}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <section className="flex-1 p-6 md:p-10 bg-white">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-6 border-b-2 pb-3 border-blue-300">
            {selectedSection}
          </h2>
          <div className="text-gray-800 leading-relaxed">{renderContent()}</div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;