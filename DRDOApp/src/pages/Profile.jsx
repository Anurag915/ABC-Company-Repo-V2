
import { useEffect, useState } from "react";
import axios from "axios";
import { FileText, User, Briefcase, Info, Link, Calendar } from "lucide-react"; // Import more icons for better visual cues

const apiUri = import.meta.env.VITE_API_URL;
const designationOptions = {
  DRDS: ["Scientist 'B'", "Scientist 'C'", "Scientist 'D'"],
  DRTC: ["Technical Officer 'A'", "Technical Officer 'B'"],
  Admin: ["Admin Officer", "Store Officer"],
};
const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Editable fields state
  const [editPersonal, setEditPersonal] = useState({
    name: "",
    dob: "",
    mobile: "",
    address: "",
    gender: "",
    maritalStatus: "",
    bloodGroup: "", // Added bloodGroup
    emergencyContact: { name: "", relationship: "", mobile: "" },
  });
  const [editProfessional, setEditProfessional] = useState({
    designation: "",
    cadre: "",
    intercom: "",
    internetEmail: "",
    dronaEmail: "",
    pis: "",
    aebasId: "",
    joiningDate: "",
    skills: [],
    qualifications: [],
    role: "", // <--- ADD THIS LINE: Initialize role here
  });
  const [editAbout, setEditAbout] = useState("");
  const [employmentPeriod, setEmploymentPeriod] = useState({
    from: "",
    to: "",
  });
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    twitter: "",
    facebook: "",
    github: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const res = await axios.get(`${apiUri}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        // Initialize edit states
        setEditPersonal({
          name: res.data.personalDetails?.name || "",
          dob: res.data.personalDetails?.dob
            ? new Date(res.data.personalDetails.dob).toISOString().split("T")[0]
            : "",
          mobile: res.data.personalDetails?.mobile || "",
          address: res.data.personalDetails?.address || "",
          gender: res.data.personalDetails?.gender || "",
          maritalStatus: res.data.personalDetails?.maritalStatus || "",
          bloodGroup: res.data.personalDetails?.bloodGroup || "", // Initialize bloodGroup
          emergencyContact: res.data.personalDetails?.emergencyContact || {
            name: "",
            relationship: "", // Corrected: changed 'relation' to 'relationship'
            mobile: "", // Corrected: changed 'phone' to 'mobile'
          },
        });
        setEditProfessional({
          designation: res.data.professionalDetails?.designation || "",
          cadre: res.data.professionalDetails?.cadre || "",
          intercom: res.data.professionalDetails?.intercom || "",
          internetEmail: res.data.professionalDetails?.internetEmail || "",
          dronaEmail: res.data.professionalDetails?.dronaEmail || "",
          pis: res.data.professionalDetails?.pis || "",
          aebasId: res.data.professionalDetails?.aebasId || "",
          joiningDate: res.data.professionalDetails?.joiningDate
            ? new Date(res.data.professionalDetails.joiningDate)
                .toISOString()
                .split("T")[0]
            : "",
          skills: res.data.professionalDetails?.skills || [],
          qualifications: res.data.professionalDetails?.qualifications || [],
          role: res.data.role || "", // <--- ADD THIS LINE: Get role from API response
        });
        setEditAbout(res.data.about || "");
        setEmploymentPeriod({
          from: res.data.employmentPeriod?.from
            ? new Date(res.data.employmentPeriod.from)
                .toISOString()
                .split("T")[0]
            : "",
          to: res.data.employmentPeriod?.to
            ? new Date(res.data.employmentPeriod.to).toISOString().split("T")[0]
            : "",
        });
        setSocialLinks(
          res.data.socialLinks || {
            linkedin: "",
            twitter: "",
            facebook: "",
            github: "",
          }
        );
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photo) return alert("Please select a photo first.");

    const formData = new FormData();
    formData.append("photo", photo);

    try {
      const res = await fetch(`${apiUri}/api/users/${user._id}/upload-photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Photo updated successfully!");
        setUser((prev) => ({ ...prev, photo: data.photo }));
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Photo upload error", error);
      alert("An error occurred during photo upload.");
    }
  };

  const handleEditClick = () => setEditMode(true);

  // Removed handleCadreChange as it was using setFormData which is not defined.
  // The logic is now within updateProfessional directly, setting designation to "" when cadre changes.

 const handleSaveProfile = async () => {
  try {
    const res = await axios.put(
      `${apiUri}/api/users/${user._id}`,
      {
        personalDetails: editPersonal,
        professionalDetails: {
          ...editProfessional,
          role: undefined, // Prevent sending role inside this object
        },
        role: editProfessional.role, // Send role at top level
        about: editAbout,
        employmentPeriod,
        socialLinks,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUser(res.data);
    setEditMode(false);
    alert("Profile updated successfully!");
  } catch (err) {
    console.error("Profile update failed", err);
    alert("Failed to update profile. Please try again.");
  }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-10 bg-white rounded-xl shadow-md">
          <div className="w-16 h-16 mx-auto border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-5 text-gray-600 text-lg font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-10 bg-white rounded-xl shadow-md">
          <p className="text-red-500 text-xl font-semibold">
            Failed to load profile. Please try refreshing.
          </p>
        </div>
      </div>
    );
  }

  // Helper to update nested personalDetails inputs
  const updatePersonal = (field, value) => {
    if (field.startsWith("emergencyContact.")) {
      const key = field.split(".")[1];
      setEditPersonal((prev) => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [key]: value },
      }));
    } else {
      setEditPersonal((prev) => ({ ...prev, [field]: value }));
    }
  };

  const updateProfessional = (field, value) => {
    setEditProfessional((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "cadre" ? { designation: "" } : {}), // Clear designation when cadre changes
    }));
  };

  // Update social links helper
  const updateSocialLink = (platform, value) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl  mx-auto p-8 md:p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-4xl font-extrabold text-[#003168] mb-2 leading-tight">
              Hello, {user?.personalDetails?.name || "User"}!
            </h2>

            <p className="text-gray-600 text-xl">
              Welcome to your personalized dashboard.
            </p>
          </div>

          <div className="mt-6 md:mt-0 relative group">
            {user.photo ? (
              <img
                src={`${apiUri}${user.photo}`}
                alt="Profile"
                className="w-36 h-44 object-cover rounded-xl shadow-lg border-4 border-blue-100 group-hover:scale-105 transition-transform duration-300 ease-in-out"
              />
            ) : (
              <div className="w-36 h-44 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-lg text-center text-sm font-semibold border-4 border-blue-200">
                <User size={40} className="mb-2" />
                No Photo
              </div>
            )}
            <form
              onSubmit={handlePhotoUpload}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <label
                htmlFor="photo-upload"
                className="cursor-pointer bg-white text-[#003168] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 shadow-md"
              >
                Change Photo
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="hidden"
              />
              {photo && (
                <button
                  type="submit"
                  className="mt-2 bg-[#003168] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition shadow-md"
                >
                  Upload
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Personal Details */}
        <section className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-100 mb-8">
          <h3 className="text-2xl font-semibold text-[#003168] mb-5 flex items-center">
            <User className="mr-3" size={24} /> Personal Details
          </h3>

          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Name"
                value={editPersonal.name}
                onChange={(e) => updatePersonal("name", e.target.value)}
              />
              <InputField
                label="Date of Birth"
                type="date"
                value={editPersonal.dob}
                onChange={(e) => updatePersonal("dob", e.target.value)}
              />
              <InputField
                label="Mobile"
                value={editPersonal.mobile}
                onChange={(e) => updatePersonal("mobile", e.target.value)}
              />
              <TextAreaField
                label="Address"
                value={editPersonal.address}
                onChange={(e) => updatePersonal("address", e.target.value)}
                rows={3}
              />
              <SelectField
                label="Gender"
                value={editPersonal.gender}
                onChange={(e) => updatePersonal("gender", e.target.value)}
                options={[
                  { value: "", label: "Select gender" },
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
              />
              <SelectField
                label="Blood Group"
                value={editPersonal.bloodGroup}
                onChange={(e) => updatePersonal("bloodGroup", e.target.value)}
                options={[
                  { value: "", label: "Select Blood Group" },
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                ]}
              />
              <SelectField
                label="Marital Status"
                value={editPersonal.maritalStatus}
                onChange={(e) =>
                  updatePersonal("maritalStatus", e.target.value)
                }
                options={[
                  { value: "", label: "Select status" },
                  { value: "Single", label: "Single" },
                  { value: "Married", label: "Married" },
                  { value: "Other", label: "Other" },
                ]}
              />
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 border-t pt-4 mt-4 border-blue-200">
                <InputField
                  label="Emergency Contact Name"
                  value={editPersonal.emergencyContact.name}
                  onChange={(e) =>
                    updatePersonal("emergencyContact.name", e.target.value)
                  }
                />
                <InputField
                  label="Emergency Contact Relation"
                  value={editPersonal.emergencyContact.relationship} // Corrected
                  onChange={(e) =>
                    updatePersonal(
                      "emergencyContact.relationship",
                      e.target.value
                    )
                  }
                />
                <InputField
                  label="Emergency Contact Phone"
                  value={editPersonal.emergencyContact.mobile} // Corrected
                  onChange={(e) =>
                    updatePersonal("emergencyContact.mobile", e.target.value)
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-gray-700 text-lg">
              <ProfileDetail
                label="Name"
                value={user?.personalDetails?.name || "N/A"}
              />
              <ProfileDetail
                label="Date of Birth"
                value={
                  user?.personalDetails?.dob
                    ? new Date(user.personalDetails.dob).toLocaleDateString()
                    : "N/A"
                }
              />

              <ProfileDetail
                label="Mobile"
                value={user?.personalDetails?.mobile || "N/A"}
              />
              <ProfileDetail
                label="Address"
                value={user?.personalDetails?.address || "N/A"}
              />
              <ProfileDetail
                label="Gender"
                value={user?.personalDetails?.gender || "N/A"}
              />
              <ProfileDetail
                label="Blood Group"
                value={user?.personalDetails?.bloodGroup || "N/A"}
              />
              <ProfileDetail
                label="Marital Status"
                value={user?.personalDetails?.maritalStatus || "N/A"}
              />
              <div className="md:col-span-2 pt-4 mt-4 border-t border-blue-200">
                <p className="font-semibold text-gray-800 mb-2">
                  Emergency Contact:
                </p>
                <ul className="ml-5 list-disc text-gray-600">
                  <li>
                    <strong>Name:</strong>{" "}
                    {user?.personalDetails?.emergencyContact?.name || "N/A"}
                  </li>
                  <li>
                    <strong>Relation:</strong>{" "}
                    {user?.personalDetails?.emergencyContact?.relationship ||
                      "N/A"}
                  </li>
                  <li>
                    <strong>Phone:</strong>{" "}
                    {user?.personalDetails?.emergencyContact?.mobile || "N/A"}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Professional Details */}
        <section className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-100 mb-8">
          <h3 className="text-2xl font-semibold text-[#003168] mb-5 flex items-center">
            <Briefcase className="mr-3" size={24} /> Professional Details
          </h3>

          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Cadre Select */}
              <SelectField
                label="Cadre"
                value={editProfessional.cadre}
                onChange={(e) => updateProfessional("cadre", e.target.value)}
                options={[
                  { value: "", label: "Select Cadre" },
                  { value: "DRDS", label: "DRDS" },
                  { value: "DRTC", label: "DRTC" },
                  { value: "Admin", label: "Admin" },
                  { value: "Other", label: "Other" },
                ]}
              />

              {/* Dynamic Designation Select/Input */}
              {editProfessional.cadre &&
                editProfessional.cadre !== "Other" &&
                designationOptions[editProfessional.cadre] && (
                  <SelectField
                    label="Designation"
                    value={editProfessional.designation}
                    onChange={(e) =>
                      updateProfessional("designation", e.target.value)
                    }
                    options={[
                      { value: "", label: "Select Designation" },
                      ...designationOptions[editProfessional.cadre].map(
                        (desig) => ({ value: desig, label: desig })
                      ),
                    ]}
                  />
                )}

              {editProfessional.cadre === "Other" && (
                <InputField
                  label="Designation"
                  type="text"
                  value={editProfessional.designation}
                  onChange={(e) =>
                    updateProfessional("designation", e.target.value)
                  }
                  placeholder="Enter Designation"
                />
              )}

              {/* Role Input/Select */}
              <InputField // <--- ADD THIS INPUT FIELD FOR ROLE
                label="Role"
                value={editProfessional.role}
                onChange={(e) => updateProfessional("role", e.target.value)}
                placeholder="e.g., Administrator, Member"
              />

              <InputField
                label="Intercom"
                value={editProfessional.intercom}
                onChange={(e) => updateProfessional("intercom", e.target.value)}
              />
              <InputField
                label="Internet Email"
                type="email"
                value={editProfessional.internetEmail}
                onChange={(e) =>
                  updateProfessional("internetEmail", e.target.value)
                }
              />
              <InputField
                label="DRONA Email"
                type="email"
                value={editProfessional.dronaEmail}
                onChange={(e) =>
                  updateProfessional("dronaEmail", e.target.value)
                }
              />
              <InputField
                label="PIS"
                value={editProfessional.pis}
                onChange={(e) => updateProfessional("pis", e.target.value)}
              />
              <InputField
                label="AEBAS ID"
                value={editProfessional.aebasId}
                onChange={(e) => updateProfessional("aebasId", e.target.value)}
              />
              <InputField
                label="Joining Date"
                type="date"
                value={editProfessional.joiningDate}
                onChange={(e) =>
                  updateProfessional("joiningDate", e.target.value)
                }
              />
              <div className="md:col-span-2">
                <InputField
                  label="Skills (comma separated)"
                  value={editProfessional.skills.join(", ")}
                  onChange={(e) =>
                    updateProfessional(
                      "skills",
                      e.target.value.split(",").map((s) => s.trim())
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-gray-700 text-lg">
              <ProfileDetail
                label="Designation"
                value={user?.professionalDetails?.designation || "N/A"}
              />
              <ProfileDetail
                label="Cadre"
                value={user?.professionalDetails?.cadre || "N/A"}
              />
              <ProfileDetail // <--- ADD THIS ProfileDetail FOR ROLE
                label="Role"
                value={user?.role || "N/A"}
              />
              <ProfileDetail
                label="Intercom"
                value={user?.professionalDetails?.intercom || "N/A"}
              />
              <ProfileDetail
                label="Internet Email"
                value={user?.professionalDetails?.internetEmail || "N/A"}
              />
              <ProfileDetail
                label="DRONA Email"
                value={user?.professionalDetails?.dronaEmail || "N/A"}
              />
              <ProfileDetail
                label="PIS"
                value={user?.professionalDetails?.pis || "N/A"}
              />
              <ProfileDetail
                label="AEBAS ID"
                value={user?.professionalDetails?.aebasId || "N/A"}
              />
              <ProfileDetail
                label="Joining Date"
                value={
                  user?.professionalDetails?.joiningDate
                    ? new Date(
                        user.professionalDetails.joiningDate
                      ).toLocaleDateString()
                    : "N/A"
                }
              />
              <ProfileDetail
                label="Skills"
                value={
                  (user?.professionalDetails?.skills || []).length > 0
                    ? user.professionalDetails.skills.join(", ")
                    : "N/A"
                }
                className="md:col-span-2"
              />
            </div>
          )}
        </section>

        {/* About Section */}
        <section className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-100 mb-8">
          <h3 className="text-2xl font-semibold text-[#003168] mb-5 flex items-center">
            <Info className="mr-3" size={24} /> About Me
          </h3>
          {editMode ? (
            <TextAreaField
              value={editAbout}
              onChange={(e) => setEditAbout(e.target.value)}
              rows={4}
              placeholder="Tell us something about yourself..."
            />
          ) : (
            <p className="text-gray-700 text-lg leading-relaxed">
              {user?.about || "No description provided."}
            </p>
          )}
        </section>

        {/* Employment Period */}
        <section className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-100 mb-8 mx-auto">
          <h3 className="text-2xl font-semibold text-[#003168] mb-5 flex items-center">
            <Calendar className="mr-3" size={24} /> Employment Period
          </h3>
          {editMode ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <InputField
                label="From"
                type="date"
                value={employmentPeriod?.from || ""}
                onChange={(e) =>
                  setEmploymentPeriod((p) => ({ ...p, from: e.target.value }))
                }
              />
              <InputField
                label="To"
                type="date"
                value={employmentPeriod?.to || ""}
                onChange={(e) =>
                  setEmploymentPeriod((p) => ({ ...p, to: e.target.value }))
                }
              />
            </div>
          ) : (
            <p className="text-gray-700 text-lg">
              <span className="font-medium">From:</span>{" "}
              {user?.employmentPeriod?.from
                ? new Date(user.employmentPeriod.from).toLocaleDateString()
                : "N/A"}{" "}
              <span className="font-medium ml-4">To:</span>{" "}
              {user?.employmentPeriod?.to
                ? new Date(user.employmentPeriod.to).toLocaleDateString()
                : "Present"}
            </p>
          )}
        </section>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200 text-lg font-medium shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="bg-[#003168] text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors duration-200 text-lg font-medium shadow-md"
              >
                Save Profile
              </button>
            </>
          ) : (
            <button
              onClick={handleEditClick}
              className="bg-[#003168] text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors duration-200 text-lg font-medium shadow-md"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

// --- Reusable Components for better readability and maintainability ---

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
}) => (
  <div>
    <label className="block text-gray-700 text-base font-medium mb-1">
      {label}:
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-200 text-lg"
      placeholder={placeholder}
    />
  </div>
);

const TextAreaField = ({
  label,
  value,
  onChange,
  rows = 3,
  placeholder = "",
}) => (
  <div>
    <label className="block text-gray-700 text-base font-medium mb-1">
      {label}:
    </label>
    <textarea
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 px-4 py-2 rounded-lg resize-y focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-200 text-lg"
      rows={rows}
      placeholder={placeholder}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-gray-700 text-base font-medium mb-1">
      {label}:
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-200 text-lg"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const ProfileDetail = ({ label, value, className = "" }) => (
  <p className={className}>
    <strong className="text-gray-800">{label}:</strong> {value || "N/A"}
  </p>
);