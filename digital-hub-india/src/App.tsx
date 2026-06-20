import React, { useState, useEffect } from 'react';
import { Section } from './types';
import Navigation from './components/Navigation';
import HomeSection from './components/HomeSection';
import PdfToolsSection from './components/PdfToolsSection';
import ResumeBuilderSection from './components/ResumeBuilderSection';
import TypingTestSection from './components/TypingTestSection';
import ImageToolsSection from './components/ImageToolsSection';
import EducationSection from './components/EducationSection';
import ServicesProductsSection from './components/ServicesProductsSection';
import GroupsSocialSection from './components/GroupsSocialSection';
import AdminSection from './components/AdminSection';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import AuthModal from './components/AuthModal';
import { collection, addDoc } from 'firebase/firestore';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Youtube,
  Facebook,
  Instagram,
  Zap,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [pdfToolId, setPdfToolId] = useState<string | null>(null);
  const [imageToolTab, setImageToolTab] = useState<'merger' | 'age' | 'bg-remover'>('merger');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryService, setInquiryService] = useState('');

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [postAuthCallback, setPostAuthCallback] = useState<{ action: () => void } | null>(null);
  const [supportExpanded, setSupportExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      // If user successfully logs in and we have a target callback action, trigger it
      if (user && postAuthCallback) {
        postAuthCallback.action();
        setPostAuthCallback(null);
      }
    });
    return () => unsubscribe();
  }, [postAuthCallback]);

  const requireAuth = (action: () => void, promptMessage: string) => {
    if (auth.currentUser) {
      action();
    } else {
      setAuthModalMessage(promptMessage);
      setPostAuthCallback({ action });
      setAuthModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Inquiry form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientMsg, setClientMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Scroll to top on section transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentSection]);

  const handleOpenInquiry = (serviceName: string = '') => {
    setInquiryService(serviceName);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientMsg(serviceName ? `Hello Santosh, I want to inquire about your: "${serviceName}" service.` : '');
    setShowSuccessMessage(false);
    setShowInquiryModal(true);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Please fill out your Name and Contact Number.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessMessage(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      // Store inquiry document dynamically to Firestore if authenticated
      if (auth.currentUser) {
        addDoc(collection(db, 'users', auth.currentUser.uid, 'inquiries'), {
          userId: auth.currentUser.uid,
          clientName,
          clientPhone,
          clientEmail,
          service: inquiryService,
          message: clientMsg,
          createdAt: new Date().toISOString()
        }).catch(err => console.error('Error storing inquiry in firestore:', err));
      }

      // Triggers redirect to whatsapp after 2 seconds safely
      setTimeout(() => {
        const textMsg = `Hello Santosh, my name is ${clientName} (${clientEmail ? clientEmail : 'No Email'}). Phone: ${clientPhone}. Message: ${clientMsg ? clientMsg : 'Inquiry registered'}.`;
        const encoded = encodeURIComponent(textMsg);
        window.open(`https://wa.me/918935882550?text=${encoded}`, '_blank');
        setShowInquiryModal(false);
      }, 2000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none bg-gradient-to-br from-slate-100/80 via-slate-50 to-indigo-50/30">
      {/* 1. Header & Navigation Menu */}
      <Navigation
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        onOpenQuickInquiry={() => handleOpenInquiry('Custom Web Application')}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthModalMessage('Unlock candidate speed tests, sarkari forms, and downloadable utility modules.');
          setAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* 2. Main content container */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {currentSection !== 'home' && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 no-print animate-in fade-in duration-300">
            <button
              onClick={() => {
                setCurrentSection('home');
                setPdfToolId(null); // Clear nested tool selections to avoid sticky layouts
                setImageToolTab('merger');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white hover:shadow-indigo-500/20 border border-indigo-500 rounded-2xl text-xs font-extrabold shadow-lg transition-all cursor-pointer group hover:brightness-105 active:scale-95"
            >
              <span className="text-sm font-black group-hover:-translate-x-1.5 transition-transform inline-block">←</span>
              <span>Home Dashboard (मुख्य सूची पर वापस जाएं)</span>
            </button>
            <div className="text-[10px] font-extrabold tracking-wide uppercase px-3.5 py-2 bg-slate-200/60 text-indigo-800 border border-slate-200 rounded-xl font-mono shadow-inner">
              Active: {currentSection.replace('-', ' ')}
            </div>
          </div>
        )}
        {currentSection === 'home' && (
          <HomeSection
            setCurrentSection={setCurrentSection}
            setSelectedPdfTool={setPdfToolId}
            setSelectedImageTab={setImageToolTab}
            onOpenQuickInquiry={() => handleOpenInquiry('General Technical Consultation')}
            currentUser={currentUser}
            requireAuth={requireAuth}
          />
        )}

        {currentSection === 'pdf-tools' && (
          <PdfToolsSection
            defaultToolId={pdfToolId}
            setDefaultToolId={setPdfToolId}
            currentUser={currentUser}
            requireAuth={requireAuth}
          />
        )}

        {currentSection === 'resume-maker' && (
          <ResumeBuilderSection
            currentUser={currentUser}
            requireAuth={requireAuth}
          />
        )}

        {currentSection === 'typing-test' && (
          <TypingTestSection
            currentUser={currentUser}
            requireAuth={requireAuth}
          />
        )}

        {currentSection === 'image-tools' && (
          <ImageToolsSection
            activeTab={imageToolTab}
            setActiveTab={setImageToolTab}
            currentUser={currentUser}
            requireAuth={requireAuth}
          />
        )}

        {currentSection === 'notes-syllabus' && (
          <EducationSection
            currentUser={currentUser}
            requireAuth={requireAuth}
          />
        )}

        {currentSection === 'services-products' && (
          <ServicesProductsSection
            onOpenQuickInquiry={() => handleOpenInquiry('Custom Assistance')}
            openInquiryWithService={(svcName) => handleOpenInquiry(svcName)}
            currentUser={currentUser}
          />
        )}

        {currentSection === 'communities' && <GroupsSocialSection />}

        {currentSection === 'admin' && (
          currentUser?.email?.trim().toLowerCase() === 'santoshtech45@gmail.com' ? (
            <AdminSection currentUser={currentUser} />
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-md mx-auto my-12">
              <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Only the verified administrator account at santoshtech45@gmail.com can view or modify system assets.
              </p>
              <button 
                onClick={() => setCurrentSection('home')} 
                className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )
        )}
      </main>

      {/* 3. Gorgeous Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-4 border-t border-slate-800 no-print">
        <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
          {/* Logo & Pitch */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-base font-extrabold tracking-tight display-title">
                DIGITAL HUB INDIA
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Curated by Santosh Tech. Serving candidates, students, and businesses with free PDF converters, typing examiners, and premium frontend web architectures.
            </p>
            <div className="flex gap-3 text-slate-500 pt-1">
              <a href="https://youtube.com/@santoh8988?si=EuLdD0cbUAkeMpPJ" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">
                <Youtube className="w-4.5 h-4.5" />
              </a>
              <a href="https://www.facebook.com/Santosh893588?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                <Facebook className="w-4.5 h-4.5" />
              </a>
              <a href="https://www.instagram.com/wanted_8935?igsh=eTljajFtd29kdXF2" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                <Instagram className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Quick Hub Links */}
          <div className="space-y-4 text-xs font-semibold">
            <h4 className="text-white text-[10px] tracking-widest font-bold uppercase font-mono">QUICK LAUNCH SITES</h4>
            <ul className="space-y-2.5 font-light text-[11px]">
              <li>
                <button onClick={() => setCurrentSection('pdf-tools')} className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>Interactive PDF Tools</span>
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentSection('resume-maker')} className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>Resume Builder Maker</span>
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentSection('typing-test')} className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>H/E Typing speed test</span>
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentSection('image-tools')} className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>Photo Signature Merger</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Core Academics */}
          <div className="space-y-4 text-xs font-semibold">
            <h4 className="text-white text-[10px] tracking-widest font-bold uppercase font-mono">ACADEMICS & NOTES</h4>
            <ul className="space-y-2.5 font-light text-[11px]">
              <li>
                <button onClick={() => setCurrentSection('notes-syllabus')} className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>GK & Maths Class Notes</span>
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentSection('notes-syllabus')} className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>Book Downloads shelf</span>
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentSection('notes-syllabus')} className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>SSC/Railway Syllabus</span>
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentSection('communities')} className="hover:text-white hover:translate-x-0.5 transition flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>Telegram & WhatsApp Links</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact help center */}
          <div className="space-y-4 text-xs font-semibold">
            <h4 className="text-white text-[10px] tracking-widest font-bold uppercase font-mono">DIRECT CONTACT HELP</h4>
            <ul className="space-y-3 font-light text-[11px]">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                <a href="tel:8935882550" className="hover:text-white font-mono font-bold">+91 89358 82550</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <a href="mailto:SANTOSHTECH45@GMAIL.COM" className="hover:text-white font-mono break-all">SANTOSHTECH45@GMAIL.COM</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Patna, Bihar, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer credits */}
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-6 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Digital Hub India. Designed & Developed by Santosh Tech. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="tel:8935882550" className="hover:text-slate-350 transition-colors">Emergency Support</a>
            <span>•</span>
            <a href="mailto:SANTOSHTECH45@GMAIL.COM" className="hover:text-slate-350 transition-colors">Privacy Agreement</a>
          </div>
        </div>
      </footer>

      {/* 4. CUSTOM INQUIRY DIALOG MODAL Overlay */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative border animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {showSuccessMessage ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Inquiry Received Flawlessly!</h3>
                  <p className="text-xs text-slate-500 mt-1">Redirecting you to direct WhatsApp chat with Santosh...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs font-semibold text-slate-600">
                <div className="space-y-1">
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border">FORM INQUIRY</span>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight mt-1">Send a Custom technical Service Request</h3>
                </div>

                {inquiryService && (
                  <div className="p-2.5 bg-indigo-50/55 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 font-bold">
                    Target: "{inquiryService}"
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-705 block">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-705 block">Contact Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mobile / Phone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-705 block">Email ID (Optional)</label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-705 block">Project specs / Message</label>
                  <textarea
                    rows={3}
                    placeholder="Describe what templates or website you want built..."
                    value={clientMsg}
                    onChange={(e) => setClientMsg(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow"
                >
                  {isSubmitting ? 'Submitting...' : 'Proceed to Chat on WhatsApp'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal overlay portal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        message={authModalMessage}
      />

      {/* Floating Active Support Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-50 no-print">
        {supportExpanded ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 w-76 sm:w-80 space-y-4 animate-in slide-in-from-bottom duration-250 text-left">
            <div className="flex justify-between items-center border-b pb-3.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Active Helpdesk (Santosh Tech)</p>
              </div>
              <button 
                onClick={() => setSupportExpanded(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500 font-semibold leading-relaxed">
                Need quick support for payment updates, dynamic syllabus access, custom tools, or offline keys? Get in touch immediately.
              </p>
              
              <div className="bg-slate-50 border p-3 rounded-2xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Mobile Call Line</p>
                    <a href="tel:+918935882550" className="text-xs font-black text-slate-900 hover:underline">+91 89358 82550</a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Direct Email Address</p>
                    <a href="mailto:SANTOSHTECH45@GMAIL.COM" className="text-[11px] font-bold text-slate-800 hover:underline">SANTOSHTECH45@GMAIL.COM</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-extrabold pt-1">
              <a 
                href="https://wa.me/918935882550?text=Hello%20DigitalHubIndia%20Support,%20I%20have%20a%20query%20regarding%20study%20pass/tools."
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a 
                href="tel:8935882550" 
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Admin</span>
              </a>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSupportExpanded(true)}
            className="flex items-center gap-2.5 px-4.5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:-translate-y-0.5 text-white rounded-full font-extrabold text-xs shadow-md transition-all cursor-pointer group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-250"></span>
            </span>
            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">Help & WhatsApp Support</span>
          </button>
        )}
      </div>
    </div>
  );
}
