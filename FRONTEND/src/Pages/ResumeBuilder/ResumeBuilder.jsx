import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Download, ArrowLeft, LayoutTemplate, ZoomIn, ZoomOut, Maximize, Send, X } from 'lucide-react';
import ResumeForm from './ResumeForm';
import ResumePreview from './ResumePreview';
import { useReactToPrint } from 'react-to-print';
import { useDebounce } from 'react-use';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer';

const ResumeBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const [resume, setResume] = useState(null);
  const [scale, setScale] = useState(window.innerWidth < 768 ? 0.4 : 0.8);
  const previewRef = useRef(null);
  const downloadRef = useRef(null);

  const [showWhatsappPopup, setShowWhatsappPopup] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappSending, setWhatsappSending] = useState(false);
  
  const [verifiedPhone, setVerifiedPhone] = useState(null);

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/resume/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setResume(res.data.resume);
        if (res.data.verifiedPhone) {
          setVerifiedPhone(res.data.verifiedPhone);
          setWhatsappNumber(res.data.verifiedPhone);
        }
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
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
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

  const triggerPrint = useReactToPrint({
    contentRef: downloadRef,
    documentTitle: resume?.name || 'Resume',
    onAfterPrint: () => setDownloading(false),
    onPrintError: () => setDownloading(false)
  });

  const handleExport = async () => {
    if (downloading) return;

    if ((resume?.downloadsUsed || 0) >= 3) {
      const confirmed = window.confirm("You have used your 3 free downloads for this resume.\n\nExporting again will cost 2 tokens. Do you wish to continue?");
      if (!confirmed) return;
    }

    setDownloading(true);
    try {
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/resume/${id}/download`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.data.success) throw new Error(res.data.message);

      setResume(prev => ({ ...prev, downloadsUsed: res.data.downloadsUsed }));

      if (res.data.freeDownload) {
        toast.success(`Exporting PDF... (${res.data.downloadsUsed}/3 Free used)`);
      } else {
        toast.success(`Exporting PDF... (2 Tokens deducted)`);
      }

      // Directly trigger print - contentRef works with v3
      triggerPrint();

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Export failed';
      if (err.response?.status === 403 && errorMsg.toLowerCase().includes('tokens')) {
        toast.error(`${errorMsg} Please purchase more tokens.`, { duration: 5000 });
      } else {
        toast.error(errorMsg);
      }
      setDownloading(false);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappNumber || whatsappNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit number');
      return;
    }

    if ((resume?.whatsappDownloadsUsed || 0) >= 3) {
      const confirmed = window.confirm("You have used your 3 free WhatsApp sends for this resume.\n\nSending again will cost 2 tokens. Do you wish to continue?");
      if (!confirmed) return;
    }

    setWhatsappSending(true);
    try {
      toast.success("Generating PDF...", { id: "generating" });
      
      // Temporarily set scale to 1 for perfect resolution
      const originalScale = scale;
      setScale(1);
      
      // Wait for re-render
      await new Promise(r => setTimeout(r, 100));

      const element = downloadRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false
      });
      
      setScale(originalScale);

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // Convert to base64 data URI
      const pdfBase64 = pdf.output('datauristring');
      
      toast.loading("Sending to WhatsApp...", { id: "generating" });

      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/resume/${id}/send-whatsapp`, {
        phone: whatsappNumber,
        pdfBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.data.success) throw new Error(res.data.message);

      setResume(prev => ({ ...prev, whatsappDownloadsUsed: res.data.whatsappDownloadsUsed }));

      if (res.data.freeSend) {
        toast.success(`Sent to WhatsApp! (${res.data.whatsappDownloadsUsed}/3 Free used)`, { id: "generating" });
      } else {
        toast.success(`Sent to WhatsApp! (2 Tokens deducted)`, { id: "generating" });
      }

      setShowWhatsappPopup(false);

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send';
      if (err.response?.status === 403 && errorMsg.toLowerCase().includes('tokens')) {
        toast.error(`${errorMsg} Please purchase more tokens.`, { id: "generating", duration: 5000 });
      } else {
        toast.error(errorMsg, { id: "generating" });
      }
    } finally {
      setWhatsappSending(false);
    }
  };

  if (loading || !resume) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans pt-16">
      <Navbar />
      
      {/* Builder Container */}
      <div className="flex flex-col h-auto md:h-[85vh] min-h-[600px] max-w-[1920px] w-[95%] mx-auto shadow-2xl bg-white overflow-visible md:overflow-hidden rounded-2xl border border-slate-200 mt-6 mb-12">
        
        {/* Top Toolbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-3 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => navigate('/my-resumes')} 
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          <input 
            type="text" 
            value={resume.name}
            onChange={(e) => setResume({...resume, name: e.target.value})}
            className="text-base sm:text-xl font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-100 rounded px-1 sm:px-2 py-1 w-28 sm:w-48 md:w-64"
          />
          {saving && <span className="hidden sm:flex text-xs text-slate-400 items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
          {!saving && <span className="hidden sm:flex text-xs text-slate-400 items-center gap-1">Saved</span>}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => {
                if (verifiedPhone) {
                  setShowWhatsappPopup(true);
                } else {
                  toast.error("Please verify your phone number through master profile");
                }
              }}
              disabled={downloading || saving || whatsappSending}
              className="hidden md:flex bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-70 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-base font-bold items-center gap-1 sm:gap-2 transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 shrink-0"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>WhatsApp</span>
            </button>
            <button 
              onClick={handleExport}
              disabled={downloading}
              className="hidden md:flex bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-base font-bold items-center gap-1 sm:gap-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 shrink-0"
            >
              {downloading ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span>Export PDF</span>
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-col md:flex-row flex-1 overflow-visible md:overflow-hidden">
        {/* Left Side: Editor */}
        <div className="w-full md:w-1/2 flex-none md:flex-auto overflow-visible md:overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 bg-white p-3 sm:p-6 shadow-xl z-20">
          <ResumeForm resume={resume} setResume={setResume} />
        </div>

        {/* Right Side: Live Preview */}
        <div className="w-full md:w-1/2 flex-none md:flex-auto overflow-visible md:overflow-y-auto bg-slate-500 p-3 sm:p-8 flex flex-col items-center justify-start relative">
          
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
          
          {/* Mobile Action Buttons */}
          <div className="w-full md:hidden mt-8 mb-4 flex flex-col gap-3">
            <button 
              onClick={() => {
                if (verifiedPhone) {
                  setShowWhatsappPopup(true);
                } else {
                  toast.error("Please verify your phone number through master profile");
                }
              }}
              disabled={downloading || saving || whatsappSending}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-70 text-white px-6 py-4 rounded-xl text-lg font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-green-500/30 active:scale-95"
            >
              <Send className="w-6 h-6" />
              Send to WhatsApp
            </button>
            <button 
              onClick={handleExport}
              disabled={downloading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 text-white px-6 py-4 rounded-xl text-lg font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
            >
              {downloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              Export PDF
            </button>
          </div>

          </div>
        </div>
      </div>

      <Footer />

      {/* Hidden print container - positioned off-screen so react-to-print can access the DOM */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '210mm',
          pointerEvents: 'none',
          zIndex: -9999
        }}
      >
        <div ref={downloadRef} style={{ width: '210mm', minHeight: '297mm', background: 'white' }}>
          <ResumePreview data={resume.data} template={resume.template} isWebPreview={false} />
        </div>
      </div>
      {showWhatsappPopup && verifiedPhone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm relative mx-4">
            <button 
              onClick={() => setShowWhatsappPopup(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Send className="text-green-500" /> Send to WhatsApp
            </h3>
            
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to send your resume to your verified number <strong>+91 {verifiedPhone}</strong>?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWhatsappPopup(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWhatsapp}
                disabled={whatsappSending}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/30 flex justify-center items-center gap-2"
              >
                {whatsappSending ? <><Loader2 className="w-5 h-5 animate-spin" /></> : 'Yes, Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
