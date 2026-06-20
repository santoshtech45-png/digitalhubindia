import React, { useState, useEffect } from 'react';
import { ResumeData } from '../types';
import {
  FileText,
  User,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  Briefcase,
  BookOpen,
  MapPin,
  Settings,
  Printer,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface ResumeBuilderSectionProps {
  currentUser?: any;
  requireAuth?: (action: () => void, message: string) => void;
}

export default function ResumeBuilderSection({ currentUser, requireAuth }: ResumeBuilderSectionProps = {}) {
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimalist'>('modern');
  const [resume, setResume] = useState<ResumeData>({
    fullName: 'Santosh Kumar',
    email: 'santoshtech45@gmail.com',
    phone: '+91 89358 82550',
    address: 'Patna, Bihar, India',
    website: 'https://youtube.com/@santoh8988',
    summary: 'Diligent fullstack developer and document specialist. Skilled in designing clean websites, engineering robust local web solutions, and managing high-speed document operations for government recruitment candidates.',
    education: [
      { degree: 'Bachelor of Science (Computer Science)', school: 'Patna University', year: '2023', percentage: '82%' }
    ],
    experience: [
      { role: 'Freelance Technical Specialist', company: 'Digital Hub India', duration: '2024 - Present', details: 'Built customized client dashboards, coordinated digital identity formatting for SSC aspirants, and optimized PDF tools.' }
    ],
    skills: ['React & Node.js', 'TypeScript', 'Tailwind CSS', 'Fast Typing (50+ WPM)', 'Document Formatting', 'Photoshop'],
    languages: ['Hindi (Native)', 'English (Professional)'],
    projects: [
      { name: 'Sarkari Photo signature Merger', description: 'Web tool used by 1,000+ candidates to combine ID credentials.', link: 'https://digital-hub.in' }
    ]
  });

  // Load from Cloud Firestore
  useEffect(() => {
    if (currentUser) {
      const loadResume = async () => {
        try {
          const q = query(
            collection(db, 'users', currentUser.uid, 'resumes'),
            orderBy('updatedAt', 'desc'),
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (data.content) {
              setResume(data.content);
            }
          }
        } catch (err) {
          console.error('Error loading resume content from Cloud Firestore:', err);
        }
      };
      loadResume();
    }
  }, [currentUser]);

  const saveResumeToCloud = async (currentResumeData: ResumeData) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'resumes'), {
        userId: currentUser.uid,
        content: currentResumeData,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error saving current resume state:', err);
    }
  };

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const handleAddField = (field: 'education' | 'experience' | 'projects') => {
    if (field === 'education') {
      setResume({
        ...resume,
        education: [...resume.education, { degree: '', school: '', year: '', percentage: '' }]
      });
    } else if (field === 'experience') {
      setResume({
        ...resume,
        experience: [...resume.experience, { role: '', company: '', duration: '', details: '' }]
      });
    } else {
      setResume({
        ...resume,
        projects: [...resume.projects, { name: '', description: '' }]
      });
    }
  };

  const handleRemoveField = (field: 'education' | 'experience' | 'projects', idx: number) => {
    const updated = { ...resume };
    if (field === 'education') {
      updated.education = updated.education.filter((_, i) => i !== idx);
    } else if (field === 'experience') {
      updated.experience = updated.experience.filter((_, i) => i !== idx);
    } else {
      updated.projects = updated.projects.filter((_, i) => i !== idx);
    }
    setResume(updated);
  };

  const addSkill = () => {
    if (newSkill.trim() && !resume.skills.includes(newSkill.trim())) {
      setResume({ ...resume, skills: [...resume.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !resume.languages.includes(newLanguage.trim())) {
      setResume({ ...resume, languages: [...resume.languages, newLanguage.trim()] });
      setNewLanguage('');
    }
  };

  const triggerPrintDownload = () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => triggerPrintDownload(), 'Please Sign In or Create an Account to export your professional resume.');
      return;
    }
    if (currentUser) {
      saveResumeToCloud(resume);
    }
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
      {/* LEFT: Complete Input Fields Panel */}
      <div className="xl:col-span-5 space-y-6 no-print">
        {/* Header Block */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[9px] font-extrabold bg-indigo-50 text-indigo-700 rounded border border-indigo-100">FORM BUILDER</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enter Your Resume Details</h2>
          <p className="text-xs text-slate-500">Form fields below update the visual layout in real time.</p>
        </div>

        {/* 1. Personal Identity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2 flex items-center gap-1.5">
            <User className="w-4.5 h-4.5 text-indigo-600" />
            Personal Details
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={resume.fullName}
                onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Email ID</label>
                <input
                  type="email"
                  value={resume.email}
                  onChange={(e) => setResume({ ...resume, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={resume.phone}
                  onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Address Location</label>
              <input
                type="text"
                value={resume.address}
                onChange={(e) => setResume({ ...resume, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Portfolio Link / YouTube URL</label>
              <input
                type="text"
                value={resume.website}
                onChange={(e) => setResume({ ...resume, website: e.target.value })}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Professional Summary</label>
              <textarea
                rows={3}
                value={resume.summary}
                onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Education Hub */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4.5 h-4.5 text-indigo-600" />
              Education History
            </h3>
            <button
              onClick={() => handleAddField('education')}
              className="p-1 px-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add school
            </button>
          </div>
          {resume.education.map((edu, index) => (
            <div key={index} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2 text-xs relative">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-900">Graduation / School Course {index + 1}</span>
                <button
                  onClick={() => handleRemoveField('education', index)}
                  className="text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Degree (e.g. Matriculation / Intermediate / BCA)"
                  value={edu.degree}
                  onChange={(e) => {
                    const clone = { ...resume };
                    clone.education[index].degree = e.target.value;
                    setResume(clone);
                  }}
                  className="w-full p-2 bg-white rounded border border-slate-200 outline-none"
                />
                <input
                  type="text"
                  placeholder="School / University Name"
                  value={edu.school}
                  onChange={(e) => {
                    const clone = { ...resume };
                    clone.education[index].school = e.target.value;
                    setResume(clone);
                  }}
                  className="w-full p-2 bg-white rounded border border-slate-200 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Passing Year"
                    value={edu.year}
                    onChange={(e) => {
                      const clone = { ...resume };
                      clone.education[index].year = e.target.value;
                      setResume(clone);
                    }}
                    className="w-full p-2 bg-white rounded border border-slate-200 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Marks / Percentage"
                    value={edu.percentage}
                    onChange={(e) => {
                      const clone = { ...resume };
                      clone.education[index].percentage = e.target.value;
                      setResume(clone);
                    }}
                    className="w-full p-2 bg-white rounded border border-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Professional Experience */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-4.5 h-4.5 text-indigo-600" />
              Work & Job details
            </h3>
            <button
              onClick={() => handleAddField('experience')}
              className="p-1 px-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add job
            </button>
          </div>
          {resume.experience.map((exp, index) => (
            <div key={index} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2 text-xs relative">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-900">Job Profile {index + 1}</span>
                <button
                  onClick={() => handleRemoveField('experience', index)}
                  className="text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Designation Role (e.g., Computer Operator)"
                  value={exp.role}
                  onChange={(e) => {
                    const clone = { ...resume };
                    clone.experience[index].role = e.target.value;
                    setResume(clone);
                  }}
                  className="w-full p-2 bg-white rounded border border-slate-200 outline-none"
                />
                <input
                  type="text"
                  placeholder="Organization or Company Name"
                  value={exp.company}
                  onChange={(e) => {
                    const clone = { ...resume };
                    clone.experience[index].company = e.target.value;
                    setResume(clone);
                  }}
                  className="w-full p-2 bg-white rounded border border-slate-200 outline-none"
                />
                <input
                  type="text"
                  placeholder="Duration (e.g. 2022 - present)"
                  value={exp.duration}
                  onChange={(e) => {
                    const clone = { ...resume };
                    clone.experience[index].duration = e.target.value;
                    setResume(clone);
                  }}
                  className="w-full p-2 bg-white rounded border border-slate-200 outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="Job Summary or Key achievements"
                  value={exp.details}
                  onChange={(e) => {
                    const clone = { ...resume };
                    clone.experience[index].details = e.target.value;
                    setResume(clone);
                  }}
                  className="w-full p-2 bg-white rounded border border-slate-200 outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* 4. Skills & Languages Tag inputs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-800">Skills Tag Center</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type skill & press Add"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                className="flex-1 p-2 bg-slate-50 rounded border outline-none focus:bg-white"
              />
              <button onClick={addSkill} className="px-3 bg-slate-900 text-white rounded font-semibold">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {resume.skills.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-700">
                  {skill}
                  <button
                    onClick={() => setResume({ ...resume, skills: resume.skills.filter((_, i) => i !== idx) })}
                    className="text-slate-400 hover:text-slate-700 font-bold ml-1 text-[11px]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h4 className="font-extrabold text-slate-800 font-display">Languages Spoken</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Language (e.g. Hindi, English)"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="flex-1 p-2 bg-slate-50 rounded border outline-none focus:bg-white"
              />
              <button onClick={addLanguage} className="px-3 bg-slate-900 text-white rounded font-semibold">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resume.languages.map((lang, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-700">
                  {lang}
                  <button
                    onClick={() => setResume({ ...resume, languages: resume.languages.filter((_, i) => i !== idx) })}
                    className="text-slate-400 hover:text-slate-700 font-bold ml-1 text-[11px]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Live Resume Preview Page */}
      <div className="xl:col-span-7 space-y-6">
        {/* Template Selector Controls */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-indigo-600 animate-spin" />
            <span className="text-xs font-extrabold text-slate-600">TEMPLATE:</span>
            <div className="flex gap-1.5">
              {(['modern', 'classic', 'minimalist'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    template === t
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={triggerPrintDownload}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>

        {/* Live Typography Paper */}
        <div className="bg-white border-2 border-slate-200 aspect-[1/1.414] rounded-2.5xl p-6 sm:p-10 shadow-lg print-card print-only text-slate-800">
          {/* Template Variant 1: MODERN SLATE */}
          {template === 'modern' && (
            <div className="h-full flex flex-col justify-between text-xs space-y-6">
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="border-b-2 border-indigo-600 pb-4 flex flex-col sm:flex-row justify-between items-baseline gap-2">
                  <div>
                    <h1 className="text-2.5xl font-extrabold tracking-tight text-slate-900 uppercase display-title">{resume.fullName || 'FULL NAME'}</h1>
                    <p className="text-[10px] text-indigo-600 font-mono tracking-widest font-extrabold mt-0.5">TECHNICAL SPECIALIST</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono space-y-0.5">
                    <p>{resume.phone}</p>
                    <p>{resume.email}</p>
                    <p>{resume.address}</p>
                    {resume.website && <p className="text-indigo-600 truncate max-w-[220px]">{resume.website}</p>}
                  </div>
                </div>

                {/* Profile Summary */}
                {resume.summary && (
                  <div className="space-y-1.5">
                    <h3 className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider">Professional Profile</h3>
                    <p className="text-slate-600 leading-relaxed text-xs">{resume.summary}</p>
                  </div>
                )}

                {/* Experience Block */}
                {resume.experience.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider border-b border-indigo-50/80 pb-0.5">Chronology of Experience</h3>
                    <div className="space-y-3">
                      {resume.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-bold text-slate-900 text-xs">
                            <span>{exp.role || 'Designation'} — <span className="text-indigo-600">{exp.company || 'Company'}</span></span>
                            <span className="font-mono text-[10px] text-slate-400 font-medium">{exp.duration}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed italic">{exp.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Section */}
                {resume.education.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider border-b border-indigo-50/80 pb-0.5">Academic Qualifications</h3>
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 text-left font-bold font-mono">
                          <th className="pb-1">Course / Degree</th>
                          <th className="pb-1">Institution</th>
                          <th className="pb-1 text-center">Year</th>
                          <th className="pb-1 text-right">Aggregate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {resume.education.map((edu, idx) => (
                          <tr key={idx} className="text-slate-600">
                            <td className="py-1.5 font-semibold text-slate-800">{edu.degree || 'Degree name'}</td>
                            <td className="py-1.5">{edu.school || 'College name'}</td>
                            <td className="py-1.5 text-center font-mono">{edu.year || '2023'}</td>
                            <td className="py-1.5 text-right font-mono font-semibold text-slate-800">{edu.percentage || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Skills Footer */}
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-indigo-950 uppercase tracking-widest font-mono">Technical Expertise</h4>
                  <p className="text-slate-600 text-xs tracking-tight">{resume.skills.join(' ∙  ')}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-indigo-950 uppercase tracking-widest font-mono">Languages & Personal</h4>
                  <p className="text-slate-600 text-xs tracking-tight">{resume.languages.join(', ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Template Variant 2: CLASSIC ACADEMIC */}
          {template === 'classic' && (
            <div className="h-full flex flex-col justify-between text-xs font-serif text-slate-900 leading-relaxed">
              <div className="space-y-6">
                {/* Header centering name */}
                <div className="text-center space-y-1">
                  <h1 className="text-3xl tracking-tight uppercase font-medium">{resume.fullName}</h1>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500 italic pb-3 border-b-2 border-slate-300">
                    <span>{resume.phone}</span>
                    <span>•</span>
                    <span>{resume.email}</span>
                    <span>•</span>
                    <span>{resume.address}</span>
                  </div>
                </div>

                {/* Pro profile */}
                {resume.summary && (
                  <div className="space-y-1">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-slate-800 border-b border-slate-300 pb-0.5">Professional Summary</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{resume.summary}</p>
                  </div>
                )}

                {/* Timeline and experiences */}
                {resume.experience.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-slate-800 border-b border-slate-300 pb-0.5">Employment Profile</h3>
                    <div className="space-y-3">
                      {resume.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between font-bold text-xs text-slate-800">
                            <span>{exp.company} — <span className="italic font-normal">{exp.role}</span></span>
                            <span className="font-mono text-[10px]">{exp.duration}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 pl-2 border-l border-slate-200">{exp.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Educations */}
                {resume.education.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-slate-800 border-b border-slate-300 pb-0.5">Educational qualifications</h3>
                    {resume.education.map((edu, idx) => (
                      <div key={idx} className="flex justify-between items-baseline text-xs">
                        <div>
                          <span className="font-semibold">{edu.degree}</span>
                          <span className="text-slate-500 text-[11px]">, {edu.school}</span>
                        </div>
                        <div className="text-right text-[11px]">
                          <strong>{edu.percentage}</strong> ({edu.year})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Footer */}
              <div className="border-t border-slate-350 pt-3 flex flex-wrap gap-x-6 gap-y-2 text-[11px] italic text-slate-600">
                <div>
                  <strong>Skills Grid:</strong> {resume.skills.join(', ')}
                </div>
                <div>
                  <strong>Languages:</strong> {resume.languages.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Template Variant 3: MINIMALIST TECH */}
          {template === 'minimalist' && (
            <div className="h-full flex flex-col justify-between text-xs font-mono text-slate-700">
              <div className="space-y-6">
                {/* Minimal Header */}
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-widest text-slate-900 border-b border-slate-200 pb-2">{resume.fullName.toUpperCase()}</h1>
                  <div className="grid grid-cols-2 text-[10px] text-slate-400 gap-2">
                    <p>PHONE: {resume.phone}</p>
                    <p>EMAIL: {resume.email}</p>
                    <p>LOC: {resume.address}</p>
                    {resume.website && <p className="truncate">URL: {resume.website}</p>}
                  </div>
                </div>

                {resume.summary && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">// SUMMARY</p>
                    <p className="text-[11px] leading-relaxed text-slate-600">{resume.summary}</p>
                  </div>
                )}

                {resume.experience.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">// EXPERIENCE RECORDS</p>
                    <div className="space-y-3">
                      {resume.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="font-bold text-slate-900">{exp.role} @ {exp.company} [{exp.duration}]</p>
                          <p className="text-slate-500 text-[11px]">{exp.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resume.education.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">// EDUCATION ENTRIES</p>
                    {resume.education.map((edu, idx) => (
                      <div key={idx} className="text-slate-600 text-[11px]">
                        ∙ <strong className="text-slate-800">{edu.degree}</strong> ({edu.school}) - Year: {edu.year} - Grade: {edu.percentage}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Footer */}
              <div className="border-t border-dashed pt-4 text-[10px] space-y-1 text-slate-400">
                <p><strong>[TECH SKILLS]</strong> {resume.skills.join(', ')}</p>
                <p><strong>[LANGS]</strong> {resume.languages.join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
