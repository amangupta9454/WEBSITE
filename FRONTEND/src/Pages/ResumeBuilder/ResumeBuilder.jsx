import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Download, ArrowLeft, LayoutTemplate, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import ResumeForm from './ResumeForm';
import ResumePreview from './ResumePreview';
import { useReactToPrint } from 'react-to-print';
import { useDebounce } from 'react-use';
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer';

const ResumeBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const [resume, setResume] = useState(null);
  const [scale, setScale] = useState(0.8);
  const previewRef = useRef(null);
  const downloadRef = useRef(null);

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      const token = localStorage.getItem("studentToken");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/resume/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setResume(res.data.resume);
      }
    } catch (err) {
      toast.error('Failed to load resume');
      navigate('/my-resumes');
    } finally {
      setLoading(false);
    }
  };

  const saveResume = async (currentResume) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("studentToken");
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/resume/${id}`, {
        name: currentResume.name,
        template: currentResume.template,
        data: currentResume.data
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Debounced Auto-Save
  useDebounce(
    () => {
      if (resume && !loading) {
        saveResume(resume);
      }
    },
    2000,
    [resume]
  );

  const handlePrint = useReactToPrint({
    contentRef: downloadRef,
    documentTitle: resume?.name || 'Resume',
    onBeforePrint: async () => {
      if (resume?.downloadsUsed >= 3) {
        const confirm = window.confirm("You have used your 3 free downloads for this resume.\n\nExporting this resume again will cost 2 tokens. Do you wish to continue?");
        if (!confirm) {
          return Promise.reject(new Error("Cancelled by user"));
        }
      }

      setDownloading(true);
      try {
        const token = localStorage.getItem("studentToken");
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/resume/${id}/download`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.data.success) {
          throw new Error(res.data.message);
        }

        if (res.data.freeDownload) {
          toast.success(`Print dialog opened! (${res.data.downloadsUsed}/3 Free used)`);
        } else {
          toast.success(`Print dialog opened! (2 Tokens deducted)`);
        }

        setResume(prev => ({ ...prev, downloadsUsed: res.data.downloadsUsed }));
        return Promise.resolve();
      } catch (err) {
        if (err.message === "Cancelled by user") {
          return Promise.reject(err);
        }
        
        const errorMsg = err.response?.data?.message || err.message || 'Failed to download';
        
        if (err.response?.status === 403 && errorMsg.toLowerCase().includes('tokens')) {
          toast.error(`${errorMsg} Please purchase more tokens from your dashboard.`, { duration: 5000 });
        } else {
          toast.error(errorMsg);
        }
        
        setDownloading(false);
        return Promise.reject(err);
      }
    },
    onAfterPrint: () => setDownloading(false),
    onPrintError: () => setDownloading(false)
  });

  if (loading || !resume) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans pt-16">
      <Navbar />
      
      {/* Builder Container */}
      <div className="flex-1 flex flex-col max-w-[1920px] w-full mx-auto shadow-2xl bg-white overflow-hidden rounded-t-2xl border-t border-l border-r border-slate-200 mt-6" style={{ height: 'calc(100vh - 64px - 24px)', minHeight: '800px' }}>
        
        {/* Top Toolbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/my-resumes')} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          <input 
            type="text" 
            value={resume.name}
            onChange={(e) => setResume({...resume, name: e.target.value})}
            className="text-xl font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-100 rounded px-2 py-1 w-64"
          />
          {saving && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
          {!saving && <span className="text-xs text-slate-400 flex items-center gap-1">Saved</span>}
        </div>
        
        <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              disabled={downloading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export PDF
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Editor */}
        <div className="w-1/2 overflow-y-auto border-r border-slate-200 bg-white p-6 shadow-xl z-20">
          <ResumeForm resume={resume} setResume={setResume} />
        </div>

        {/* Right Side: Live Preview */}
        <div className="w-1/2 overflow-y-auto bg-slate-500 p-8 flex flex-col items-center justify-start relative">
          
          {/* Zoom Controls */}
          <div className="sticky top-0 z-30 mb-4 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-slate-200">
            <button onClick={() => setScale(s => Math.max(0.4, s - 0.1))} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <span className="text-sm font-bold text-slate-700 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button onClick={() => setScale(0.8)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Reset Zoom">
              <Maximize size={16} />
            </button>
          </div>

          <div 
            id="resume-preview-container"
            className="w-[794px] min-h-[1123px] relative shrink-0 transition-transform origin-top" 
            ref={previewRef}
            style={{ 
              transform: `scale(${scale})`, 
              marginBottom: `${(scale - 1) * 1123}px`
            }}
          >
            <ResumePreview data={resume.data} template={resume.template} isWebPreview={true} />
          </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Hidden container strictly for foolproof PDF generation (avoids all CSS scale/transition bugs) */}
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none -z-50" aria-hidden="true">
        <div ref={downloadRef} className="w-[210mm] min-h-[297mm] bg-white">
          <ResumePreview data={resume.data} template={resume.template} isWebPreview={false} />
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
