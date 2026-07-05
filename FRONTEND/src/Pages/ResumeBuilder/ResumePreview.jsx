import React, { useEffect, useRef, useState } from 'react';

const ResumePreview = ({ data, template, isWebPreview = false }) => {
  if (!data) return null;

  const { personalInfo, experience, projects, education, skills, achievements, certifications } = data;
  const containerRef = useRef(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const items = container.querySelectorAll('.break-inside-avoid');
    
    // Reset padding and margins on re-render
    items.forEach(item => {
      item.style.paddingTop = '0px';
      item.style.marginTop = '0px';
    });
    
    const PAGE_HEIGHT = 1123; // A4 physical height
    const GAP = 0; // Visual gap between pages is handled by background page CSS border
    const TOP_PADDING = 25; // Padding from top on Page 2 and onwards
    const BOTTOM_PADDING = 50; // Reserved space at bottom of each page for watermark
    
    let currentPage = 1;
    let currentLimit = PAGE_HEIGHT - BOTTOM_PADDING;
    
    // Allow DOM to settle before calculating heights
    setTimeout(() => {
      items.forEach(item => {
        // Calculate true unscaled offset relative to container
        let currentItem = item;
        let itemTop = 0;
        while (currentItem && currentItem !== container) {
          itemTop += currentItem.offsetTop;
          currentItem = currentItem.offsetParent;
        }
        
        const itemHeight = item.offsetHeight;
        
        if (itemTop + itemHeight > currentLimit) {
          const pageBoundary = currentPage * PAGE_HEIGHT;
          const spaceToFill = pageBoundary - itemTop;
          
          if (spaceToFill > 0) {
            item.style.marginTop = `${spaceToFill}px`;
          }
          item.style.paddingTop = `${TOP_PADDING}px`;
          
          currentPage++;
          currentLimit = (currentPage - 1) * PAGE_HEIGHT + PAGE_HEIGHT - BOTTOM_PADDING;
        }
      });
      
      // Temporarily remove forced height to measure true content size
      const originalHeight = container.style.height;
      container.style.height = 'auto';
      const totalH = container.offsetHeight;
      container.style.height = originalHeight;
      
      const pages = Math.ceil(totalH / (PAGE_HEIGHT + GAP));
      setTotalPages(Math.max(1, pages));
    }, 100);
  }, [data, template, isWebPreview]);

  const defaultSectionOrder = ['skills', 'experience', 'projects', 'education', 'achievements', 'certifications'];
  const sectionOrder = data?.sectionOrder?.length > 0 ? data.sectionOrder : defaultSectionOrder;

  const renderBulletPoints = (text) => {
    if (!text) return null;
    return text.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
      <li key={idx} className="ml-4 list-disc pl-1 text-[12px] leading-[1.4] text-gray-800">
        {line}
      </li>
    ));
  };

  const renderTextWithNewlines = (text, className) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => (
      <span key={idx} className={className}>
        {line}
        <br />
      </span>
    ));
  };

  const renderSectionContent = (key) => {
    switch (key) {
      case 'experience':
        if (!experience || experience.length === 0) return null;
        return (
          <div className="mb-3" key={key}>
            <div className="space-y-2">
              {experience.map((exp, index) => {
                const content = (
                  <>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-[14px] font-bold text-gray-900">{exp.position}</h3>
                      <span className="text-[12px] text-gray-600 font-medium">
                        {exp.startDate} {exp.endDate && `- ${exp.endDate}`}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-[12px] font-semibold text-gray-700 italic">{exp.company}</span>
                    </div>
                    <ul className="mt-0.5">
                      {renderBulletPoints(exp.description)}
                    </ul>
                  </>
                );

                if (index === 0) {
                  return (
                    <div key={exp.id} className="break-inside-avoid">
                      <h2 className="text-[15px] font-bold uppercase border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900 tracking-wider">
                        Experience
                      </h2>
                      {content}
                    </div>
                  );
                }
                
                return (
                  <div key={exp.id} className="break-inside-avoid">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'projects':
        if (!projects || projects.length === 0) return null;
        return (
          <div className="mb-3" key={key}>
            <div className="space-y-1.5">
              {projects.map((proj, index) => {
                const content = (
                  <>
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-[14px] font-bold text-gray-900">{proj.title}</h3>
                        <div className="flex gap-2">
                          {(proj.liveLink || proj.link) && (
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-gray-700">Live:</span>
                              <a href={proj.liveLink || proj.link} className="text-[11px] text-blue-800 hover:underline">{(proj.liveLink || proj.link).replace(/^https?:\/\/(www\.)?/, '')}</a>
                            </div>
                          )}
                          {proj.githubLink && (
                            <>
                              <span className="text-gray-300 text-[11px]">|</span>
                              <a href={proj.githubLink} className="text-[11px] text-blue-800 hover:underline">GitHub</a>
                            </>
                          )}
                        </div>
                      </div>
                      {(proj.startDate || proj.endDate) && (
                        <span className="text-[12px] text-gray-600 font-medium">
                          {proj.startDate} {proj.endDate && `- ${proj.endDate}`}
                        </span>
                      )}
                    </div>
                    {proj.technologies && (
                      <div className="mb-1 text-[12px]">
                        <span className="font-semibold text-gray-700">Technologies:</span> <span className="text-gray-600">{proj.technologies}</span>
                      </div>
                    )}
                    <ul className="mt-1">
                      {renderBulletPoints(proj.description)}
                    </ul>
                  </>
                );

                if (index === 0) {
                  return (
                    <div key={proj.id} className="break-inside-avoid">
                      <h2 className="text-[15px] font-bold uppercase border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900 tracking-wider">
                        Projects
                      </h2>
                      {content}
                    </div>
                  );
                }
                
                return (
                  <div key={proj.id} className="break-inside-avoid">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'education':
        if (!education || education.length === 0) return null;
        return (
          <div className="mb-3 break-inside-avoid" key={key}>
            <h2 className="text-[15px] font-bold uppercase border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900 tracking-wider">
              Education
            </h2>
            <div className="space-y-1.5">
              {education.map(edu => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-[14px] font-bold text-gray-900">
                      {edu.institution} {edu.location && <span className="text-gray-500 font-normal ml-1">({edu.location})</span>}
                    </h3>
                    <span className="text-[12px] text-gray-600 font-medium">
                      {edu.startDate} {edu.endDate && `- ${edu.endDate}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[12px] text-gray-800 italic">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                    {edu.score && <span className="text-[12px] text-gray-600 font-medium">Score: {edu.score}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        if (!skills || (!skills.languages?.length && !skills.frameworks?.length && !skills.tools?.length)) return null;
        return (
          <div className="mb-3 break-inside-avoid" key={key}>
            <h2 className="text-[15px] font-bold uppercase border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900 tracking-wider">
              Technical Skills
            </h2>
            <div className="text-[12px] leading-[1.6] space-y-1">
              {skills.languages?.length > 0 && (
                <div>
                  <span className="font-bold text-gray-800">Languages: </span>
                  <span className="text-gray-700">{skills.languages.join(', ')}</span>
                </div>
              )}
              {skills.frameworks?.length > 0 && (
                <div>
                  <span className="font-bold text-gray-800">Frameworks/Libraries: </span>
                  <span className="text-gray-700">{skills.frameworks.join(', ')}</span>
                </div>
              )}
              {skills.tools?.length > 0 && (
                <div>
                  <span className="font-bold text-gray-800">Developer Tools: </span>
                  <span className="text-gray-700">{skills.tools.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'achievements':
        if (!achievements || achievements.length === 0) return null;
        return (
          <div className="mb-3 break-inside-avoid" key={key}>
            <h2 className="text-[15px] font-bold uppercase border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900 tracking-wider">
              Achievements
            </h2>
            <div className="space-y-1.5">
              {achievements.map(ach => (
                <div key={ach.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-[14px] font-bold text-gray-900">{ach.title}</h3>
                    <span className="text-[12px] text-gray-600 font-medium">{ach.date}</span>
                  </div>
                  <div className="text-[12px] text-gray-800 leading-[1.5] mt-1">
                    {renderTextWithNewlines(ach.description, "")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'certifications':
        if (!certifications || certifications.length === 0) return null;
        return (
          <div className="mb-3 break-inside-avoid" key={key}>
            <h2 className="text-[15px] font-bold uppercase border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900 tracking-wider">
              Certifications
            </h2>
            <div className="space-y-1.5">
              {certifications.map(cert => (
                <div key={cert.id} className="flex justify-between items-baseline mb-1">
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900 inline">{cert.name}</h3>
                    {cert.issuer && <span className="text-[12px] text-gray-700 italic ml-2">by {cert.issuer}</span>}
                    {cert.link && (
                      <>
                        <span className="text-gray-300 text-[11px] mx-2">|</span>
                        <a href={cert.link} className="text-[11px] text-blue-800 hover:underline">View Credential</a>
                      </>
                    )}
                  </div>
                  <span className="text-[12px] text-gray-600 font-medium whitespace-nowrap ml-4">{cert.date}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const previewStyle = isWebPreview ? {
    fontFamily: "'Inter', sans-serif",
    height: `${totalPages * 1123}px`,
    position: 'relative'
  } : {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: 'white',
    position: 'relative'
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full text-black pt-[5mm] pb-[8mm] px-[8mm] box-border`} 
      style={previewStyle}
    >
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .break-inside-avoid { break-inside: auto !important; page-break-inside: auto !important; }
        }
      `}</style>

      {/* Background physical pages for Web Preview */}
      {isWebPreview && (
        <div className="absolute top-0 left-0 w-full z-[-1] pointer-events-none flex flex-col print:hidden" style={{ gap: '0px' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={i} className="w-full h-[1123px] bg-white shadow-2xl shrink-0 box-border border-b-[20px] border-transparent bg-clip-padding" />
          ))}
        </div>
      )}
      
      {/* Watermarks for Web Preview */}
      {isWebPreview && Array.from({ length: totalPages }).map((_, i) => (
        <div 
          key={i} 
          className="absolute w-full text-center text-slate-300/80 font-bold text-sm pointer-events-none uppercase tracking-[0.2em]"
          style={{ top: `${(i * 1123) + 1123 - 40}px`, left: 0 }}
        >
          Page {i + 1}
        </div>
      ))}
      
      <div className="text-center mb-2">
        <h1 className="text-[32px] font-bold uppercase tracking-wide text-gray-900 mb-0">
          {personalInfo?.firstName} {personalInfo?.lastName}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-gray-700 mt-1">
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && (
            <>
              <span className="text-gray-300">|</span>
              <span>{personalInfo.phone}</span>
            </>
          )}
          {personalInfo?.location && (
            <>
              <span className="text-gray-300">|</span>
              <span>{personalInfo.location}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-gray-700 mt-0.5">
          {personalInfo?.linkedin && (
            <a href={personalInfo.linkedin} className="text-blue-800 hover:underline">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a>
          )}
          {personalInfo?.github && (
            <>
              <span className="text-gray-300">|</span>
              <a href={personalInfo.github} className="text-blue-800 hover:underline">{personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</a>
            </>
          )}
          {personalInfo?.portfolio && (
            <>
              <span className="text-gray-300">|</span>
              <a href={personalInfo.portfolio} className="text-blue-800 hover:underline">{personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</a>
            </>
          )}
        </div>
      </div>

      {/* Summary (Always Second if exists) */}
      {personalInfo?.summary && (
        <div className="mb-3 break-inside-avoid">
          <h2 className="text-[15px] font-bold uppercase border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900 tracking-wider">
            Professional Summary
          </h2>
          <div className="text-[12px] leading-[1.6] text-gray-800">
            {renderTextWithNewlines(personalInfo.summary, "")}
          </div>
        </div>
      )}

      {/* Dynamic Sections Based on Order */}
      {sectionOrder.map(key => renderSectionContent(key))}

      {/* Watermark */}
      <div className="absolute bottom-6 left-0 w-full text-center text-[11px] text-slate-400 opacity-40 font-medium pointer-events-none select-none print:fixed print:bottom-6">
        Powered by <span className="font-bold tracking-wide">Code-A-Nova</span>
      </div>
    </div>
  );
};

export default ResumePreview;
