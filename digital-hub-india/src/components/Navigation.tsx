import React, { useState } from 'react';
import { Section } from '../types';
import {
  Home,
  FileCode,
  Keyboard,
  Image as ImageIcon,
  BookOpen,
  Briefcase,
  Users,
  Bell,
  Menu,
  X,
  Phone,
  Mail,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface NavigationProps {
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
  onOpenQuickInquiry: () => void;
  currentUser: any;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export default function Navigation({
  currentSection,
  setCurrentSection,
  onOpenQuickInquiry,
  currentUser,
  onOpenAuth,
  onSignOut
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems: { id: Section; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'pdf-tools', label: 'PDF Tools', icon: FileCode },
    { id: 'resume-maker', label: 'Resume Maker', icon: Briefcase },
    { id: 'typing-test', label: 'Typing Test', icon: Keyboard },
    { id: 'image-tools', label: 'Image Tools', icon: ImageIcon },
    { id: 'notes-syllabus', label: 'Study & Notes', icon: BookOpen },
    { id: 'services-products', label: 'Services & Store', icon: Briefcase },
    { id: 'communities', label: 'Join Community', icon: Users },
    { id: 'admin', label: 'Admin 👑', icon: Zap }
  ];

  const handleNavClick = (sectionId: Section) => {
    setCurrentSection(sectionId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleMenuItems = menuItems.filter(item => {
    if (item.id === 'admin') {
      return currentUser && currentUser.email && currentUser.email.trim().toLowerCase() === 'santoshtech45@gmail.com';
    }
    return true;
  });

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-1 cursor-pointer select-none group hover:opacity-95 transition-all"
            id="app-header-logo"
          >
            <div className="flex items-center gap-2">
              {/* Elegant Tech Logo Illustration matching the image exactly */}
              <svg className="h-10 w-11 shrink-0 group-hover:scale-105 transition-transform duration-300" viewBox="4 0 112 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left vertical backbone (Circuitry Stem in Green) */}
                <rect x="25" y="15" width="10" height="66" rx="3" fill="url(#green-grad)" />
                
                {/* Tech Circuit Dots and Nodes on Left Stem */}
                <circle cx="12" cy="38" r="4.5" fill="#22c55e" />
                <path d="M12 38h15" stroke="#22c55e" strokeWidth="2" />
                <circle cx="8" cy="51" r="4.5" fill="#f59e0b" />
                <path d="M8 51h20" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="11" cy="64" r="4.5" fill="#10b981" />
                <path d="M11 64h15" stroke="#10b981" strokeWidth="2" />

                {/* Top-Right Curve of D with Blue Grid Pixels */}
                <path d="M36 15h28c16 0 30 11 30 27s-14 27-30 27H36V15z" stroke="url(#blue-grad)" strokeWidth="6.5" strokeLinecap="round" />
                
                {/* Pixel blocks on the top-right bend */}
                <rect x="52" y="11" width="5" height="5" rx="1" fill="#0ea5e9" />
                <rect x="62" y="15" width="5" height="5" rx="1" fill="#0284c7" />
                <rect x="72" y="21" width="5" height="5" rx="1" fill="#3b82f6" />
                <rect x="80" y="30" width="5" height="5" rx="1" fill="#2563eb" />
                <rect x="57" y="6" width="4" height="4" rx="1" fill="#f59e0b" />
                <rect x="67" y="9" width="4" height="4" rx="1" fill="#fbbf24" />

                {/* Elegant Indian Tricolor Waving Swirl underneath */}
                <path d="M40 79c16-2.5 32 6.5 56-4" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" /> {/* Saffron */}
                <path d="M42 83.5c16-2.5 32 6.5 56-4" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" /> {/* White/Light Slate */}
                <path d="M44 88c15-2.5 30 6.5 54-4" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" /> {/* Green */}

                {/* Gradients definitions */}
                <defs>
                  <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                  <linearGradient id="blue-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Logo Text precisely matching font weight and layout */}
              <div className="flex flex-col text-left leading-none">
                <div className="flex items-baseline">
                  <span className="text-[17px] font-bold tracking-tight text-slate-800 font-sans">Digital</span>
                  <span className="text-[17px] font-black tracking-tight text-sky-500 font-sans ml-0.5">Hub</span>
                </div>
                <span className="text-[9px] font-black tracking-[0.27em] text-orange-500 uppercase mt-0.5 font-sans">INDIA</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              // Custom vibrant colorful style config for tabs
              const config: Record<Section, { active: string; inactive: string }> = {
                home: { 
                  active: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200/50', 
                  inactive: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100' 
                },
                'pdf-tools': { 
                  active: 'bg-rose-600 text-white shadow-sm shadow-rose-200/50', 
                  inactive: 'text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-150' 
                },
                'resume-maker': { 
                  active: 'bg-indigo-600 text-white shadow-sm shadow-indigo-100', 
                  inactive: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-150' 
                },
                'typing-test': { 
                  active: 'bg-amber-600 text-white shadow-sm shadow-amber-200/50', 
                  inactive: 'text-amber-800 bg-amber-50 hover:bg-amber-100/70 border border-amber-150' 
                },
                'image-tools': { 
                  active: 'bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-200/50', 
                  inactive: 'text-fuchsia-700 bg-fuchsia-50/80 hover:bg-fuchsia-100 border border-fuchsia-100' 
                },
                'notes-syllabus': { 
                  active: 'bg-sky-600 text-white shadow-sm shadow-sky-200/50', 
                  inactive: 'text-sky-700 bg-sky-50/80 hover:bg-sky-100 border border-sky-150' 
                },
                'services-products': { 
                  active: 'bg-violet-600 text-white shadow-sm shadow-violet-100', 
                  inactive: 'text-violet-700 bg-violet-50 hover:bg-violet-100/70 border border-violet-150' 
                },
                communities: { 
                  active: 'bg-teal-600 text-white shadow-sm shadow-teal-100', 
                  inactive: 'text-teal-700 bg-teal-50 hover:bg-teal-100/70 border border-teal-150' 
                },
                admin: { 
                  active: 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-sm shadow-red-200/50 border border-red-500 font-bold', 
                  inactive: 'text-orange-700 bg-orange-50 hover:bg-orange-100/70 border border-orange-150' 
                },
                blog: { 
                  active: 'bg-indigo-600 text-white shadow-sm shadow-indigo-100', 
                  inactive: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-150' 
                }
              };
              const styles = config[item.id] || { active: 'bg-indigo-600 text-white shadow-sm', inactive: 'text-slate-600 hover:bg-slate-50' };

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold tracking-tight transition-all shadow-xs ${
                    isActive ? styles.active : styles.inactive
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'opacity-85'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
 
          {/* Right Action Button */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={onOpenQuickInquiry}
              className="px-2.5 py-1.5 text-[10px] font-extrabold text-white bg-gradient-to-r from-amber-500 via-pink-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 rounded-lg shadow-sm hover:shadow transition-all animate-pulse"
            >
              Get Free Consultation
            </button>
 
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold overflow-hidden select-none">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px]">{currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}</span>
                    )}
                  </div>
                  <div className="text-left leading-tight max-w-[100px] truncate">
                    <p className="text-[10px] font-bold text-slate-800 truncate" title={currentUser.displayName || currentUser.email || ''}>
                      {currentUser.displayName || 'Authorized'}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate" title={currentUser.email || ''}>
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Logout"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  id="nav-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer"
                id="nav-login-btn"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In / Sign Up</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white shadow-xl animate-in slide-in-from-top duration-200">
            <div className="px-3 py-4 space-y-1">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 pl-3'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="pt-4 border-t border-slate-150 px-4 space-y-2.5">
                {currentUser ? (
                  <div className="space-y-2 pb-2">
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold overflow-hidden">
                        {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs">{currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}</span>
                        )}
                      </div>
                      <div className="text-left leading-tight truncate flex-1">
                        <p className="text-xs font-extrabold text-slate-800 truncate">
                          {currentUser.displayName || 'Authorized User'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50/50 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out from Hub</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-center text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-slate-500" />
                    <span>Sign In / Sign Up</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenQuickInquiry();
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl text-center text-xs font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-1"
                >
                  <span>Request a Custom Service</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
