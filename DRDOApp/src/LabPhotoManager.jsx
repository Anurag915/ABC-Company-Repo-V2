import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Camera,
  ImagePlus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Eye,
} from "lucide-react"; // Added Eye iconimport toast from "react-hot-toast"; // For sleek notifications

const apiUri = import.meta.env.VITE_API_URL || "http://localhost:5000"; // Ensure default value

const LabPhotoManager = () => {
  const [labId, setLabId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [newPhoto, setNewPhoto] = useState({
    name: "",
    description: "",
    file: null,
  });
  const [editing, setEditing] = useState(null); // { id, name, description }
  const [uploading, setUploading] = useState(false); // Specific loading for upload
  const [fetchingPhotos, setFetchingPhotos] = useState(true); // Loading for initial fetch

  const token = localStorage.getItem("token");

  // Fetch Lab ID
  useEffect(() => {
    const fetchLab = async () => {
      try {
        const res = await axios.get(`${apiUri}/api/labs/only`);
        setLabId(res.data._id);
      } catch (err) {
        console.error("Failed to load lab:", err);
        toast.error("Failed to load lab information.");
      }
    };
    fetchLab();
  }, []);

  // Fetch Lab Photos
  const fetchPhotos = async () => {
    if (!labId) return;
    setFetchingPhotos(true); // Start loading
    try {
      const res = await axios.get(`${apiUri}/api/labs/${labId}/photos`);
      const data = Array.isArray(res.data) ? res.data : res.data.photos || [];
      const filtered = data.filter((p) => p && p._id); // Filter out null/undefined entries
      setPhotos(filtered);
    } catch (err) {
      console.error("Failed to fetch photos:", err);
      toast.error("Failed to fetch lab photos.");
      setPhotos([]); // Clear photos on error
    } finally {
      setFetchingPhotos(false); // End loading
    }
  };

  useEffect(() => {
    // Only fetch photos once labId is available
    if (labId) {
      fetchPhotos();
    }
  }, [labId]); // Dependency on labId

  // Handle Photo Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newPhoto.file || !newPhoto.name || !newPhoto.description) {
      toast.error("Please fill all fields and select a file.");
      return;
    }
    if (!labId) {
      toast.error("Lab information not loaded. Please try again.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", newPhoto.file);
    formData.append("name", newPhoto.name);
    formData.append("description", newPhoto.description);

    setUploading(true); // Start upload loading
    try {
      const res = await axios.post(
        `${apiUri}/api/labs/${labId}/upload-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Assuming the backend returns the newly uploaded photo object
      setPhotos((prev) => [...prev, res.data.photo]);
      setNewPhoto({ name: "", description: "", file: null }); // Clear form
      toast.success("Photo uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(
        err.response?.data?.message || "Photo upload failed. Please try again."
      );
    } finally {
      setUploading(false); // End upload loading
    }
  };

  // Handle Photo Deletion
  const handleDelete = async (photoId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this photo? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await axios.delete(`${apiUri}/api/labs/${labId}/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPhotos((prev) => prev.filter((p) => p._id !== photoId));
      toast.success("Photo deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(
        err.response?.data?.message ||
          "Photo deletion failed. Please try again."
      );
    }
  };

  // Handle Photo Edit
  const handleEdit = async (photoId) => {
    if (!editing.name || !editing.description) {
      toast.error("Photo name and description cannot be empty.");
      return;
    }
    try {
      const res = await axios.put(
        `${apiUri}/api/labs/${labId}/photos/${photoId}`,
        {
          name: editing.name,
          description: editing.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedPhoto = res.data.photo || res.data; // Adjust based on your API response
      setPhotos((prev) =>
        prev.map((p) => (p._id === photoId ? updatedPhoto : p))
      );
      setEditing(null); // Exit editing mode
      toast.success("Photo updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(
        err.response?.data?.message || "Photo update failed. Please try again."
      );
    }
  };

  // Helper function to get image URL, handling potential relative paths
  const getImageUrl = (fileUrl) => {
    if (typeof fileUrl === "string") {
      return fileUrl.startsWith("http") ? fileUrl : `${apiUri}${fileUrl}`;
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 mt-6">
      <div className=" mx-auto">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-10 text-center flex items-center justify-center">
          <Camera className="w-10 h-10 text-indigo-600 mr-4" />
          Manage Lab Photos
        </h2>

        {/* Upload New Photo Section */}
        <section className="bg-white p-8 rounded-2xl shadow-xl mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <ImagePlus className="w-7 h-7 text-green-600 mr-3" />
            Upload New Photo
          </h3>
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label
                htmlFor="photoName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Photo Title
              </label>
              <input
                id="photoName"
                type="text"
                placeholder="e.g., 'Lab Entrance'"
                value={newPhoto.name}
                onChange={(e) =>
                  setNewPhoto({ ...newPhoto, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                required
              />
            </div>
            <div>
              <label
                htmlFor="photoDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="photoDescription"
                placeholder="Brief description of the photo content."
                value={newPhoto.description}
                onChange={(e) =>
                  setNewPhoto({ ...newPhoto, description: e.target.value })
                }
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-y"
                required
              />
            </div>
            <div>
              <label
                htmlFor="photoFile"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Photo File
              </label>
              <input
                id="photoFile"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewPhoto({ ...newPhoto, file: e.target.files[0] })
                }
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                required
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  Uploading...
                </>
              ) : (
                "Upload Photo"
              )}
            </button>
          </form>
        </section>

        {/* Photo List Section */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Camera className="w-7 h-7 text-blue-600 mr-3" />
            Existing Lab Photos
          </h3>

          {fetchingPhotos ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="ml-3 text-lg text-gray-600">Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-lg">
              No photos found. Start by uploading one!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {photos.map((photo) => {
                if (!photo || !photo._id) return null; // Defensive check
                const imageUrl = getImageUrl(photo.fileUrl);

                return (
                  <div
                    key={photo._id}
                    className="group relative bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden transform transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
                  >
                    {imageUrl && (
                      <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={photo.name || "Lab Photo"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null; // Prevents infinite loop
                            e.target.src =
                              "https://via.placeholder.com/400x250?text=Image+Not+Found"; // Placeholder
                          }}
                        />
                        {/* Overlay for actions on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white bg-indigo-700 hover:bg-indigo-800 p-2 rounded-full mx-1"
                            title="View Full Size"
                          >
                            <Eye className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {editing?.id === photo._id ? (
                        <>
                          <input
                            type="text"
                            value={editing.name}
                            onChange={(e) =>
                              setEditing({ ...editing, name: e.target.value })
                            }
                            className="w-full text-lg font-semibold border-b pb-1 focus:outline-none focus:border-indigo-500"
                            aria-label="Edit Photo Title"
                          />
                          <textarea
                            value={editing.description}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                description: e.target.value,
                              })
                            }
                            rows="2"
                            className="w-full text-gray-700 border-b pb-1 focus:outline-none focus:border-indigo-500 resize-y"
                            aria-label="Edit Photo Description"
                          />
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => handleEdit(photo._id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              title="Save Changes"
                            >
                              <Save className="w-4 h-4 mr-2" /> Save
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="Cancel Editing"
                            >
                              <X className="w-4 h-4 mr-2" /> Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h4 className="text-xl font-bold text-gray-900 truncate">
                            {photo.name}
                          </h4>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {photo.description}
                          </p>
                          <div className="flex justify-end space-x-3 pt-3">
                            <button
                              onClick={() =>
                                setEditing({
                                  id: photo._id,
                                  name: photo.name,
                                  description: photo.description,
                                })
                              }
                              className="p-2 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150"
                              title="Edit Photo"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(photo._id)}
                              className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LabPhotoManager;
