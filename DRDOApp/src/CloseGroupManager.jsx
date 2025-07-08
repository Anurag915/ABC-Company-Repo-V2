import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast"; // Ensure react-hot-toast is installed
import { UsersRound, Calendar, FileText } from "lucide-react"; // Icons for better visual appeal

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CloseGroupManager = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    groupName: "",
    groupPurpose: "",
    groupDuration: { from: "", to: "" },
    requestedBy: [],
    adminRemarks: "",
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false); // For form submission loading
  const [tableLoading, setTableLoading] = useState(true); // For table data loading
  const [tableError, setTableError] = useState(null); // For table data error
  const [usersLoading, setUsersLoading] = useState(true); // For users data loading
  const token = localStorage.getItem("token");

  const fetchGroups = async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const res = await axios.get(`${apiUrl}/admin/close-group`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(res.data);
    } catch (err) {
      console.error("Fetch groups error:", err);
      setTableError("Failed to fetch groups. Please try again.");
      toast.error("Failed to load groups.");
    } finally {
      setTableLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("User fetch error:", err);
      toast.error("Failed to load users for selection.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "from" || name === "to") {
      setForm({
        ...form,
        groupDuration: {
          ...form.groupDuration,
          [name]: value,
        },
      });
    } else if (name === "requestedBy") {
      const selectedOptions = Array.from(
        e.target.selectedOptions,
        (option) => option.value
      );
      setForm({ ...form, requestedBy: selectedOptions });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trim and normalize group name for comparison
    const normalizedName = form.groupName.trim().toLowerCase();

    // Check for duplicate group name (case-insensitive, skip check when editing same group)
    const isDuplicate = groups.some(
      (g) =>
        g.groupName.trim().toLowerCase() === normalizedName && g._id !== editId // allow same name if editing current group
    );
    if (isDuplicate) {
      toast.error("A group with this name already exists.");
      return;
    }

    if (!form.groupName.trim()) {
      toast.error("Group Name is required.");
      return;
    }
    if (!form.groupPurpose.trim()) {
      toast.error("Group Purpose is required.");
      return;
    }
    if (!form.groupDuration.from || !form.groupDuration.to) {
      toast.error("Group Duration (From and To dates) are required.");
      return;
    }
    if (new Date(form.groupDuration.from) > new Date(form.groupDuration.to)) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    // rest of your existing code...

    setLoading(true);
    try {
      const payload = {
        ...form,
        groupDuration: {
          from: new Date(form.groupDuration.from),
          to: new Date(form.groupDuration.to),
        },
      };

      if (editId) {
        await axios.put(`${apiUrl}/admin/close-group/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Group updated successfully!");
      } else {
        await axios.post(`${apiUrl}/admin/close-group`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Group created successfully!");
      }

      setForm({
        groupName: "",
        groupPurpose: "",
        groupDuration: { from: "", to: "" },
        requestedBy: [],
        adminRemarks: "",
      });
      setEditId(null);
      fetchGroups(); // Refresh table data
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(
        err.response?.data?.error ||
          "Operation failed. Please check your inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group) => {
    setForm({
      groupName: group.groupName,
      groupPurpose: group.groupPurpose,
      groupDuration: {
        from: group.groupDuration?.from
          ? new Date(group.groupDuration.from).toISOString().slice(0, 10)
          : "",
        to: group.groupDuration?.to
          ? new Date(group.groupDuration.to).toISOString().slice(0, 10)
          : "",
      },
      requestedBy: group.requestedBy.map((u) => u._id),
      adminRemarks: group.adminRemarks,
    });
    setEditId(group._id);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top to show form
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    )
      return;
    try {
      await axios.delete(`${apiUrl}/admin/close-group/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Group deleted successfully!");
      fetchGroups(); // Refresh table data
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.error || "Failed to delete group.");
    }
  };

  return (
    <div className="container  mx-auto my-16 px-4 sm:px-6 lg:px-8 mt-18">
      {/* Page Title */}
      <h1 className="text-4xl font-extrabold text-gray-900 mb-10 text-center flex items-center justify-center">
        <UsersRound className="w-10 h-10 mr-4 text-purple-600" />
        Manage Close Groups
      </h1>

      {/* Form Section */}
      <div className=" mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 mb-12">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6 pb-4 border-b border-gray-200">
          <FileText className="w-6 h-6 mr-3 text-blue-500" />
          {editId ? "Edit Group Details" : "Create New Group"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group Name */}
            <div>
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                id="groupName"
                name="groupName"
                type="text"
                placeholder="e.g., Quantum Computing Team"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 shadow-sm"
                value={form.groupName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Group Purpose */}
            <div>
              <label
                htmlFor="groupPurpose"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Group Purpose <span className="text-red-500">*</span>
              </label>
              <input
                id="groupPurpose"
                name="groupPurpose"
                type="text"
                placeholder="e.g., Develop new AI algorithms"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 shadow-sm"
                value={form.groupPurpose}
                onChange={handleChange}
                required
              />
            </div>

            {/* Duration From */}
            <div>
              <label
                htmlFor="from"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Duration From <span className="text-red-500">*</span>
              </label>
              <input
                id="from"
                type="date"
                name="from"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 shadow-sm"
                value={form.groupDuration.from}
                onChange={handleChange}
                required
              />
            </div>

            {/* Duration To */}
            <div>
              <label
                htmlFor="to"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Duration To <span className="text-red-500">*</span>
              </label>
              <input
                id="to"
                type="date"
                name="to"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 shadow-sm"
                value={form.groupDuration.to}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Requested By */}
          <div>
            <label
              htmlFor="requestedBy"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Requested By (select one or more){" "}
              <span className="text-red-500">*</span>
            </label>
            {usersLoading ? (
              <p className="text-gray-500 text-center py-4">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-red-500 text-center py-4">
                No users available. Please add users first.
              </p>
            ) : (
              <select
                id="requestedBy"
                name="requestedBy"
                multiple
                value={form.requestedBy}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg h-40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 shadow-sm custom-multiselect"
                required
              >
                {users.map((user) => (
                  <option
                    key={user._id}
                    value={user._id}
                    className="p-2 hover:bg-blue-50"
                  >
                    {user.personalDetails?.fullName || user.email}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple users.
            </p>
          </div>

          {/* Admin Remarks */}
          <div>
            <label
              htmlFor="adminRemarks"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Admin Remarks
            </label>
            <textarea
              id="adminRemarks"
              name="adminRemarks"
              placeholder="Add any internal remarks here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 shadow-sm resize-y"
              value={form.adminRemarks}
              onChange={handleChange}
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {editId ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editId ? "Update Group" : "Create Group"}</>
              )}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({
                    groupName: "",
                    groupPurpose: "",
                    groupDuration: { from: "", to: "" },
                    requestedBy: [],
                    adminRemarks: "",
                  });
                }}
                className="mt-4 ml-4 text-gray-600 hover:text-gray-800 hover:underline transition duration-200"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Group List Table */}
      <div className=" mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6 pb-4 border-b border-gray-200">
          <Calendar className="w-6 h-6 mr-3 text-green-500" />
          Existing Groups
        </h2>

        {tableLoading ? (
          <p className="text-center text-gray-500 py-8">Loading groups...</p>
        ) : tableError ? (
          <p className="text-center text-red-500 py-8">Error: {tableError}</p>
        ) : groups.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No groups created yet. Start by creating one above!
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Group Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Purpose
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Requested By
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Remarks
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {groups.map((group) => (
                  <tr
                    key={group._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {group.groupName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {group.groupPurpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {group.groupDuration?.from
                        ? new Date(group.groupDuration.from).toLocaleDateString(
                            "en-IN"
                          )
                        : "N/A"}{" "}
                      –{" "}
                      {group.groupDuration?.to
                        ? new Date(group.groupDuration.to).toLocaleDateString(
                            "en-IN"
                          )
                        : "N/A"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate"
                      title={group.requestedBy
                        .map((u) => u.personalDetails?.fullName || u.email)
                        .join(", ")}
                    >
                      {group.requestedBy
                        .map((u) => u.personalDetails?.fullName || u.email)
                        .join(", ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {group.adminRemarks || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEdit(group)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        title="Edit Group"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(group._id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        title="Delete Group"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloseGroupManager;
