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
    const BOTTOM_PADDING = 20; // Reduced padding so larger fonts still fit at relaxed levels
    const targetLimit = PAGE_HEIGHT - BOTTOM_PADDING;
    
    // Extensively defined scales with granular steps to minimize empty gaps
    const layoutScales = [
      { '--section-mb': '2px', '--item-mb': '0px', '--title-size': '18px', '--h2-size': '11px', '--h3-size': '10.5px', '--text-size': '9px', '--text-sm-size': '8px', '--line-height': '1.15', '--list-pl': '10px' },
      { '--section-mb': '3px', '--item-mb': '1px', '--title-size': '19px', '--h2-size': '11.5px', '--h3-size': '11px', '--text-size': '9.5px', '--text-sm-size': '8.5px', '--line-height': '1.15', '--list-pl': '12px' },
      { '--section-mb': '4px', '--item-mb': '2px', '--title-size': '21px', '--h2-size': '12px', '--h3-size': '11.5px', '--text-size': '10px', '--text-sm-size': '9px', '--line-height': '1.2', '--list-pl': '14px' },
      { '--section-mb': '5px', '--item-mb': '3px', '--title-size': '22px', '--h2-size': '12.5px', '--h3-size': '11.8px', '--text-size': '10.3px', '--text-sm-size': '9.3px', '--line-height': '1.2', '--list-pl': '15px' },
      { '--section-mb': '6px', '--item-mb': '3px', '--title-size': '23px', '--h2-size': '13px', '--h3-size': '12px', '--text-size': '10.5px', '--text-sm-size': '9.5px', '--line-height': '1.25', '--list-pl': '16px' },
      { '--section-mb': '7px', '--item-mb': '4px', '--title-size': '24px', '--h2-size': '13.5px', '--h3-size': '12.3px', '--text-size': '10.8px', '--text-sm-size': '9.8px', '--line-height': '1.28', '--list-pl': '16px' },
      { '--section-mb': '8px', '--item-mb': '4px', '--title-size': '25px', '--h2-size': '13.8px', '--h3-size': '12.5px', '--text-size': '11px', '--text-sm-size': '10px', '--line-height': '1.3', '--list-pl': '16px' },
      { '--section-mb': '9px', '--item-mb': '5px', '--title-size': '26px', '--h2-size': '14px', '--h3-size': '12.8px', '--text-size': '11.3px', '--text-sm-size': '10.3px', '--line-height': '1.33', '--list-pl': '16px' },
      { '--section-mb': '10px', '--item-mb': '6px', '--title-size': '27px', '--h2-size': '14.5px', '--h3-size': '13.5px', '--text-size': '12px', '--text-sm-size': '11px', '--line-height': '1.35', '--list-pl': '16px' },
      { '--section-mb': '12px', '--item-mb': '7px', '--title-size': '29px', '--h2-size': '15px', '--h3-size': '14px', '--text-size': '12.5px', '--text-sm-size': '11.5px', '--line-height': '1.4', '--list-pl': '16px' },
      { '--section-mb': '14px', '--item-mb': '8px', '--title-size': '31px', '--h2-size': '16px', '--h3-size': '15px', '--text-size': '13px', '--text-sm-size': '12px', '--line-height': '1.45', '--list-pl': '16px' },
      { '--section-mb': '16px', '--item-mb': '10px', '--title-size': '34px', '--h2-size': '17px', '--h3-size': '16px', '--text-size': '14px', '--text-sm-size': '12.5px', '--line-height': '1.5', '--list-pl': '16px' },
      { '--section-mb': '20px', '--item-mb': '12px', '--title-size': '37px', '--h2-size': '18px', '--h3-size': '17px', '--text-size': '15px', '--text-sm-size': '13.5px', '--line-height': '1.6', '--list-pl': '16px' },
    ];

    // Temporarily remove forced height to measure true content size
    const originalHeight = container.style.height;
    container.style.height = 'auto';
    
    let bestLevel = 0;
    
    // Allow DOM to settle before calculating heights
    setTimeout(() => {
      // Find the best fit scale
      for (let i = layoutScales.length - 1; i >= 0; i--) {
        Object.entries(layoutScales[i]).forEach(([key, value]) => {
          container.style.setProperty(key, value);
        });
        
        const totalH = container.offsetHeight;
        if (totalH <= targetLimit) {
          bestLevel = i;
          break;
        }
      }

      // If it doesn't fit even on level 0, DO NOT jump to a larger level.
      // Leave it at level 0 to maximize content on page 1, let it paginate gracefully.
      if (container.offsetHeight > targetLimit && bestLevel === 0) {
        // Just keep it at Level 0 (Extreme Compact)
        Object.entries(layoutScales[0]).forEach(([key, value]) => {
          container.style.setProperty(key, value);
        });
      }

      let currentPage = 1;
      let currentLimit = targetLimit;
      
      items.forEach(item => {
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
          currentLimit = (currentPage - 1) * PAGE_HEIGHT + targetLimit;
        }
      });
      
      const finalTotalH = container.offsetHeight;
      container.style.height = originalHeight;
      
      const pages = Math.ceil(finalTotalH / (PAGE_HEIGHT + GAP));
      setTotalPages(Math.max(1, pages));
    }, 50);
  }, [data, template, isWebPreview]);

  const defaultSectionOrder = ['skills', 'experience', 'projects', 'education', 'achievements', 'certifications'];
  const sectionOrder = data?.sectionOrder?.length > 0 ? data.sectionOrder : defaultSectionOrder;

  const renderBulletPoints = (text) => {
    if (!text) return null;
    return text.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
      <li key={idx} className="list-disc text-gray-800" style={{ fontSize: 'var(--text-size)', lineHeight: 'var(--line-height)', marginLeft: 'var(--list-pl)', paddingLeft: '2px' }}>
        {line}
      </li>
    ));
  };

  const formatUrl = (url) => {
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
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
          <div className="break-inside-avoid" style={{ marginBottom: 'var(--section-mb)' }} key={key}>
            <h2 className="font-bold uppercase border-b border-gray-400 pb-0.5 text-gray-900 tracking-wider" style={{ fontSize: 'var(--h2-size)', marginBottom: 'var(--item-mb)' }}>
              Experience
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {experience.map((exp, index) => (
                <div key={exp.id} className="break-inside-avoid">
                  {index > 0 && (
                    <div style={{ height: '5px' }} />
                  )}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-gray-900 leading-tight" style={{ fontSize: 'var(--h3-size)' }}>{exp.position}</h3>
                      <span className="text-gray-600 font-medium whitespace-nowrap ml-4" style={{ fontSize: 'var(--text-size)' }}>
                        {exp.startDate} {exp.endDate && `- ${exp.endDate}`}
                      </span>
                    </div>
                    <div className="leading-none" style={{ marginTop: '-2px' }}>
                      <span className="font-semibold text-gray-700 italic" style={{ fontSize: 'var(--text-size)' }}>{exp.company}</span>
                    </div>
                    <ul className="mt-1">
                      {renderBulletPoints(exp.description)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        if (!projects || projects.length === 0) return null;
        return (
          <div className="break-inside-avoid" style={{ marginBottom: 'var(--section-mb)' }} key={key}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--item-mb)' }}>
              {projects.map((proj, index) => {
                const content = (
                  <div className="flex flex-col">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-gray-900 leading-tight" style={{ fontSize: 'var(--h3-size)' }}>{proj.title}</h3>
                        <div className="flex gap-2">
                          {(proj.liveLink || proj.link) && (
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-gray-700" style={{ fontSize: 'var(--text-sm-size)' }}>Live:</span>
                              <a href={formatUrl(proj.liveLink || proj.link)} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline leading-tight" style={{ fontSize: 'var(--text-sm-size)' }}>{(proj.liveLink || proj.link).replace(/^https?:\/\/(www\.)?/, '')}</a>
                            </div>
                          )}
                          {proj.githubLink && (
                            <>
                              <span className="text-gray-300 leading-tight" style={{ fontSize: 'var(--text-sm-size)' }}>|</span>
                              <a href={formatUrl(proj.githubLink)} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline leading-tight" style={{ fontSize: 'var(--text-sm-size)' }}>GitHub</a>
                            </>
                          )}
                        </div>
                      </div>
                      {(proj.startDate || proj.endDate) && (
                        <span className="text-gray-600 font-medium whitespace-nowrap ml-4" style={{ fontSize: 'var(--text-size)' }}>
                          {proj.startDate} {proj.endDate && `- ${proj.endDate}`}
                        </span>
                      )}
                    </div>
                    {proj.technologies && (
                      <div className="leading-tight mt-[1px]" style={{ fontSize: 'var(--text-size)' }}>
                        <span className="font-semibold text-gray-700">Technologies:</span> <span className="text-gray-600">{proj.technologies}</span>
                      </div>
                    )}
                    <ul className="mt-1">
                      {renderBulletPoints(proj.description)}
                    </ul>
                  </div>
                );

                if (index === 0) {
                  return (
                    <div key={proj.id} className="break-inside-avoid">
                      <h2 className="font-bold uppercase border-b border-gray-400 pb-0.5 text-gray-900 tracking-wider" style={{ fontSize: 'var(--h2-size)', marginBottom: 'var(--item-mb)' }}>
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
          <div className="break-inside-avoid" style={{ marginBottom: 'var(--section-mb)' }} key={key}>
            <h2 className="font-bold uppercase border-b border-gray-400 pb-0.5 text-gray-900 tracking-wider" style={{ fontSize: 'var(--h2-size)', marginBottom: 'var(--item-mb)' }}>
              Education
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--item-mb)' }}>
              {education.map(edu => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline" style={{ marginBottom: 'var(--item-mb)' }}>
                    <h3 className="font-bold text-gray-900" style={{ fontSize: 'var(--h3-size)' }}>
                      {edu.institution} {edu.location && <span className="text-gray-500 font-normal ml-1">({edu.location})</span>}
                    </h3>
                    <span className="text-gray-600 font-medium" style={{ fontSize: 'var(--text-size)' }}>
                      {edu.startDate} {edu.endDate && `- ${edu.endDate}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-800 italic" style={{ fontSize: 'var(--text-size)' }}>{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                    {edu.score && <span className="text-gray-600 font-medium" style={{ fontSize: 'var(--text-size)' }}>Score: {edu.score}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        const validSkills = Array.isArray(skills) ? skills.filter(s => s.category?.trim() || s.items?.trim()) : [];
        if (validSkills.length === 0) return null;
        
        return (
          <div className="break-inside-avoid" style={{ marginBottom: 'var(--section-mb)' }} key={key}>
            <h2 className="font-bold uppercase border-b border-gray-400 pb-0.5 text-gray-900 tracking-wider" style={{ fontSize: 'var(--h2-size)', marginBottom: 'var(--item-mb)' }}>
              Technical Skills
            </h2>
            <div style={{ fontSize: 'var(--text-size)', lineHeight: '1.6' }}>
              {validSkills.map((skill, idx) => {
                if (!skill.items || skill.items.trim() === '') return null;
                return (
                  <div key={idx} style={{ marginBottom: 'var(--item-mb)' }}>
                    {skill.category && <span className="font-bold text-gray-800">{skill.category}: </span>}
                    <span className="text-gray-700">{skill.items}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'achievements':
        if (!achievements || achievements.length === 0) return null;
        return (
          <div className="break-inside-avoid" style={{ marginBottom: 'var(--section-mb)' }} key={key}>
            <h2 className="font-bold uppercase border-b border-gray-400 pb-0.5 text-gray-900 tracking-wider" style={{ fontSize: 'var(--h2-size)', marginBottom: 'var(--item-mb)' }}>
              Achievements
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--item-mb)' }}>
              {achievements.map(ach => (
                <div key={ach.id}>
                  <div className="flex justify-between items-baseline" style={{ marginBottom: 'var(--item-mb)' }}>
                    <h3 className="font-bold text-gray-900" style={{ fontSize: 'var(--h3-size)' }}>{ach.title}</h3>
                    <span className="text-gray-600 font-medium" style={{ fontSize: 'var(--text-size)' }}>{ach.date}</span>
                  </div>
                  <div className="text-gray-800" style={{ fontSize: 'var(--text-size)', lineHeight: '1.5' }}>
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
          <div className="break-inside-avoid" style={{ marginBottom: 'var(--section-mb)' }} key={key}>
            <h2 className="font-bold uppercase border-b border-gray-400 pb-0.5 text-gray-900 tracking-wider" style={{ fontSize: 'var(--h2-size)', marginBottom: 'var(--item-mb)' }}>
              Certifications
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--item-mb)' }}>
              {certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold text-gray-900 inline" style={{ fontSize: 'var(--h3-size)' }}>{cert.name}</h3>
                    {cert.issuer && <span className="text-gray-700 italic ml-2" style={{ fontSize: 'var(--text-size)' }}>by {cert.issuer}</span>}
                    {cert.link && (
                      <>
                        <span className="text-gray-300 mx-2" style={{ fontSize: 'var(--text-sm-size)' }}>|</span>
                        <a href={cert.link} className="text-blue-800 hover:underline" style={{ fontSize: 'var(--text-sm-size)' }}>View Credential</a>
                      </>
                    )}
                  </div>
                  <span className="text-gray-600 font-medium whitespace-nowrap ml-4" style={{ fontSize: 'var(--text-size)' }}>{cert.date}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        if (key.startsWith('custom_')) {
          const customSections = data.customSections || [];
          const customSec = customSections.find(cs => cs.id === key);
          if (!customSec || !customSec.items || customSec.items.length === 0) return null;
          
          return (
            <div className="break-inside-avoid" style={{ marginBottom: 'var(--section-mb)' }} key={key}>
              <h2 className="font-bold uppercase border-b border-gray-400 pb-0.5 text-gray-900 tracking-wider" style={{ fontSize: 'var(--h2-size)', marginBottom: 'var(--item-mb)' }}>
                {customSec.heading || 'Section'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {customSec.items.map((item, index) => (
                  <div key={item.id} className="break-inside-avoid">
                    {index > 0 && (
                      <div style={{ height: '5px' }} />
                    )}
                    <div className="flex flex-col">
                      {(item.title || item.date) && (
                        <div className="flex justify-between items-baseline">
                          {item.title && <h3 className="font-bold text-gray-900 leading-tight" style={{ fontSize: 'var(--h3-size)' }}>{item.title}</h3>}
                          {item.date && (
                            <span className="text-gray-600 font-medium whitespace-nowrap ml-4" style={{ fontSize: 'var(--text-size)' }}>
                              {item.date}
                            </span>
                          )}
                        </div>
                      )}
                      {item.subtitle && (
                        <div className="leading-none" style={{ marginTop: '-2px' }}>
                          <span className="font-semibold text-gray-700 italic" style={{ fontSize: 'var(--text-size)' }}>{item.subtitle}</span>
                        </div>
                      )}
                      {item.description && (
                        <ul className="mt-1">
                          {renderBulletPoints(item.description)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
    }
  };

  const initialVars = {
    '--section-mb': '10px',
    '--item-mb': '6px',
    '--title-size': '26px',
    '--h2-size': '13.5px',
    '--h3-size': '12.5px',
    '--text-size': '11px',
    '--text-sm-size': '10px',
    '--line-height': '1.35',
    '--list-pl': '16px'
  };

  const previewStyle = isWebPreview ? {
    fontFamily: "'Inter', sans-serif",
    height: `${totalPages * 1123}px`,
    position: 'relative',
    ...initialVars
  } : {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: 'white',
    position: 'relative',
    ...initialVars
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full text-black pt-[4mm] pb-[6mm] px-[8mm] box-border`} 
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
        <h1 className="font-bold uppercase tracking-wide text-gray-900 mb-0" style={{ fontSize: 'var(--title-size)', lineHeight: '1.2' }}>
          {personalInfo?.firstName} {personalInfo?.lastName}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-gray-700 mt-1" style={{ fontSize: 'var(--text-size)' }}>
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
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-gray-700 mt-0.5" style={{ fontSize: 'var(--text-size)' }}>
          {personalInfo?.linkedin && (
            <a href={formatUrl(personalInfo.linkedin)} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a>
          )}
          {personalInfo?.github && (
            <>
              <span className="text-gray-300">|</span>
              <a href={formatUrl(personalInfo.github)} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline">{personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</a>
            </>
          )}
          {personalInfo?.portfolio && (
            <>
              <span className="text-gray-300">|</span>
              <a href={formatUrl(personalInfo.portfolio)} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline">{personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</a>
            </>
          )}
        </div>
      </div>

      {/* Summary (Always Second if exists) */}
      {personalInfo?.summary && (
        <div className="break-inside-avoid" style={{ marginBottom: 'var(--section-mb)' }}>
          <h2 className="font-bold uppercase border-b border-gray-400 pb-0.5 text-gray-900 tracking-wider" style={{ fontSize: 'var(--h2-size)', marginBottom: 'var(--item-mb)' }}>
            Professional Summary
          </h2>
          <div className="text-gray-800" style={{ fontSize: 'var(--text-size)', lineHeight: '1.6' }}>
            {renderTextWithNewlines(personalInfo.summary, "")}
          </div>
        </div>
      )}

      {/* Dynamic Sections Based on Order */}
      {sectionOrder.map(key => renderSectionContent(key))}

      {/* Watermark (Always at the exact bottom center of EACH page) */}
      {Array.from({ length: totalPages }).map((_, i) => (
        <div 
          key={`watermark-${i}`}
          className="absolute w-full text-center text-slate-400 opacity-60 font-medium select-none pointer-events-none" 
          style={{ 
            fontSize: '11px', 
            top: `${(i * 1123) + 1123 - 25}px`, // 25px from the bottom of each A4 page
            left: 0, 
            zIndex: 50 
          }}
        >
          Powered by <a href="https://code-a-nova.online/" target="_blank" rel="noopener noreferrer" className="font-bold tracking-wide pointer-events-auto hover:underline text-slate-400">Code-A-Nova</a>
        </div>
      ))}
    </div>
  );
};

export default ResumePreview;
