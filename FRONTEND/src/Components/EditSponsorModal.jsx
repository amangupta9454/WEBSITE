import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Upload, Calendar, Building2, Loader2, Info } from 'lucide-react';

const EditSponsorModal = ({ isOpen, onClose, quizName, initialSponsorName, initialSponsorSignatoryName, initialQuizDate, initialSponsorLinkedIn, onUpdateSuccess }) => {
  const [sponsorName, setSponsorName] = useState(initialSponsorName || '');
  const [sponsorSignatoryName, setSponsorSignatoryName] = useState(initialSponsorSignatoryName || '');
  const [quizDate, setQuizDate] = useState(initialQuizDate || '');
  const [sponsorLinkedIn, setSponsorLinkedIn] = useState(initialSponsorLinkedIn || '');
  const [sponsorLogoBase64, setSponsorLogoBase64] = useState("");
  const [sponsorSignatureBase64, setSponsorSignatureBase64] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const convertToBase64 = (file, setBase64) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    if (isOpen && quizName) {
      const fetchSponsorDetails = async () => {
        try {
          const token = localStorage.getItem('adminToken');
          const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants/sponsor/${encodeURIComponent(quizName)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success && res.data.sponsorDetails) {
            if (res.data.sponsorDetails.sponsorLinkedIn) {
              setSponsorLinkedIn(res.data.sponsorDetails.sponsorLinkedIn);
            }
          }
        } catch (err) {
          console.error("Failed to fetch sponsor details:", err);
        }
      };
      fetchSponsorDetails();
    }
  }, [isOpen, quizName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quizName) {
      toast.error('Quiz name is missing');
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('adminToken');
      
      const payload = {
        quizName: quizName
      };

      if (sponsorName !== undefined) payload.sponsorName = sponsorName;
      if (sponsorSignatoryName !== undefined) payload.sponsorSignatoryName = sponsorSignatoryName;
      if (quizDate !== undefined) payload.quizDate = quizDate;
      if (sponsorLinkedIn !== undefined) payload.sponsorLinkedIn = sponsorLinkedIn;
      if (sponsorLogoBase64) payload.sponsorLogoUrl = sponsorLogoBase64;
      if (sponsorSignatureBase64) payload.sponsorSignatureUrl = sponsorSignatureBase64;

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants/update-sponsor`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(`Sponsor updated for ${res.data.modifiedCount} candidates!`);
        onUpdateSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update sponsor details');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden mt-10 mb-10">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Edit Quiz Details</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Update details for <span className="text-indigo-600 font-bold">{quizName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Any changes made here will be applied to <strong>all existing candidates</strong> who participated in the <strong>{quizName}</strong> assessment.
            </p>
          </div>

          <div className="space-y-5">
            {/* Sponsor Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Sponsor Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Google, Microsoft"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
              />
            </div>

            {/* Sponsor LinkedIn */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Sponsor LinkedIn URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://www.linkedin.com/company/..."
                value={sponsorLinkedIn}
                onChange={(e) => setSponsorLinkedIn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
              />
            </div>

            {/* Sponsor Signatory Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Signatory Name (Founder / Authorized Person)
              </label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                value={sponsorSignatoryName}
                onChange={(e) => setSponsorSignatoryName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
              />
            </div>

            {/* Quiz Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Quiz Date (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., August 10, 2026"
                value={quizDate}
                onChange={(e) => setQuizDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
              />
            </div>

            {/* Sponsor Logo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Sponsor Logo (Optional)</span>
                {sponsorLogoBase64 && <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Selected</span>}
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => convertToBase64(e.target.files[0], setSponsorLogoBase64)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 group-hover:border-indigo-400 group-hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">
                    Click to upload logo
                  </span>
                </div>
              </div>
            </div>

            {/* Sponsor Signature */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Sponsor Signature (Optional)</span>
                {sponsorSignatureBase64 && <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Selected</span>}
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => convertToBase64(e.target.files[0], setSponsorSignatureBase64)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 group-hover:border-indigo-400 group-hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">
                    Click to upload signature
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Details'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSponsorModal;
