import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { UsersRound } from "lucide-react"; // Optional icon for the heading

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AddGroupForm = ({ labId }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    vision: "",
    mission: "",
    about: "",
    employees: [],
  });

  const [loading, setLoading] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState(null);

  useEffect(() => {
    // Fetch employees to assign to group
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        const res = await axios.get(`${apiUrl}/api/users?role=employee`);
        setAvailableEmployees(res.data || []);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        setEmployeesError("Failed to load employees. Please try again.");
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeToggle = (id) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.includes(id)
        ? prev.employees.filter((emp) => emp !== id)
        : [...prev.employees, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Group name is required.");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = { ...formData };

      await axios.post(`${apiUrl}/api/groups`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { labId }, // send labId as req.params
      });

      toast.success("Group created successfully!");
      setFormData({
        name: "",
        description: "",
        vision: "",
        mission: "",
        about: "",
        employees: [],
      });
    } catch (err) {
      console.error("Error creating group:", err);
      toast.error(err.response?.data?.error || "Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto my-16">
      <div className="mt-16 mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-extrabold text-purple-700 flex items-center justify-center mb-8 border-b-2 border-purple-200 pb-4">
          <UsersRound className="mr-3 text-purple-600 w-8 h-8" />
          Create New Research Group
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {["name", "description", "vision", "mission", "about"].map((field) => (
            <div key={field}>
              <label
                htmlFor={field}
                className="block text-md font-semibold text-gray-800 capitalize mb-2"
              >
                {field.replace(/([A-Z])/g, ' $1').trim()}:
              </label>
              {field === "description" || field === "vision" || field === "mission" || field === "about" ? (
                <textarea
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={`Enter group ${field} here...`}
                  rows={field === "about" ? 5 : 3} // Larger rows for 'about', smaller for others
                  className="w-full rounded-lg border border-gray-300 p-3.5 focus:outline-none focus:ring-3 focus:ring-purple-300 transition-all duration-200 shadow-sm resize-y text-gray-700 placeholder-gray-400"
                ></textarea>
              ) : (
                <input
                  type="text"
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={`Enter group ${field}`}
                  className="w-full rounded-lg border border-gray-300 p-3.5 focus:outline-none focus:ring-3 focus:ring-purple-300 transition-all duration-200 shadow-sm text-gray-700 placeholder-gray-400"
                />
              )}
            </div>
          ))}

          {/* Employee Assignment Section */}
          <div>
            <label className="block text-md font-semibold text-gray-800 mb-3">
              Assign Employees to Group:
            </label>
            {employeesLoading ? (
              <p className="text-gray-500 text-center py-4">Loading employees...</p>
            ) : employeesError ? (
              <p className="text-red-500 text-center py-4">{employeesError}</p>
            ) : availableEmployees.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No employees available to assign.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-4 custom-scrollbar"> {/* Added custom-scrollbar for styling if needed */}
                {availableEmployees.map((emp) => (
                  <label
                    key={emp._id}
                    className={`flex items-center p-2 rounded-md cursor-pointer transition-colors duration-200
                      ${formData.employees.includes(emp._id)
                        ? "bg-purple-100 border border-purple-400 text-purple-800 font-medium shadow-sm"
                        : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.employees.includes(emp._id)}
                      onChange={() => handleEmployeeToggle(emp._id)}
                      className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500 mr-2 cursor-pointer"
                    />
                    <span className="text-sm">
                      {emp.personalDetails?.fullName || emp.email || "Unknown Employee"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3.5 px-6 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:from-purple-500 disabled:to-purple-600 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Group...
              </>
            ) : (
              "Create Group"
            )}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AddGroupForm;