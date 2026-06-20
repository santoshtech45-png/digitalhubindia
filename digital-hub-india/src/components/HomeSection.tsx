import React, { useState, useEffect } from 'react';
import { Section } from '../types';
import { collection, getDocs, onSnapshot, doc, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { User } from 'firebase/auth';
import {
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  Smartphone,
  Facebook,
  Youtube,
  Instagram,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Bell,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  FileCode,
  Briefcase,
  Keyboard,
  Image as ImageIcon,
  FileText,
  ShoppingBag,
  HelpCircle,
  Star
} from 'lucide-react';

interface HomeSectionProps {
  setCurrentSection: (section: Section) => void;
  onOpenQuickInquiry: () => void;
  setSearchPreloadQuery?: (query: string) => void;
  setSelectedPdfTool?: (id: string | null) => void;
  setSelectedImageTab?: (tab: 'merger' | 'age' | 'bg-remover') => void;
  currentUser?: User | null;
  requireAuth?: (action: () => void, promptMessage: string) => void;
}

export default function HomeSection({
  setCurrentSection,
  onOpenQuickInquiry,
  setSelectedPdfTool,
  setSelectedImageTab,
  currentUser,
  requireAuth
}: HomeSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dynamicSearchItems, setDynamicSearchItems] = useState<{ name: string; section: string; subId: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pdf' | 'resume' | 'typing' | 'image' | 'education' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toolUsages, setToolUsages] = useState<Record<string, number>>({});

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      isAnonymous?: boolean | null;
      tenantId?: string | null;
      providerInfo?: {
        providerId?: string | null;
        email?: string | null;
      }[];
    }
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }

    const path = `users/${currentUser.uid}/favorites`;
    const unsubscribe = onSnapshot(collection(db, 'users', currentUser.uid, 'favorites'), (snapshot) => {
      const toolIds: string[] = [];
      snapshot.forEach((doc) => {
        toolIds.push(doc.id);
      });
      setFavorites(toolIds);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const path = 'tool_usage';
    const unsubscribe = onSnapshot(collection(db, 'tool_usage'), (snapshot) => {
      const usages: Record<string, number> = {};
      snapshot.forEach((doc) => {
        usages[doc.id] = doc.data().useCount || 0;
      });
      setToolUsages(usages);
    }, (error) => {
      console.warn('Could not load tool_usage collection dynamically:', error);
    });

    return () => unsubscribe();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, toolId: string, toolName: string) => {
    e.stopPropagation();
    
    const action = async () => {
      if (!currentUser) return;
      const path = `users/${currentUser.uid}/favorites/${toolId}`;
      const isFav = favorites.includes(toolId);
      try {
        if (isFav) {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'favorites', toolId));
        } else {
          await setDoc(doc(db, 'users', currentUser.uid, 'favorites', toolId), {
            userId: currentUser.uid,
            toolId,
            toolName,
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        handleFirestoreError(err, isFav ? OperationType.DELETE : OperationType.WRITE, path);
      }
    };

    if (requireAuth) {
      requireAuth(action, 'Please log in to star and save your favorite tools for quick access!');
    } else {
      action();
    }
  };

  useEffect(() => {
    const fetchDynamicSearchItems = async () => {
      try {
        const items: { name: string; section: string; subId: string }[] = [];

        // 1. Fetch Class Notes
        try {
          const notesSnap = await getDocs(collection(db, 'class_notes'));
          notesSnap.forEach(doc => {
            const d = doc.data();
            items.push({
              name: `Study Note: ${d.title || ''} (${d.subject || ''})`,
              section: 'notes-syllabus',
              subId: 'notes'
            });
          });
        } catch (e) {
          console.warn('Skipping Class Notes index loading due to restricted access or missing collection:', e);
        }

        // 2. Fetch Ebooks
        try {
          const booksSnap = await getDocs(collection(db, 'ebooks'));
          booksSnap.forEach(doc => {
            const d = doc.data();
            items.push({
              name: `E-Book/Book: ${d.title || ''} (${d.subject || ''})`,
              section: 'notes-syllabus',
              subId: 'books'
            });
          });
        } catch (e) {
          console.warn('Skipping Ebooks index loading due to restricted access or missing collection:', e);
        }

        // 3. Fetch Products
        try {
          const productsSnap = await getDocs(collection(db, 'products'));
          productsSnap.forEach(doc => {
            const d = doc.data();
            items.push({
              name: `Store Item: ${d.name || d.title || ''} - ₹${d.price || 0}`,
              section: 'services-products',
              subId: 'products'
            });
          });
        } catch (e) {
          console.warn('Skipping Products index loading due to restricted access or missing collection:', e);
        }

        // 4. Fetch Services
        try {
          const servicesSnap = await getDocs(collection(db, 'services'));
          servicesSnap.forEach(doc => {
            const d = doc.data();
            items.push({
              name: `Service: ${d.name || ''} - ${d.priceEstimate || 'Custom'}`,
              section: 'services-products',
              subId: 'services'
            });
          });
        } catch (e) {
          console.warn('Skipping Services index loading due to restricted access or missing collection:', e);
        }

        // 5. Fetch Blogs
        try {
          const blogsSnap = await getDocs(collection(db, 'blogs'));
          blogsSnap.forEach(doc => {
            const d = doc.data();
            items.push({
              name: `Blog: ${d.title || ''}`,
              section: 'services-products',
              subId: 'blog'
            });
          });
        } catch (e) {
          console.warn('Skipping Blogs index loading due to restricted access or missing collection:', e);
        }

        setDynamicSearchItems(items);
      } catch (err) {
        console.error('Error fetching search indices:', err);
      }
    };
    fetchDynamicSearchItems();
  }, []);

  const handleToolSelection = async (tool: { id?: string; name: string; section: string; subId?: string }) => {
    if (tool.id) {
      try {
        await setDoc(doc(db, 'tool_usage', tool.id), {
          toolId: tool.id,
          useCount: increment(1),
          lastUsedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Error updating tool usage counter:', err);
      }
    }
    if (tool.section === 'pdf-tools' && setSelectedPdfTool) {
      setSelectedPdfTool(tool.subId || null);
    }
    if (tool.section === 'image-tools' && setSelectedImageTab) {
      setSelectedImageTab((tool.subId as any) || 'merger');
    }
    setCurrentSection(tool.section as Section);
  };

  const allTools = [
    {
      id: 'pdf-merge',
      name: '📄 PDF Merge Suite',
      desc: 'Combine multiple PDF sheets instantly with exact sequence ordering.',
      section: 'pdf-tools',
      subId: 'merge',
      tag: 'POPULAR',
      badgeClass: 'bg-emerald-500 text-white border-emerald-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-emerald-50/10 to-teal-50/10 border-emerald-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100/50 hover:bg-emerald-50/20',
      iconClass: 'text-emerald-600 bg-emerald-100/80 border-emerald-200',
      icon: FileCode
    },
    {
      id: 'pdf-micro',
      name: '🌟 PDF Micro Maker',
      desc: 'Squeeze & merge multiple pages into compact layouts. Best for exam guides & booklets.',
      section: 'pdf-tools',
      subId: 'pdf-micro',
      tag: 'NEW EXAM',
      badgeClass: 'bg-purple-600 text-white border-purple-400 animate-pulse',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-purple-50/10 to-indigo-50/10 border-purple-200 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100/50 hover:bg-purple-50/20',
      iconClass: 'text-purple-600 bg-purple-100/80 border-purple-200',
      icon: FileCode
    },
    {
      id: 'pdf-split',
      name: '✂️ Split & Extract PDF',
      desc: 'Split document pages or pull selected sheets to individual files.',
      section: 'pdf-tools',
      subId: 'split',
      tag: 'UTILITY',
      badgeClass: 'bg-indigo-500 text-white border-indigo-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-indigo-50/10 to-sky-50/10 border-indigo-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100/50 hover:bg-indigo-50/20',
      iconClass: 'text-indigo-600 bg-indigo-100/80 border-indigo-200',
      icon: FileCode
    },
    {
      id: 'pdf-watermark',
      name: '📝 Watermark PDF Seal',
      desc: 'Draw personalized text logos with customizable alpha styling.',
      section: 'pdf-tools',
      subId: 'watermark',
      tag: 'NEW',
      badgeClass: 'bg-rose-500 text-white border-rose-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-rose-50/10 to-pink-50/10 border-rose-200 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-100/50 hover:bg-rose-50/20',
      iconClass: 'text-rose-600 bg-rose-100/80 border-rose-200',
      icon: FileCode
    },
    {
      id: 'pdf-page-numbers',
      name: '🔢 PDF Page Numbers',
      desc: 'Stamp sequence counts in the headers or footers automatically.',
      section: 'pdf-tools',
      subId: 'page-numbers',
      tag: 'USEFUL',
      badgeClass: 'bg-purple-500 text-white border-purple-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-purple-50/10 to-fuchsia-50/10 border-purple-200 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100/50 hover:bg-purple-50/20',
      iconClass: 'text-purple-600 bg-purple-100/80 border-purple-200',
      icon: FileCode
    },
    {
      id: 'resume-builder',
      name: '💼 Sarkari Resume Builder',
      desc: 'Draft structured job resumes with high compliance standard templates.',
      section: 'resume-maker',
      tag: 'RECRUIT',
      badgeClass: 'bg-teal-500 text-white border-teal-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-teal-50/10 to-emerald-50/10 border-teal-200 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-100/50 hover:bg-teal-50/20',
      iconClass: 'text-teal-600 bg-teal-100/80 border-teal-200',
      icon: Briefcase
    },
    {
      id: 'typing-test',
      name: '⌨️ H/E Exam Typing Test',
      desc: 'Test words-per-minute with live Mangal, KrutiDev & English modules.',
      section: 'typing-test',
      tag: 'HOT SPEED',
      badgeClass: 'bg-amber-600 text-white border-amber-500',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-amber-50/10 to-orange-50/10 border-amber-200 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-100/50 hover:bg-amber-50/20',
      iconClass: 'text-amber-600 bg-amber-100/80 border-amber-200',
      icon: Keyboard
    },
    {
      id: 'image-merger',
      name: '📷 Photo & Signature Merger',
      desc: 'Combine identity elements under 50KB to pass government portal checks.',
      section: 'image-tools',
      subId: 'merger',
      tag: 'PORTAL CHK',
      badgeClass: 'bg-pink-500 text-white border-pink-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-pink-50/10 to-fuchsia-50/10 border-pink-200 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-100/50 hover:bg-pink-50/20',
      iconClass: 'text-pink-600 bg-pink-100/80 border-pink-200',
      icon: ImageIcon
    },
    {
      id: 'age-calculator',
      name: '📅 Exam Age Calculator',
      desc: 'Find eligibility parameters against target recruitment cutoff dates.',
      section: 'image-tools',
      subId: 'age',
      tag: 'FORM HELP',
      badgeClass: 'bg-blue-500 text-white border-blue-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-blue-50/10 to-sky-50/10 border-blue-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100/50 hover:bg-blue-50/20',
      iconClass: 'text-blue-600 bg-blue-100/80 border-blue-200',
      icon: Clock
    },
    {
      id: 'bg-remover',
      name: '✂️ Photo Background Clean',
      desc: 'Rerender passport portrait color files into pristine white or blue sheets.',
      section: 'image-tools',
      subId: 'bg-remover',
      tag: 'AI KEYING',
      badgeClass: 'bg-fuchsia-500 text-white border-fuchsia-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-fuchsia-50/10 to-purple-50/10 border-fuchsia-200 hover:border-fuchsia-500 hover:shadow-lg hover:shadow-fuchsia-100/50 hover:bg-fuchsia-50/20',
      iconClass: 'text-fuchsia-600 bg-fuchsia-100/80 border-fuchsia-200',
      icon: ImageIcon
    },
    {
      id: 'study-shelf',
      name: '📚 Study Books & Notes Shelf',
      desc: 'Download formula tables, quantitative aptitude sheets, and GK books.',
      section: 'notes-syllabus',
      tag: 'FREE STUDY',
      badgeClass: 'bg-sky-500 text-white border-sky-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-sky-50/10 to-indigo-50/10 border-sky-200 hover:border-sky-500 hover:shadow-lg hover:shadow-sky-100/50 hover:bg-sky-50/20',
      iconClass: 'text-sky-600 bg-sky-100/80 border-sky-200',
      icon: BookOpen
    },
    {
      id: 'syllabus-chart',
      name: '📊 Syllabus & Recruits Chart',
      desc: 'Detailed breakdown of active paper modules for SSC and Indian Railways.',
      section: 'notes-syllabus',
      tag: 'SYLLABUS',
      badgeClass: 'bg-violet-500 text-white border-violet-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-violet-50/10 to-indigo-50/10 border-violet-200 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-100/50 hover:bg-violet-50/20',
      iconClass: 'text-violet-600 bg-violet-100/80 border-violet-200',
      icon: FileText
    },
    {
      id: 'youtube-academy',
      name: '🎓 Online Youtube Academy',
      desc: 'Free playlist modules designed to help candidates build speed and skills.',
      section: 'notes-syllabus',
      tag: 'LIVE VIDEO',
      badgeClass: 'bg-red-500 text-white border-red-400',
      btnClass: 'hover:-translate-y-1 bg-gradient-to-br from-red-50/10 to-rose-50/10 border-red-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-100/50 hover:bg-red-50/20',
      iconClass: 'text-red-600 bg-red-100/80 border-red-200',
      icon: Youtube
    }
  ];

  // Upgraded comprehensive search list with description metrics and keywords to support all tools
  const searchableUtilities = [
    { name: 'PDF Micro Maker (New 🌟)', desc: 'Squeeze, merge & compress multiple pages into compact vertical/horizontal pocket grids. Perfect for cheat sheets, exams, guides & booklets.', section: 'pdf-tools', subId: 'pdf-micro' },
    { name: 'Merge PDF Suite', desc: 'Combine multiple PDF files easily and organize sheets in exact sequential order.', section: 'pdf-tools', subId: 'merge' },
    { name: 'Split & Extract PDF', desc: 'Break PDF document pages, divide files or pull selected sheets to individual documents.', section: 'pdf-tools', subId: 'split' },
    { name: 'Watermark PDF Seal', desc: 'Stamp customized watermark text, logo overlays and alpha compliance sealing to PDFs.', section: 'pdf-tools', subId: 'watermark' },
    { name: 'PDF Page Numbers', desc: 'Stamp sequential page counts into the headers or footers automatically on PDF documents.', section: 'pdf-tools', subId: 'page-numbers' },
    { name: 'Sarkari Resume Builder', desc: 'Draft highly-compliant job and resume documents with premium professional templates.', section: 'resume-maker', subId: '' },
    { name: 'H/E Exam Typing Test', desc: 'Increase and test typing words-per-minute speed with Krutidev, Mangal, and English test modules with live error reports.', section: 'typing-test', subId: '' },
    { name: 'Photo & Signature Merger', desc: 'Merge photo image and signature file under 50KB for Sarkari exam registration portal compliance.', section: 'image-tools', subId: 'merger' },
    { name: 'Exam Age Calculator', desc: 'Instantly check age and eligibility against critical government recruitment cutoff dates.', section: 'image-tools', subId: 'age' },
    { name: 'Photo Background Clean (AI REMOVER)', desc: 'Remove color background from passport size photos and instantly paint blue/white backgrounds.', section: 'image-tools', subId: 'bg-remover' },
    { name: 'Syllabus & Exam Patterns', desc: 'Detailed breakdown of active recruitment exam patterns for SSC, Railways, State exams.', section: 'notes-syllabus', subId: 'syllabus' },
    { name: 'Class Notes & Mock Tests', desc: 'Syllabus sheets, reference material, class-wise study notes, and PDF model papers.', section: 'notes-syllabus', subId: 'notes' },
    { name: 'Textbooks & Bookshelf', desc: 'Download formula tables, quantitative aptitude sheets, and GK competitive books.', section: 'notes-syllabus', subId: 'books' },
    { name: 'Online Learning Videos', desc: 'Sarkari Academy free academic syllabus playlists and tutorial videos.', section: 'notes-syllabus', subId: 'learning' },
    { name: 'Freelancing Services List', desc: 'Browse technical freelance assistance, custom application design, and typing services.', section: 'services-products', subId: 'services' },
    { name: 'E-Books & Templates Store', desc: 'Purchase premium syllabus guidelines, study booklets, and design templates.', section: 'services-products', subId: 'products' },
    { name: 'Blog & Articles', desc: 'Latest Sarkari news, exam announcements, typing hacks, and daily updates.', section: 'services-products', subId: 'blog' },
  ];

  const combinedSearchable = [...searchableUtilities, ...dynamicSearchItems];

  const filteredSuggestions = searchQuery.trim()
    ? combinedSearchable.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleSuggestionClick = (item: typeof combinedSearchable[0]) => {
    setCurrentSection(item.section as Section);
    setSearchQuery('');
    setShowSuggestions(false);
    // If it has a target sub-section id, we can emit or let index handle scroll
    setTimeout(() => {
      if (item.subId) {
        // Handle nested segment selections in other components via local events or timeouts
        if (item.section === 'services-products') {
          // Put the custom tab event trigger
          window.dispatchEvent(new CustomEvent('change-segment', { detail: item.subId }));
        } else if (item.section === 'notes-syllabus') {
          window.dispatchEvent(new CustomEvent('change-education-tab', { detail: item.subId }));
        }

        const el = document.getElementById(item.subId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const servicesSummary = [
    {
      title: 'Web & Android Development',
      desc: 'Build secure, lightning-fast portals, utility tools, and customized mobile applications.'
    },
    {
      title: 'Competitive Notes & Books',
      desc: 'Access verified general knowledge (GK), reasoning templates, and free syllabus tracking.'
    },
    {
      title: 'Direct PDF & Document Operations',
      desc: 'Professional PDF formatting, high-fidelity compression, protection and watermarking.'
    },
    {
      title: 'Indian Form Photo Sizing',
      desc: 'Merge photo and signatures with verified size constraints for Sarkari Exam uploads.'
    }
  ];

  const noticesList = [
    { title: 'SSC CGL & CHSL 2026 Updated Exams Syllabus Uploaded', date: 'New', badge: 'SYLLABUS' },
    { title: 'New Multi-level Hindi Typing speed modules added (KrutiDev/Mangal)', date: 'June 18', badge: 'TYPING' },
    { title: 'Interactive Resume Maker: 3 New Premium layouts available for free', date: 'June 15', badge: 'UTILITY' },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero & Big Introduction Banner */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20 px-4 rounded-3xl shadow-xl shadow-slate-900/40">
        {/* AI Generated Cyber Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: "url('/src/assets/images/ai_future_bg_1781830424145.jpg')" }}
        ></div>

        {/* Abstract Background Design */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-15%] left-[-5%] w-80 h-80 bg-sky-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4.5 h-4.5 text-indigo-400 animate-spin-slow" />
            Empowering Digital India with Free Tools
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight display-title leading-tight">
            <span className="bg-gradient-to-r from-orange-400 via-slate-100 to-emerald-400 bg-clip-text text-transparent drop-shadow-md">
              Professional AI Free Tool
            </span>
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl font-light text-slate-350 block mt-2">
              & Freelancing Solutions
            </span>
          </h1>

          <p className="text-slate-350 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to <strong className="text-white font-semibold">Digital Hub India</strong>, curated by Santosh Tech. Your single point of contact for custom web applications, student utilities, typing test masterclass, and verified competitive exam class notes.
          </p>

          {/* Core Interactive Search Bar */}
          <div className="max-w-xl mx-auto pt-4 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools: 'typing test', 'merge pdf', 'resume'..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 placeholder-slate-400 outline-none ring-2 ring-indigo-500/30 focus:ring-indigo-500 font-medium text-sm sm:text-base shadow-lg transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5.5 h-5.5 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Suggestions Overlay */}
            {showSuggestions && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 text-left overflow-hidden">
                <div className="bg-slate-50 text-[10px] text-slate-400 px-4 py-2 font-semibold tracking-wider uppercase border-b border-slate-100">
                  Search Results ({filteredSuggestions.length})
                </div>
                {filteredSuggestions.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(item)}
                        className="w-full px-4 py-3 text-slate-700 hover:bg-slate-50 active:bg-slate-100 text-sm font-medium flex items-center justify-between transition-colors"
                      >
                        <span>{item.name}</span>
                        <span className="text-[10px] bg-slate-100 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Go to {item.section.replace('-', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-center text-slate-400 text-sm">
                    No matching utilities found. Try 'PDF', 'Typing', or 'Resume'.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs text-indigo-200">
            <span className="text-slate-400">Popular:</span>
            <button
              onClick={() => handleSuggestionClick({ name: 'Typing Test', section: 'typing-test', subId: '' })}
              className="px-3 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              ⌨️ Typing Speed Test
            </button>
            <button
              onClick={() => handleSuggestionClick({ name: 'Signature Merge', section: 'image-tools', subId: 'merger' })}
              className="px-3 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              📷 Photo/Sig Merger
            </button>
            <button
              onClick={() => handleSuggestionClick({ name: 'Merge PDF', section: 'pdf-tools', subId: 'merge' })}
              className="px-3 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              📄 Merge PDF
            </button>
          </div>
        </div>
      </section>

      {/* DIRECT UTILITIES LAUNCHER GRID (SABHI WORKING UTILITIES ACTIVE LISTING) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="space-y-1 text-left">
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              DIRECT PORTAL ACCESS
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 display-title">
              सारे महत्वपूर्ण टूल्स (Exclusive Utilities Dashboard)
            </h2>
            <p className="text-slate-500 text-xs">
              Click on any styled button launcher card below to immediately load and open the specific diagnostic utility app.
            </p>
          </div>
        </div>

        {/* Category Filter Tabs Bar */}
        <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-wrap gap-2.5 items-center">
          {[
            { id: 'all', label: 'ALL TOOLS (सभी टूल्स)', count: allTools.length, activeStyle: 'bg-indigo-600 text-white shadow-xs shadow-indigo-100 border border-indigo-600', hoverStyle: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80' },
            { id: 'favorites', label: '💖 FAVORITES (पसंदीदा)', count: favorites.length, activeStyle: 'bg-fuchsia-600 text-white shadow-xs shadow-fuchsia-100 border border-fuchsia-600', hoverStyle: 'bg-fuchsia-50/50 hover:bg-fuchsia-100/60 text-fuchsia-700 border border-fuchsia-100' },
            { id: 'pdf', label: 'PDF TOOLS (पीडीएफ)', count: allTools.filter(t => t.section === 'pdf-tools').length, activeStyle: 'bg-rose-600 text-white shadow-xs shadow-rose-100 border border-rose-600', hoverStyle: 'bg-rose-50/50 hover:bg-rose-100/60 text-rose-700 border border-rose-100' },
            { id: 'resume', label: 'RESUME BUILDER (बायोडाटा)', count: allTools.filter(t => t.section === 'resume-maker').length, activeStyle: 'bg-teal-600 text-white shadow-xs shadow-teal-100 border border-teal-600', hoverStyle: 'bg-teal-50/50 hover:bg-teal-100/60 text-teal-850 border border-teal-100' },
            { id: 'typing', label: 'TYPING TEST (टाइपिंग)', count: allTools.filter(t => t.section === 'typing-test').length, activeStyle: 'bg-amber-600 text-white shadow-xs shadow-amber-100 border border-amber-600', hoverStyle: 'bg-amber-50/50 hover:bg-amber-100/60 text-amber-850 border border-amber-100' },
            { id: 'image', label: 'IMAGE TOOLS (इमेज)', count: allTools.filter(t => t.section === 'image-tools').length, activeStyle: 'bg-pink-600 text-white shadow-xs shadow-pink-100 border border-pink-600', hoverStyle: 'bg-pink-50/50 hover:bg-pink-100/60 text-pink-700 border border-pink-100' },
            { id: 'education', label: 'STUDY & SYLLABUS (शिक्षा)', count: allTools.filter(t => t.section === 'notes-syllabus').length, activeStyle: 'bg-sky-600 text-white shadow-xs shadow-sky-100 border border-sky-600', hoverStyle: 'bg-sky-50/50 hover:bg-sky-100/60 text-sky-700 border border-sky-100' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold tracking-tight cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                selectedCategory === cat.id ? cat.activeStyle : cat.hoverStyle
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-205 text-slate-650'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(() => {
            const filteredTools = allTools.filter(tool => {
              if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                return tool.name.toLowerCase().includes(query) || tool.desc.toLowerCase().includes(query);
              }
              if (selectedCategory === 'all') return true;
              if (selectedCategory === 'favorites') return favorites.includes(tool.id);
              if (selectedCategory === 'pdf') return tool.section === 'pdf-tools';
              if (selectedCategory === 'resume') return tool.section === 'resume-maker';
              if (selectedCategory === 'typing') return tool.section === 'typing-test';
              if (selectedCategory === 'image') return tool.section === 'image-tools';
              if (selectedCategory === 'education') return tool.section === 'notes-syllabus';
              return true;
            });

            if (filteredTools.length === 0) {
              return (
                <div className="col-span-full p-10 text-center bg-slate-50/50 rounded-2xl border border-slate-200">
                  <p className="text-slate-500 font-medium text-sm">
                    {selectedCategory === 'favorites' 
                      ? "You haven't added any tools to your favorites yet. Click the ⭐️ on any card to save it!"
                      : `No direct utility tools matched "${searchQuery}"`}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    View All Tools
                  </button>
                </div>
              );
            }

            return filteredTools.map((tool, idx) => {
              const IconComp = tool.icon;
              const isFavorite = favorites.includes(tool.id);
              const usageCount = toolUsages[tool.id] || 0;
              return (
                <div
                  key={idx}
                  onClick={() => handleToolSelection(tool)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToolSelection(tool);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`flex flex-col text-left p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer transition-all duration-300 transform outline-none focus:ring-4 ${tool.btnClass}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-2 rounded-xl border ${tool.iconClass}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {usageCount > 0 && (
                        <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5" title={`Used by members: ${usageCount} times`}>
                          ⚡ {usageCount}
                        </span>
                      )}
                      <button
                        onClick={(e) => toggleFavorite(e, tool.id, tool.name)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isFavorite
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400'
                            : 'bg-white hover:bg-slate-50 text-slate-400 hover:text-amber-500 border-slate-200'
                        }`}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-white' : ''}`} />
                      </button>
                      <span className={`text-[9px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${tool.badgeClass}`}>
                        {tool.tag}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">
                      {tool.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors font-sans">
                    <span>Activate Application</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      {/* 2. dynamic Notice Box Grid & Live Indicators */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
              <Bell className="w-5.5 h-5.5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">STUDENT NOTIFICATION BOX</h2>
              <p className="text-xs text-slate-500">Live news, examination alerts, & class schedule updates</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            LIVE FEEDS
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {noticesList.map((notice, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/75 border border-slate-100 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {notice.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notice.date}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {notice.title}
                </p>
              </div>
              <button
                onClick={() => {
                  if (notice.badge === 'TYPING') setCurrentSection('typing-test');
                  else if (notice.badge === 'SYLLABUS') setCurrentSection('notes-syllabus');
                  else handleSuggestionClick({ name: 'Interactive Resume Maker', section: 'resume-maker', subId: '' });
                }}
                className="mt-4 flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 self-start group"
              >
                Launch Tracker
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. High-Converting Portfolio Statistics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Completed Jobs', count: '1,200+', detail: 'Verified Digital Services', icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Interactive Tools', count: '25+', detail: 'All Working Locally', icon: TrendingUp, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Active Learners', count: '5,000+', detail: 'YouTube / Telegram Fans', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Exam Successes', count: '98.4%', detail: 'Student Testimonial Rate', icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-100' }
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-2">
            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border ${stat.color}`}>
              <stat.icon className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{stat.count}</p>
              <h3 className="text-xs font-bold text-slate-700 tracking-tight uppercase mt-0.5">{stat.label}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{stat.detail}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 4. Professional Services Intro Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight display-title">Core Competencies of Santosh Tech</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            Providing end-to-end fullstack development, competitive learning materials, and document optimizations.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {servicesSummary.map((service, i) => (
            <div key={i} className="p-6 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-4 hover:shadow-md hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold font-mono">
                0{i + 1}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">{service.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Clean, Professional Personal Pitch & Direct Contact CTA */}
      <section className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-1 shadow-lg flex items-center justify-center text-white">
            <div className="w-full h-full rounded-2.5xl bg-slate-900 flex flex-col items-center justify-center p-2 text-center">
              <span className="text-sm font-bold tracking-tight">SANTOSH</span>
              <span className="text-[10px] text-sky-400 tracking-widest font-mono uppercase font-bold mt-1">Tech Founder</span>
            </div>
          </div>
          <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full border-2 border-slate-50 shadow-sm animate-pulse">
            ● ONLINE NOW
          </span>
        </div>

        <div className="space-y-4 flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight display-title">
            Need a Web App, Form Sizing, or custom tool?
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
            My name is Santosh, and I operate DIGITAL HUB INDIA. I help individuals, businesses, and government candidates optimize their documents, create digital solutions, and master typing speed certificates. Reach out directly for project bookings.
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            <a
              href="mailto:SANTOSHTECH45@GMAIL.COM"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-sm transition-all"
            >
              <Mail className="w-4 h-4 text-sky-400" />
              SANTOSHTECH45@GMAIL.COM
            </a>
            <a
              href="tel:8935882550"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all"
            >
              <Phone className="w-4 h-4 text-indigo-600" />
              +91 89358 82550
            </a>
            <a
              href="https://wa.me/918935882550?text=Hello%20Santosh,%20I%20visited%20your%20Digital%20Hub%20India%20website%20and%20want%2520to%20inquire%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              Direct WhatsApp Chat
            </a>
          </div>
        </div>
      </section>

      {/* 6. Quick Interactive FAQ Panel */}
      <section className="bg-indigo-600/5 border border-indigo-100 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
          Frequently Asked Questions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="space-y-1">
            <h4 className="font-semibold text-indigo-950">Are all these tools really free?</h4>
            <p className="text-slate-600 leading-relaxed text-xs">Yes! Digital Hub India is dedicated to helping job candidates and local clients. No registration is required for normal tools like typing tests or PDF merges.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-indigo-950">Is my data secure when using the PDF tools?</h4>
            <p className="text-slate-600 leading-relaxed text-xs">Absolutely. All file processing (including PDF merging, signature merging, and photo background removal) is executed entirely inside your browser on the client-side. We do not store your files on any external server.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
