import React, { useState, useEffect } from "react";
import axiosInstance from "./axiosInstance"; // Adjust path as needed
import {
  UploadCloud, // Main heading icon
  FolderDot, // Group select icon
  Box, // Type select icon
  Github, // GitHub URL icon
  FolderOpen, // Cloned Repo Path icon
  FileJson, // Metadata icon
  FileInput, // File input icon
  Send, // Submit button icon
  Loader2, // Loading spinner
  CheckCircle, // Success message icon
  XCircle, // Error message icon
  Info, // Info icon for metadata hint
} from "lucide-react"; // Import necessary icons

const SoftwareRepoUpload = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [submitMessage, setSubmitMessage] = useState("");
  const [formData, setFormData] = useState({
    group: "",
    type: "",
    metadata: "",
    githubUrl: "",
    clonedRepoPath: "",
    file: null,
  });

  // Fetch groups on component mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axiosInstance.get("/api/groups");
        setGroups(res.data);
      } catch (err) {
        console.error("Failed to fetch groups", err.response || err);
        // Optionally set an error message for group fetching
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setSubmitStatus(null); // Clear status on change
    setSubmitMessage(""); // Clear message on change

    if (name === "file") {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    // Validate if a file or GitHub URL or Cloned Repo Path is provided
    if (!formData.file && !formData.githubUrl && !formData.clonedRepoPath) {
      setSubmitStatus("error");
      setSubmitMessage(
        "Please provide either a file, a GitHub URL, or a Cloned Repository Path."
      );
      setLoading(false);
      return;
    }

    if (!formData.group || !formData.type) {
      setSubmitStatus("error");
      setSubmitMessage("Please select both a Group and a Type.");
      setLoading(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("group", formData.group);
      payload.append("type", formData.type);
      if (formData.githubUrl) payload.append("githubUrl", formData.githubUrl);
      if (formData.clonedRepoPath)
        payload.append("clonedRepoPath", formData.clonedRepoPath);

      // Attempt to parse metadata to ensure it's valid JSON if provided
      if (formData.metadata) {
        try {
          const parsedMetadata = JSON.parse(formData.metadata);
          payload.append("metadata", JSON.stringify(parsedMetadata)); // Re-stringifys to ensure it's compact JSON
        } catch (jsonErr) {
          setSubmitStatus("error");
          setSubmitMessage(
            "Invalid JSON format for metadata. Please check your input."
          );
          setLoading(false);
          return;
        }
      }

      if (formData.file) payload.append("file", formData.file);

      await axiosInstance.post("/api/softwareRepo", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitStatus("success");
      setSubmitMessage("Software repository uploaded successfully!");
      setFormData({
        group: "",
        type: "",
        metadata: "",
        githubUrl: "",
        clonedRepoPath: "",
        file: null,
      });
      // Reset file input value to clear displayed file name
      if (document.getElementById("file-input")) {
        document.getElementById("file-input").value = "";
      }
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMessage(
        "Upload failed: " +
          (err.response?.data?.message ||
            err.message ||
            "An unknown error occurred.")
      );
      console.error("Upload error:", err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-800 placeholder-gray-500";
  const labelClasses =
    "block text-sm font-medium text-gray-700 mb-1 flex items-center";

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 mt-16">
      <div className=" mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        {/* Page Header */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center">
          <UploadCloud className="w-10 h-10 text-blue-600 mr-3" />
          Upload Software Repository
        </h2>

        {/* Submission Status Message */}
        {submitStatus && (
          <div
            className={`flex items-center p-4 mb-6 rounded-lg ${
              submitStatus === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
            role="alert"
          >
            {submitStatus === "success" ? (
              <CheckCircle className="w-6 h-6 mr-3" />
            ) : (
              <XCircle className="w-6 h-6 mr-3" />
            )}
            <span className="font-medium">{submitMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Select */}
          <div>
            <label htmlFor="group" className={labelClasses}>
              <FolderDot className="w-5 h-5 mr-2" />
              Select Group <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="group"
              name="group"
              value={formData.group}
              onChange={handleChange}
              required
              className={inputClasses}
            >
              <option value="">Choose a Group</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <div>
            <label htmlFor="type" className={labelClasses}>
              <Box className="w-5 h-5 mr-2" />
              Select Type <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className={inputClasses}
            >
              <option value="">Choose Repository Type</option>
              <option value="Document">Document</option>
              <option value="Code">Code</option>
              <option value="ZIP">ZIP File</option>
            </select>
          </div>

          {/* GitHub URL */}
          <div>
            <label htmlFor="githubUrl" className={labelClasses}>
              <Github className="w-5 h-5 mr-2" />
              GitHub URL (Optional)
            </label>
            <input
              type="url" // Changed to type="url" for better validation
              id="githubUrl"
              name="githubUrl"
              placeholder="e.g., https://github.com/user/repo-name"
              value={formData.githubUrl}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          {/* Cloned Repo Path */}
          <div>
            <label htmlFor="clonedRepoPath" className={labelClasses}>
              <FolderOpen className="w-5 h-5 mr-2" />
              Cloned Repository Path (Optional)
            </label>
            <input
              type="text"
              id="clonedRepoPath"
              name="clonedRepoPath"
              placeholder="e.g., /opt/cloned_repos/my-project"
              value={formData.clonedRepoPath}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          {/* Metadata Textarea */}
          <div>
            <label htmlFor="metadata" className={labelClasses}>
              <FileJson className="w-5 h-5 mr-2" />
              Metadata (Optional, JSON format)
            </label>
            <textarea
              id="metadata"
              name="metadata"
              placeholder='e.g., {"sizeInKB": 1200, "languages": ["Python", "JavaScript"]}'
              value={formData.metadata}
              onChange={handleChange}
              rows={4}
              className={`${inputClasses} resize-y`}
            />
            <p className="mt-2 text-sm text-gray-500 flex items-center">
              <Info className="w-4 h-4 mr-1 text-blue-400" />
              Provide additional information in valid JSON format.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="file-input" className={labelClasses}>
              <FileInput className="w-5 h-5 mr-2" />
              Upload File (Optional)
            </label>
            <input
              type="file"
              id="file-input" // Added an ID for resetting
              name="file"
              onChange={handleChange}
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer transition-colors duration-200"
            />
            {formData.file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {formData.file.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-3" />
                Upload Repository
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SoftwareRepoUpload;
