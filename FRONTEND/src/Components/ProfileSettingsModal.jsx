import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { User, X, ImagePlus, Github, Linkedin } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProfileSettingsModal({ isOpen, onClose, user, onSaveSuccess }) {
  const [profileFormData, setProfileFormData] = useState({ name: "", profileImage: "", github: "", linkedin: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setProfileFormData({
        name: user.name || "",
        profileImage: user.profileImage || "",
        github: user.github || "",
        linkedin: user.linkedin || ""
      });
    }
  }, [user, isOpen]);



  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        formData
      );
      setProfileFormData({ ...profileFormData, profileImage: res.data.secure_url });
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload error", err);
      toast.error("Failed to upload image. Please check your connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      // Use the student token for authentication
      const token = localStorage.getItem("studentToken");
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/student/profile`,
        { name: profileFormData.name, profileImage: profileFormData.profileImage, github: profileFormData.github, linkedin: profileFormData.linkedin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Profile updated successfully!");
      if (onSaveSuccess) onSaveSuccess(profileFormData);
      onClose();
    } catch (error) {
      console.error("Error saving profile", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const modalContent = !isOpen ? null : (
    <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User size={20} className="text-blue-600" /> Profile Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm bg-slate-50">
                {profileFormData.profileImage || user?.profileImage ? (
                  <img 
                    src={profileFormData.profileImage || user?.profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-blue-600 bg-blue-50">
                    {(profileFormData.name || user?.name || "U").charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-colors">
                <ImagePlus size={16} />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            {isUploading && <span className="text-xs font-bold text-blue-600 animate-pulse">Uploading image...</span>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={profileFormData.name}
                onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-700 bg-slate-50"
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">GitHub Profile URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Github size={16} />
                </div>
                <input
                  type="url"
                  value={profileFormData.github}
                  onChange={(e) => setProfileFormData({...profileFormData, github: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-700 bg-slate-50"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">LinkedIn Profile URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Linkedin size={16} />
                </div>
                <input
                  type="url"
                  value={profileFormData.linkedin}
                  onChange={(e) => setProfileFormData({...profileFormData, linkedin: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-700 bg-slate-50"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile</label>
              <input
                type="text"
                value={user?.mobile || ""}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveProfile}
            disabled={isSavingProfile || isUploading}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
