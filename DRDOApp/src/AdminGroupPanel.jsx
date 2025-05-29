import { useState } from "react";
import { useParams } from "react-router-dom";

const adminSections = [
  "Manage Groups",
  "Manage AssociateDirectors",
  "Manage Group Notices & Circulars",
  "Manage Group Products & Achievements",
  "Manage Members",
];

export default function AdminGroupPanel() {
  const { id: labId } = useParams(); // Get the lab ID from the URL
  const [selectedSection, setSelectedSection] = useState("Manage Labs");

  const renderAdminContent = () => {
    switch (selectedSection) {
      case "Manage Groups":
        return <p>Static content for managing lab info of Lab ID: <strong>{labId}</strong>.</p>;
      case "Manage AssociateDirectors":
        return <p>Static content for managing directors of Lab ID: <strong>{labId}</strong>.</p>;
      case "Manage Group Notices & Circulars":
        return <p>Static content for managing notices and circulars for Lab ID: <strong>{labId}</strong>.</p>;
      case "Manage Group Products & Achievements":
        return <p>Static content for managing products and achievements for Lab ID: <strong>{labId}</strong>.</p>;
      case "Manage Members":
        return <p>Static content for managing users (not specific to any lab).</p>;
    //   case "Manage Groups":
    //     return <p>Static content for managing groups related to Lab ID: <strong>{labId}</strong>.</p>;
      default:
        return <p>Select a section to manage.</p>;
    }
  };

  return (
    <div className="bg-amber-50 font-sans text-gray-900 mt-8">
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
          <div className="text-gray-700 leading-relaxed">{renderAdminContent()}</div>
        </section>
      </main>
    </div>
  );
}
