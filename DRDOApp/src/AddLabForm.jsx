import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FlaskConical } from "lucide-react"; // Optional icon

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AddLabForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    mission: "",
    vision: "",
    about: "",
    domain: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Lab name is required");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(`${apiUrl}/api/labs`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Lab created successfully!");
      setFormData({
        name: "",
        mission: "",
        vision: "",
        about: "",
        domain: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create lab. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mt-10 mx-auto my-16 px-4"> {/* Increased margin and padding */}
      <div className=" mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-100"> {/* Enhanced shadow and border */}
        <h2 className="text-3xl font-extrabold text-blue-700 flex items-center justify-center mb-8 border-b-2 border-blue-200 pb-4"> {/* Larger, bolder heading, centered */}
          <FlaskConical className="mr-3 text-blue-600 w-8 h-8" /> {/* Larger icon */}
          Add New Lab Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6"> {/* Increased vertical spacing */}
          {["name", "mission", "vision", "about", "domain"].map((field) => (
            <div key={field}>
              <label
                htmlFor={field}
                className="block text-md font-semibold text-gray-800 capitalize mb-2" // Bolder, slightly larger label
              >
                {field.replace(/([A-Z])/g, ' $1').trim()}: {/* Converts 'about' to 'About' or 'labName' to 'Lab Name' */}
              </label>
              {field === "about" || field === "mission" || field === "vision" ? (
                <textarea
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={`Enter ${field} here...`}
                  rows={field === "about" ? 5 : 3} // Larger rows for 'about'
                  className="w-full rounded-lg border border-gray-300 p-3.5 focus:outline-none focus:ring-3 focus:ring-blue-300 transition-all duration-200 shadow-sm resize-y text-gray-700 placeholder-gray-400" // Enhanced textarea styles
                ></textarea>
              ) : (
                <input
                  type="text"
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={`Enter ${field}`}
                  className="w-full rounded-lg border border-gray-300 p-3.5 focus:outline-none focus:ring-3 focus:ring-blue-300 transition-all duration-200 shadow-sm text-gray-700 placeholder-gray-400" // Enhanced input styles
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:from-blue-500 disabled:to-blue-600 flex items-center justify-center" // Enhanced button styles
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Lab...
              </>
            ) : (
              "Create Lab"
            )}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AddLabForm;