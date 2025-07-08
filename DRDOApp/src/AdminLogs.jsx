import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, History, Loader2 } from "lucide-react"; // Import icons for better UI

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiUrl}/admin/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        const sorted = data.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setLogs(sorted);
        setFilteredLogs(sorted);
      } catch (error) {
        console.error("Error fetching logs:", error);
        setLogs([]);
        setFilteredLogs([]);
        // Optionally show a toast error here
      } finally {
        setLoading(false); // Set loading to false after fetching (success or error)
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();

    const filtered = logs.filter((log) => {
      const user = log.userId || {};
      // Safely access properties with optional chaining
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query)
      );
    });

    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 mt-14">
      <div className=" mx-auto bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center">
          <History className="w-9 h-9 text-blue-600 mr-4" />
          Admin Activity Logs
        </h2>

        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search by user name, email, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 transition-all duration-200 ease-in-out text-base"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="ml-3 text-lg text-gray-600">Loading logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-blue-600">
                <tr>
                  <th
                    scope="col"
                    className="py-3 px-6 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-6 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-6 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Action
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-6 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                    >
                      <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                        {log.userId?.name || "Unknown User"}
                      </td>
                      <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                        {log.userId?.email || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-gray-700 break-words max-w-xs">
                        {log.action}
                      </td>
                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true, // Use 12-hour format with AM/PM
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-8 text-center text-gray-500 text-lg"
                    >
                      No activity logs found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
