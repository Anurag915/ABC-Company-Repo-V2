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
import InfiniteLabPhotos from "./InfiniteLabPhotos"; // Ensure this is the updated version
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
    <div className="bg-gray-50 font-sans text-black mt-16 px-4 sm:px-6 lg:px-8">
      {/* Top Section: Lab Gallery (Full Width) */}
      <div className="grid grid-cols-1 gap-4 mb-6 mx-auto "> {/* Changed to grid-cols-1 for full width on all screens */}
        <div className="col-span-1 bg-white p-4 rounded-lg shadow-xl border border-gray-100 flex flex-col min-h-[350px] overflow-hidden">
          
          <div className="flex-grow flex items-center justify-center">
            {labId ? (
              <InfiniteLabPhotos labId={labId} />
            ) : (
              <p className="text-gray-500 text-base">Loading gallery...</p>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Notices & Circulars and External Links (Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 mx-auto "> {/* New grid for side-by-side */}
        {/* Notices & Circulars Card - Takes 1/2 width on large screens */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-xl border border-gray-100 flex flex-col min-h-[350px] max-h-[450px] overflow-hidden">
          <h3 className="text-xl font-bold text-green-800 mb-3 border-b-2 border-green-200 pb-2">
            Latest Notices & Circulars
          </h3>
          <div className="flex-grow overflow-y-auto pr-2">
            {labId ? (
              <NC labId={labId} />
            ) : (
              <p className="text-gray-500 text-base">Loading notices...</p>
            )}
          </div>
        </div>

        {/* External Links Card - Takes 1/2 width on large screens */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-xl border border-gray-100 flex flex-col min-h-[350px] max-h-[450px] overflow-hidden">
          <h3 className="text-xl font-bold text-purple-800 mb-3 border-b-2 border-purple-200 pb-2">
            Useful External Links
          </h3>
          <div className="flex-grow overflow-y-auto pr-2">
            {labId ? (
              <ExternalLinksViewer labId={labId} />
            ) : (
              <p className="text-gray-500 text-base">Loading links...</p>
            )}
          </div>
        </div>
      </div>      
    </div>
  );
}

export default HomePage;
