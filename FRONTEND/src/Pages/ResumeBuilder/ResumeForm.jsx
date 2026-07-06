import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, ChevronDown, ChevronUp, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ResumeForm = ({ resume, setResume }) => {
  const [openSection, setOpenSection] = React.useState('personalInfo');
  const data = resume?.data || {};

  const defaultSectionOrder = ['skills', 'experience', 'projects', 'education', 'achievements', 'certifications'];
  const sectionOrder = data?.sectionOrder?.length > 0 ? data.sectionOrder : defaultSectionOrder;

  // Ensure missing sections are populated with empty arrays/objects
  useEffect(() => {
    let needsUpdate = false;
    const newData = { ...data };
    if (!newData.sectionOrder || newData.sectionOrder.length === 0) {
      newData.sectionOrder = defaultSectionOrder;
      needsUpdate = true;
    }
    if (!newData.achievements) { newData.achievements = []; needsUpdate = true; }
    if (!newData.certifications) { newData.certifications = []; needsUpdate = true; }
    
    // Auto-migrate legacy skills object to array
    if (newData.skills && !Array.isArray(newData.skills)) {
      const oldSkills = newData.skills;
      const newSkillsArray = [];
      if (oldSkills.languages && oldSkills.languages.length > 0) {
        newSkillsArray.push({ id: Date.now().toString() + '1', category: 'Languages', items: oldSkills.languages.join(', ') });
      }
      if (oldSkills.frameworks && oldSkills.frameworks.length > 0) {
        newSkillsArray.push({ id: Date.now().toString() + '2', category: 'Frameworks/Libraries', items: oldSkills.frameworks.join(', ') });
      }
      if (oldSkills.tools && oldSkills.tools.length > 0) {
        newSkillsArray.push({ id: Date.now().toString() + '3', category: 'Developer Tools', items: oldSkills.tools.join(', ') });
      }
      if (newSkillsArray.length === 0) {
        newSkillsArray.push({ id: Date.now().toString() + '4', category: 'Languages', items: '' });
      }
      newData.skills = newSkillsArray;
      needsUpdate = true;
    } else if (!newData.skills) {
      newData.skills = [{ id: Date.now().toString(), category: 'Languages', items: '' }];
      needsUpdate = true;
    }

    if (needsUpdate) {
      setResume(prev => ({ ...prev, data: newData }));
    }
  }, []);

  const [masterData, setMasterData] = useState(null);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.user?.resumeData) {
          setMasterData(res.data.user.resumeData);
        }
      } catch (err) {
        console.error('Failed to load master profile', err);
      }
    };
    fetchMaster();
  }, []);

  const handleImport = (section) => {
    if (!masterData) {
      toast.error('Master Profile data not available');
      return;
    }
    const sectionData = masterData[section];
    
    if (section === 'skills') {
      if (!sectionData) {
        toast.error('No skills found in Master Profile');
        return;
      }
      setResume(prev => ({
        ...prev,
        data: { ...prev.data, [section]: sectionData }
      }));
      toast.success(`Imported skills from Master Profile`);
      return;
    }

    if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) {
      toast.error('No data found in Master Profile for this section');
      return;
    }

    const imported = sectionData.map(item => ({
      ...item, 
      id: Date.now().toString() + Math.random().toString(36).substring(7)
    }));
    
    setResume(prev => ({
      ...prev,
      data: { ...prev.data, [section]: imported }
    }));
    
    toast.success(`Imported ${imported.length} items from Master Profile`);
  };

  const updateData = (field, value) => {
    setResume({
      ...resume,
      data: {
        ...data,
        [field]: value
      }
    });
  };

  const updateNested = (section, index, field, value) => {
    const newSection = [...(data[section] || [])];
    newSection[index] = { ...newSection[index], [field]: value };
    updateData(section, newSection);
  };

  const addItem = (section, defaultItem) => {
    updateData(section, [...(data[section] || []), { ...defaultItem, id: Date.now().toString() }]);
  };

  const removeItem = (section, index) => {
    const newSection = [...(data[section] || [])];
    newSection.splice(index, 1);
    updateData(section, newSection);
  };

  const moveItem = (section, index, direction) => {
    const newSection = [...(data[section] || [])];
    if (direction === 'up' && index > 0) {
      const temp = newSection[index - 1];
      newSection[index - 1] = newSection[index];
      newSection[index] = temp;
    } else if (direction === 'down' && index < newSection.length - 1) {
      const temp = newSection[index + 1];
      newSection[index + 1] = newSection[index];
      newSection[index] = temp;
    }
    updateData(section, newSection);
  };

  const moveSection = (index, direction) => {
    const newOrder = [...sectionOrder];
    if (direction === 'up' && index > 0) {
      const temp = newOrder[index - 1];
      newOrder[index - 1] = newOrder[index];
      newOrder[index] = temp;
    } else if (direction === 'down' && index < newOrder.length - 1) {
      const temp = newOrder[index + 1];
      newOrder[index + 1] = newOrder[index];
      newOrder[index] = temp;
    }
    updateData('sectionOrder', newOrder);
  };

  // updateSkills removed, using updateNested instead

  const renderSectionHeader = (title, key, index) => {
    const isOpen = openSection === key;
    return (
    <div className="flex justify-between items-center mb-0 pb-2 cursor-pointer group" onClick={() => setOpenSection(isOpen ? null : key)}>
      <div className="flex items-center gap-2">
        <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="text-slate-400 hover:text-blue-600 disabled:opacity-0 hover:bg-blue-50 rounded"><ChevronUp size={16}/></button>
          <button onClick={() => moveSection(index, 'down')} disabled={index === sectionOrder.length - 1} className="text-slate-400 hover:text-blue-600 disabled:opacity-0 hover:bg-blue-50 rounded"><ChevronDown size={16}/></button>
        </div>
        <h2 className="text-lg font-black text-slate-800 capitalize -ml-1">{title}</h2>
      </div>
      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
        <button onClick={() => handleImport(key)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg flex items-center gap-1 text-sm font-bold border border-indigo-100">
          <Download size={14}/> Import
        </button>
        <button onClick={() => {
          let defaultItem = {};
          if (key === 'skills') defaultItem = { category: '', items: '' };
          else if (key === 'experience') defaultItem = { company: '', position: '', startDate: '', endDate: '', description: '' };
          else if (key === 'projects') defaultItem = { title: '', liveLink: '', githubLink: '', startDate: '', endDate: '', technologies: '', description: '' };
          else if (key === 'education') defaultItem = { institution: '', degree: '', fieldOfStudy: '', location: '', startDate: '', endDate: '', score: '' };
          else if (key === 'achievements') defaultItem = { title: '', date: '', description: '' };
          else if (key === 'certifications') defaultItem = { name: '', issuer: '', date: '', link: '' };
          addItem(key, defaultItem);
          setOpenSection(key);
        }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg flex items-center gap-1 text-sm font-bold">
          <Plus size={16}/> Add
        </button>
        <button className="text-slate-500" onClick={() => setOpenSection(isOpen ? null : key)}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
    </div>
  )};

  const renderSection = (key, index) => {
    switch (key) {
      case 'experience':
        return (
          <section key={key} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            {renderSectionHeader('Experience', key, index)}
            {openSection === key && (
            <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
              {(data.experience || []).map((exp, idx) => (
                <div key={exp.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveItem('experience', idx, 'up')} className="p-1 hover:bg-white rounded"><ArrowUp size={14} /></button>
                    <button onClick={() => moveItem('experience', idx, 'down')} className="p-1 hover:bg-white rounded"><ArrowDown size={14} /></button>
                    <button onClick={() => removeItem('experience', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 pr-20">
                    <input className="input-field" placeholder="Company" value={exp.company || ''} onChange={(e) => updateNested('experience', idx, 'company', e.target.value)} />
                    <input className="input-field" placeholder="Position" value={exp.position || ''} onChange={(e) => updateNested('experience', idx, 'position', e.target.value)} />
                    <input className="input-field" placeholder="Start Date" value={exp.startDate || ''} onChange={(e) => updateNested('experience', idx, 'startDate', e.target.value)} />
                    <input className="input-field" placeholder="End Date" value={exp.endDate || ''} onChange={(e) => updateNested('experience', idx, 'endDate', e.target.value)} />
                  </div>
                  <textarea className="input-field w-full h-24" placeholder="Description (Bullet points separated by newline)" value={exp.description || ''} onChange={(e) => updateNested('experience', idx, 'description', e.target.value)} />
                </div>
              ))}
            </div>
            )}
          </section>
        );
      case 'projects':
        return (
          <section key={key} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            {renderSectionHeader('Projects', key, index)}
            {openSection === key && (
            <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
              {(data.projects || []).map((proj, idx) => (
                <div key={proj.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveItem('projects', idx, 'up')} className="p-1 hover:bg-white rounded"><ArrowUp size={14} /></button>
                    <button onClick={() => moveItem('projects', idx, 'down')} className="p-1 hover:bg-white rounded"><ArrowDown size={14} /></button>
                    <button onClick={() => removeItem('projects', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 pr-20">
                    <input className="input-field col-span-2" placeholder="Project Title" value={proj.title || ''} onChange={(e) => updateNested('projects', idx, 'title', e.target.value)} />
                    <input className="input-field" placeholder="Start Date" value={proj.startDate || ''} onChange={(e) => updateNested('projects', idx, 'startDate', e.target.value)} />
                    <input className="input-field" placeholder="End Date" value={proj.endDate || ''} onChange={(e) => updateNested('projects', idx, 'endDate', e.target.value)} />
                    <input className="input-field" placeholder="Live Link" value={proj.liveLink || proj.link || ''} onChange={(e) => updateNested('projects', idx, 'liveLink', e.target.value)} />
                    <input className="input-field" placeholder="GitHub Link" value={proj.githubLink || ''} onChange={(e) => updateNested('projects', idx, 'githubLink', e.target.value)} />
                    <input className="input-field col-span-2" placeholder="Technologies Used" value={proj.technologies || ''} onChange={(e) => updateNested('projects', idx, 'technologies', e.target.value)} />
                  </div>
                  <textarea className="input-field w-full h-20" placeholder="Description (Bullet points separated by newline)" value={proj.description || ''} onChange={(e) => updateNested('projects', idx, 'description', e.target.value)} />
                </div>
              ))}
            </div>
            )}
          </section>
        );
      case 'education':
        return (
          <section key={key} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            {renderSectionHeader('Education', key, index)}
            {openSection === key && (
            <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
              {(data.education || []).map((edu, idx) => (
                <div key={edu.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => removeItem('education', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pr-10">
                    <input className="input-field col-span-2" placeholder="Institution" value={edu.institution || ''} onChange={(e) => updateNested('education', idx, 'institution', e.target.value)} />
                    <input className="input-field" placeholder="Location" value={edu.location || ''} onChange={(e) => updateNested('education', idx, 'location', e.target.value)} />
                    <input className="input-field" placeholder="Degree" value={edu.degree || ''} onChange={(e) => updateNested('education', idx, 'degree', e.target.value)} />
                    <input className="input-field" placeholder="Field of Study" value={edu.fieldOfStudy || ''} onChange={(e) => updateNested('education', idx, 'fieldOfStudy', e.target.value)} />
                    <input className="input-field" placeholder="Score (GPA/%)" value={edu.score || ''} onChange={(e) => updateNested('education', idx, 'score', e.target.value)} />
                    <input className="input-field" placeholder="Start Date" value={edu.startDate || ''} onChange={(e) => updateNested('education', idx, 'startDate', e.target.value)} />
                    <input className="input-field" placeholder="End Date" value={edu.endDate || ''} onChange={(e) => updateNested('education', idx, 'endDate', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        );
      case 'achievements':
        return (
          <section key={key} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            {renderSectionHeader('Achievements', key, index)}
            {openSection === key && (
            <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
              {(data.achievements || []).map((ach, idx) => (
                <div key={ach.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveItem('achievements', idx, 'up')} className="p-1 hover:bg-white rounded"><ArrowUp size={14} /></button>
                    <button onClick={() => moveItem('achievements', idx, 'down')} className="p-1 hover:bg-white rounded"><ArrowDown size={14} /></button>
                    <button onClick={() => removeItem('achievements', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 pr-20">
                    <input className="input-field" placeholder="Title" value={ach.title || ''} onChange={(e) => updateNested('achievements', idx, 'title', e.target.value)} />
                    <input className="input-field" placeholder="Date" value={ach.date || ''} onChange={(e) => updateNested('achievements', idx, 'date', e.target.value)} />
                  </div>
                  <textarea className="input-field w-full h-16" placeholder="Description" value={ach.description || ''} onChange={(e) => updateNested('achievements', idx, 'description', e.target.value)} />
                </div>
              ))}
            </div>
            )}
          </section>
        );
      case 'certifications':
        return (
          <section key={key} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            {renderSectionHeader('Certifications', key, index)}
            {openSection === key && (
            <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
              {(data.certifications || []).map((cert, idx) => (
                <div key={cert.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveItem('certifications', idx, 'up')} className="p-1 hover:bg-white rounded"><ArrowUp size={14} /></button>
                    <button onClick={() => moveItem('certifications', idx, 'down')} className="p-1 hover:bg-white rounded"><ArrowDown size={14} /></button>
                    <button onClick={() => removeItem('certifications', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pr-20">
                    <input className="input-field" placeholder="Certification Name" value={cert.name || ''} onChange={(e) => updateNested('certifications', idx, 'name', e.target.value)} />
                    <input className="input-field" placeholder="Issuer" value={cert.issuer || ''} onChange={(e) => updateNested('certifications', idx, 'issuer', e.target.value)} />
                    <input className="input-field" placeholder="Date" value={cert.date || ''} onChange={(e) => updateNested('certifications', idx, 'date', e.target.value)} />
                    <input className="input-field" placeholder="Link" value={cert.link || ''} onChange={(e) => updateNested('certifications', idx, 'link', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        );
      case 'skills':
        return (
          <section key={key} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            {renderSectionHeader('Skills', key, index)}
            {openSection === key && (
            <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
              {(data.skills || []).map((skill, idx) => (
                <div key={skill.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveItem('skills', idx, 'up')} className="p-1 hover:bg-white rounded"><ArrowUp size={14} /></button>
                    <button onClick={() => moveItem('skills', idx, 'down')} className="p-1 hover:bg-white rounded"><ArrowDown size={14} /></button>
                    <button onClick={() => removeItem('skills', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-20">
                    <div className="md:col-span-1">
                      <input className="input-field" placeholder="Heading (e.g. Backend)" value={skill.category || ''} onChange={(e) => updateNested('skills', idx, 'category', e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <input className="input-field w-full" placeholder="Skills (e.g. Node.js, Express)" value={skill.items || ''} onChange={(e) => updateNested('skills', idx, 'items', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <section className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-0 pb-2 cursor-pointer" onClick={() => setOpenSection(openSection === 'personalInfo' ? null : 'personalInfo')}>
          <h2 className="text-lg font-black text-slate-800">Personal Information</h2>
          <button className="text-slate-500">
            {openSection === 'personalInfo' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {openSection === 'personalInfo' && (
        <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="First Name" value={data.personalInfo?.firstName || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, firstName: e.target.value })} />
            <input className="input-field" placeholder="Last Name" value={data.personalInfo?.lastName || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, lastName: e.target.value })} />
            <input className="input-field" placeholder="Email" value={data.personalInfo?.email || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, email: e.target.value })} />
            <input className="input-field" placeholder="Phone Number" value={data.personalInfo?.phone || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, phone: e.target.value })} />
            <input className="input-field" placeholder="Location" value={data.personalInfo?.location || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, location: e.target.value })} />
            <input className="input-field" placeholder="LinkedIn URL" value={data.personalInfo?.linkedin || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, linkedin: e.target.value })} />
            <input className="input-field" placeholder="GitHub URL" value={data.personalInfo?.github || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, github: e.target.value })} />
            <input className="input-field" placeholder="Portfolio/Website URL" value={data.personalInfo?.portfolio || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, portfolio: e.target.value })} />
          </div>
          <textarea className="input-field w-full h-24" placeholder="Professional Summary" value={data.personalInfo?.summary || ''} onChange={(e) => updateData('personalInfo', { ...data.personalInfo, summary: e.target.value })} />
        </div>
        )}
      </section>

      {sectionOrder.map((key, index) => renderSection(key, index))}

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 0.875rem;
          color: #1e293b;
          transition: all 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
      `}</style>
    </div>
  );
};

export default ResumeForm;
