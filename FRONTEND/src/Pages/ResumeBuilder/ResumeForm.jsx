import React, { useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

const ResumeForm = ({ resume, setResume }) => {
  const data = resume?.data || {};

  const defaultSectionOrder = ['experience', 'projects', 'education', 'skills', 'achievements', 'certifications'];
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
    
    if (needsUpdate) {
      setResume(prev => ({ ...prev, data: newData }));
    }
  }, []);

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

  const updateSkills = (category, val) => {
    updateData('skills', {
      ...(data.skills || {}),
      [category]: val.split(',').map(s => s.trim())
    });
  };

  const renderSectionHeader = (title, key, index) => (
    <div className="flex justify-between items-center mb-4 border-b pb-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-col bg-slate-100 rounded-md">
          <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ArrowUp size={12}/></button>
          <button onClick={() => moveSection(index, 'down')} disabled={index === sectionOrder.length - 1} className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ArrowDown size={12}/></button>
        </div>
        <h2 className="text-lg font-black text-slate-800 capitalize">{title}</h2>
      </div>
      {key !== 'skills' && (
        <button onClick={() => {
          let defaultItem = {};
          if (key === 'experience') defaultItem = { company: '', position: '', startDate: '', endDate: '', description: '' };
          else if (key === 'projects') defaultItem = { title: '', liveLink: '', githubLink: '', startDate: '', endDate: '', technologies: '', description: '' };
          else if (key === 'education') defaultItem = { institution: '', degree: '', fieldOfStudy: '', location: '', startDate: '', endDate: '', score: '' };
          else if (key === 'achievements') defaultItem = { title: '', date: '', description: '' };
          else if (key === 'certifications') defaultItem = { name: '', issuer: '', date: '', link: '' };
          addItem(key, defaultItem);
        }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg flex items-center gap-1 text-sm font-bold">
          <Plus size={16}/> Add
        </button>
      )}
    </div>
  );

  const renderSection = (key, index) => {
    switch (key) {
      case 'experience':
        return (
          <section key={key}>
            {renderSectionHeader('Experience', key, index)}
            <div className="space-y-4">
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
          </section>
        );
      case 'projects':
        return (
          <section key={key}>
            {renderSectionHeader('Projects', key, index)}
            <div className="space-y-4">
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
          </section>
        );
      case 'education':
        return (
          <section key={key}>
            {renderSectionHeader('Education', key, index)}
            <div className="space-y-4">
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
          </section>
        );
      case 'achievements':
        return (
          <section key={key}>
            {renderSectionHeader('Achievements', key, index)}
            <div className="space-y-4">
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
          </section>
        );
      case 'certifications':
        return (
          <section key={key}>
            {renderSectionHeader('Certifications', key, index)}
            <div className="space-y-4">
              {(data.certifications || []).map((cert, idx) => (
                <div key={cert.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveItem('certifications', idx, 'up')} className="p-1 hover:bg-white rounded"><ArrowUp size={14} /></button>
                    <button onClick={() => moveItem('certifications', idx, 'down')} className="p-1 hover:bg-white rounded"><ArrowDown size={14} /></button>
                    <button onClick={() => removeItem('certifications', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pr-10">
                    <input className="input-field" placeholder="Certificate Name" value={cert.name || ''} onChange={(e) => updateNested('certifications', idx, 'name', e.target.value)} />
                    <input className="input-field" placeholder="Issuer" value={cert.issuer || ''} onChange={(e) => updateNested('certifications', idx, 'issuer', e.target.value)} />
                    <input className="input-field" placeholder="Date" value={cert.date || ''} onChange={(e) => updateNested('certifications', idx, 'date', e.target.value)} />
                    <input className="input-field" placeholder="Link" value={cert.link || ''} onChange={(e) => updateNested('certifications', idx, 'link', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'skills':
        return (
          <section key={key}>
            {renderSectionHeader('Skills', key, index)}
            <div className="space-y-3">
              <input className="input-field w-full" placeholder="Languages (e.g. JavaScript, Python, C++)" value={(data.skills?.languages || []).join(', ')} onChange={(e) => updateSkills('languages', e.target.value)} />
              <input className="input-field w-full" placeholder="Frameworks (e.g. React, Node.js, Django)" value={(data.skills?.frameworks || []).join(', ')} onChange={(e) => updateSkills('frameworks', e.target.value)} />
              <input className="input-field w-full" placeholder="Tools (e.g. Git, Docker, AWS)" value={(data.skills?.tools || []).join(', ')} onChange={(e) => updateSkills('tools', e.target.value)} />
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Personal Info (Always First) */}
      <section>
        <h2 className="text-lg font-black text-slate-800 mb-4 border-b pb-2">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <input className="input-field" placeholder="First Name" value={data.personalInfo?.firstName || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), firstName: e.target.value})} />
          <input className="input-field" placeholder="Last Name" value={data.personalInfo?.lastName || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), lastName: e.target.value})} />
          <input className="input-field" placeholder="Email" value={data.personalInfo?.email || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), email: e.target.value})} />
          <input className="input-field" placeholder="Phone" value={data.personalInfo?.phone || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), phone: e.target.value})} />
          <input className="input-field" placeholder="Location" value={data.personalInfo?.location || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), location: e.target.value})} />
          <input className="input-field" placeholder="LinkedIn URL" value={data.personalInfo?.linkedin || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), linkedin: e.target.value})} />
          <input className="input-field" placeholder="GitHub URL" value={data.personalInfo?.github || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), github: e.target.value})} />
          <input className="input-field" placeholder="Portfolio URL" value={data.personalInfo?.portfolio || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), portfolio: e.target.value})} />
        </div>
        <textarea className="input-field mt-4 w-full h-24" placeholder="Professional Summary" value={data.personalInfo?.summary || ''} onChange={(e) => updateData('personalInfo', {...(data.personalInfo || {}), summary: e.target.value})} />
      </section>

      {/* Dynamic Reorderable Sections */}
      {sectionOrder.map((sectionKey, index) => renderSection(sectionKey, index))}

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
