import React, { useState, useEffect } from "react";
import axios from "./axiosInstance"; // Your configured axios instance
import {
  UploadCloud, // Main heading icon
  FolderDot, // Group select icon
  Code, // Type input icon (can be changed based on what 'type' represents)
  Github, // GitHub URL icon
  FolderOpen, // Cloned Repo Path icon
  Scale, // SizeInKB icon
  Clock, // Duration icon
  Languages, // Language Used icon
  FileInput, // File input icon
  Send, // Submit button icon
  Loader2, // Loading spinner
  CheckCircle, // Success message icon
  XCircle, // Error message icon
  Info, // Info icon for metadata hints
} from "lucide-react"; // Import necessary icons

const TrialRepoUploader = () => {
  const [formData, setFormData] = useState({
    group: "",
    type: "",
    githubUrl: "",
    clonedRepoPath: "",
    // metadata fields are now individual states for easier handling
    sizeInKB: "",
    duration: "",
    languageUsed: "",
  });
  const [file, setFile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [submitMessage, setSubmitMessage] = useState("");

  // --- Fetch Groups ---
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get("/api/groups");
        setGroups(res.data);
      } catch (err) {
        console.error("Failed to load groups:", err);
        setSubmitStatus("error");
        setSubmitMessage(
          "Failed to load groups. Please try refreshing the page."
        );
      }
    };
    fetchGroups();
  }, []);

  // --- Handle Form Field Changes ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Clear status messages on any input change
    setSubmitStatus(null);
    setSubmitMessage("");

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Handle File Change ---
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // Clear status messages on file input change
    setSubmitStatus(null);
    setSubmitMessage("");
  };

  // --- Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    // Client-side validation
    if (!formData.group || !formData.type || !file) {
      setSubmitStatus("error");
      setSubmitMessage(
        "Please fill in all required fields (Group, Type, and upload a File)."
      );
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("group", formData.group);
    data.append("type", formData.type);

    // Only append if values exist
    if (formData.githubUrl) data.append("githubUrl", formData.githubUrl);
    if (formData.clonedRepoPath)
      data.append("clonedRepoPath", formData.clonedRepoPath);

    // Construct metadata object
    const metadata = {};
    if (formData.sizeInKB) metadata.sizeInKB = parseFloat(formData.sizeInKB);
    if (formData.duration) metadata.duration = parseFloat(formData.duration);
    if (formData.languageUsed) {
      // Split by comma and trim each language
      metadata.languageUsed = formData.languageUsed
        .split(",")
        .map((lang) => lang.trim())
        .filter((lang) => lang);
    }
    data.append("metadata", JSON.stringify(metadata));
    data.append("file", file);

    try {
      await axios.post("/api/trialRepo", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitStatus("success");
      setSubmitMessage("Trial repository uploaded successfully!");
      // Reset form fields
      setFormData({
        group: "",
        type: "",
        githubUrl: "",
        clonedRepoPath: "",
        sizeInKB: "",
        duration: "",
        languageUsed: "",
      });
      setFile(null); // Clear selected file
      // Reset the file input element directly
      if (document.getElementById("file-input-trial")) {
        document.getElementById("file-input-trial").value = "";
      }
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message || err);
      setSubmitStatus("error");
      setSubmitMessage(
        "Upload failed: " +
          (err.response?.data?.message || "An unknown error occurred.")
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Reusable Tailwind CSS Classes ---
  const inputClasses =
    "w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-800 placeholder-gray-500";
  const labelClasses =
    "block text-sm font-medium text-gray-700 mb-1 flex items-center";
  const sectionTitleClasses =
    "text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center";

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 mt-16">
      <div className=" mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        {/* --- Page Header --- */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center">
          <UploadCloud className="w-10 h-10 text-blue-600 mr-3" />
          Upload Trial Repository
        </h2>

        {/* --- Submission Status Message --- */}
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

        {/* --- Upload Form --- */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Basic Information */}
          <div className="space-y-4">
            <h3 className={sectionTitleClasses}>
              <Info className="w-5 h-5 mr-2 text-blue-500" /> Basic Information
            </h3>

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
                className={inputClasses}
                required
              >
                <option value="">Choose a Group</option>
                {groups.length === 0 ? (
                  <option disabled>Loading groups...</option>
                ) : (
                  groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Type Input */}
            {/* <div>
              <label htmlFor="type" className={labelClasses}>
                <Code className="w-5 h-5 mr-2" />
                Type <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="type"
                name="type"
                placeholder="e.g., software, document"
                value={formData.type}
                onChange={handleChange}
                className={inputClasses}
                required
              />
            </div> */}

            {/* Type Select Dropdown */}
            <div>
              <label htmlFor="type" className={labelClasses}>
                <Code className="w-5 h-5 mr-2" />
                Type <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={inputClasses}
                required
              >
                <option value="">Choose a Type</option>
                <option value="Document">Document</option>
                <option value="video">Video</option>
                <option value="ZIP">ZIP</option>
              </select>
            </div>
          </div>

          {/* Section: External Links */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <h3 className={sectionTitleClasses}>
              <Github className="w-5 h-5 mr-2 text-gray-600" /> External Links
              (Optional)
            </h3>

            {/* GitHub URL */}
            <div>
              <label htmlFor="githubUrl" className={labelClasses}>
                <Github className="w-5 h-5 mr-2" />
                GitHub URL
              </label>
              <input
                type="url" // Changed to type="url" for better validation
                id="githubUrl"
                name="githubUrl"
                placeholder="e.g., https://github.com/user/repo"
                value={formData.githubUrl}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>

            {/* Cloned Repo Path */}
            <div>
              <label htmlFor="clonedRepoPath" className={labelClasses}>
                <FolderOpen className="w-5 h-5 mr-2" />
                Cloned Repository Path
              </label>
              <input
                type="text"
                id="clonedRepoPath"
                name="clonedRepoPath"
                placeholder="e.g., /mnt/projects/trial_repo"
                value={formData.clonedRepoPath}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Section: Metadata */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <h3 className={sectionTitleClasses}>
              <Scale className="w-5 h-5 mr-2 text-green-600" /> Metadata
              (Optional)
            </h3>

            {/* Size (KB) */}
            <div>
              <label htmlFor="sizeInKB" className={labelClasses}>
                <Scale className="w-5 h-5 mr-2" />
                Size (in KB)
              </label>
              <input
                type="number"
                id="sizeInKB"
                name="sizeInKB"
                placeholder="e.g., 1024"
                value={formData.sizeInKB}
                onChange={handleChange}
                className={inputClasses}
                min="0" // Ensure non-negative
              />
            </div>

            {/* Duration (minutes) */}
            <div>
              <label htmlFor="duration" className={labelClasses}>
                <Clock className="w-5 h-5 mr-2" />
                Duration (in minutes)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                placeholder="e.g., 60"
                value={formData.duration}
                onChange={handleChange}
                className={inputClasses}
                min="0" // Ensure non-negative
              />
            </div>

            {/* Languages Used */}
            <div>
              <label htmlFor="languageUsed" className={labelClasses}>
                <Languages className="w-5 h-5 mr-2" />
                Languages Used (comma separated)
              </label>
              <input
                type="text"
                id="languageUsed"
                name="languageUsed"
                placeholder="e.g., Python, JavaScript, HTML"
                value={formData.languageUsed}
                onChange={handleChange}
                className={inputClasses}
              />
              <p className="mt-2 text-sm text-gray-500 flex items-center">
                <Info className="w-4 h-4 mr-1 text-blue-400" />
                List programming languages, separated by commas.
              </p>
            </div>
          </div>

          {/* Section: File Upload */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <h3 className={sectionTitleClasses}>
              <FileInput className="w-5 h-5 mr-2 text-purple-600" /> File Upload
              <span className="text-red-500 ml-1">*</span>
            </h3>

            {/* File Input */}
            <div>
              <label htmlFor="file-input-trial" className="sr-only">
                Upload File
              </label>{" "}
              {/*sr-only for accessibility, visually hidden */}
              <input
                type="file"
                id="file-input-trial"
                accept=".pdf,.doc,.docx,.mp4,.zip,.rar,.txt,.jpg,.jpeg,.png,.gif" // Expanded common file types
                onChange={handleFileChange}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer transition-colors duration-200"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected file:{" "}
                  <span className="font-medium text-blue-700">{file.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* --- Submit Button --- */}
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
                Upload Trial Repository
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrialRepoUploader;
