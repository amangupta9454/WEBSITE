import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, UploadCloud, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const ImportQuizModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quizName: '',
    sponsorName: '',
    excelFile: null,
    sponsorLogo: null,
    sponsorSignature: null
  });

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const downloadSampleExcel = () => {
    const data = [{
      "Name": "John Doe",
      "Email": "john@example.com",
      "Mobile": "1234567890",
      "Registration ID": "REG123",
      "Score": "85",
      "Total Score": "100",
      "Result": "1st",
      "Percentage": "85%",
      "Effective Score": "85",
      "Total Questions": "50",
      "Attempted Questions": "45"
    }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, "Sample_Quiz_Import.xlsx");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.excelFile || !formData.quizName) {
      toast.error('Quiz Name and Excel file are required.');
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('quizName', formData.quizName);
    if (formData.sponsorName) data.append('sponsorName', formData.sponsorName);
    data.append('excelFile', formData.excelFile);
    if (formData.sponsorLogo) data.append('sponsorLogo', formData.sponsorLogo);
    if (formData.sponsorSignature) data.append('sponsorSignature', formData.sponsorSignature);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/import-quiz-users`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      toast.success(res.data.message);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to import quiz users');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Import Quiz Users</h2>
            <p className="text-sm text-slate-500 mt-1">Upload participants and customize the certificate</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Action Bar */}
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={downloadSampleExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample Excel
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Quiz Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50"
                placeholder="e.g., Summer Coding Assessment 2026"
                value={formData.quizName}
                onChange={(e) => setFormData({...formData, quizName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Excel Data File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                required
                accept=".xlsx,.xls,.csv"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                onChange={(e) => handleFileChange(e, 'excelFile')}
              />
            </div>

            <hr className="border-slate-100 my-4" />
            <h3 className="text-sm font-bold text-slate-800">Certificate Customization (Optional)</h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Sponsor / Partner Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50"
                placeholder="e.g., Google Developer Groups"
                value={formData.sponsorName}
                onChange={(e) => setFormData({...formData, sponsorName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Sponsor Logo (Image)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  onChange={(e) => handleFileChange(e, 'sponsorLogo')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Sponsor Signature (Image)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  onChange={(e) => handleFileChange(e, 'sponsorSignature')}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {loading ? "Importing..." : "Upload & Import"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImportQuizModal;
