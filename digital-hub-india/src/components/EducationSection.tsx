import React, { useState, useEffect } from 'react';
import { ClassNote, SyllabusItem, BookItem } from '../types';
import {
  BookOpen,
  Download,
  Search,
  Bookmark,
  Award,
  Video,
  Play,
  CheckCircle,
  Clock,
  Printer,
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileText,
  Lock,
  QrCode,
  Unlock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';

interface EducationSectionProps {
  currentUser?: any;
  requireAuth?: (action: () => void, message: string) => void;
}

export default function EducationSection({ currentUser, requireAuth }: EducationSectionProps = {}) {
  const [educationTab, setEducationTab] = useState<'notes' | 'syllabus' | 'books' | 'learning' | 'subscriptions'>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedNotes, setBookmarkedNotes] = useState<string[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeSyllabusId, setActiveSyllabusId] = useState<string | null>(null);

  useEffect(() => {
    const handleEducationTabChange = (e: Event) => {
      const targetDetail = (e as CustomEvent).detail;
      if (['notes', 'syllabus', 'books', 'learning', 'subscriptions'].includes(targetDetail)) {
        setEducationTab(targetDetail as any);
      }
    };
    window.addEventListener('change-education-tab', handleEducationTabChange);
    return () => window.removeEventListener('change-education-tab', handleEducationTabChange);
  }, []);

  // States for locks
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Subscription state variables
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [selectedPlanOption, setSelectedPlanOption] = useState<string>('silver');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [subscribingStatus, setSubscribingStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');

  // Config loaded dynamically from Firestore admin_settings
  const [upiSettings, setUpiSettings] = useState({
    upiId: 'santoshtech45@okaxis',
    upiQrUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=350',
    paymentMsg: 'After scanning and making a payment, please share the screenshot on WhatsApp 8935882550 to get instant premium access.'
  });

  // Load configuration and custom notes from Firestore
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Load settings
        const setSnap = await getDocs(collection(db, 'admin_settings'));
        if (!setSnap.empty) {
          const docData = setSnap.docs[0].data();
          setUpiSettings({
            upiId: docData.upiId || 'santoshtech45@okaxis',
            upiQrUrl: docData.upiQrUrl || 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=350',
            paymentMsg: docData.paymentMsg || 'After scanning and making a payment, please share the screenshot on WhatsApp 8935882550 to get instant premium access.'
          });
        }

        // Load Dynamic Membership Plans
        try {
          const plansCollection = collection(db, 'membership_plans');
          const plansSnap = await getDocs(plansCollection);
          const loadedPlans: any[] = [];
          plansSnap.forEach(doc => {
            loadedPlans.push({ id: doc.id, ...doc.data() });
          });
          if (loadedPlans.length > 0) {
            setAvailablePlans(loadedPlans);
            setSelectedPlanOption(loadedPlans[0].id);
          } else {
            const defaults = [
              {
                id: 'silver',
                name: 'Silver VIP Pass',
                duration: '1 Month',
                price: 149,
                originalPrice: 299,
                tag: '',
                description: 'Excellent for revisions before scheduled examinations.',
                features: ['All premium class notes unlocked', 'Complete exam syllabus access', 'Ad-Free downloads']
              },
              {
                id: 'gold',
                name: 'Gold Master Pass',
                duration: 'Lifetime Access',
                price: 499,
                originalPrice: 999,
                tag: 'Best Valued',
                description: 'Bypass any future paywalls and get study support forever.',
                features: ['All Notes & E-Books unlocked', 'Exclusive VIP WhatsApp Group Access', 'Lifetime free updates']
              }
            ];
            setAvailablePlans(defaults);
            setSelectedPlanOption('silver');
          }
        } catch (planErr) {
          console.error('Error fetching plans collection:', planErr);
        }

        // Load student subscriptions
        if (currentUser?.email) {
          try {
            const subSnap = await getDocs(collection(db, 'subscriptions_all'));
            const studentSubs: any[] = [];
            subSnap.forEach((doc) => {
              const data = doc.data();
              if (data.studentEmail === currentUser.email) {
                studentSubs.push({ id: doc.id, ...data });
              }
            });
            setUserSubscriptions(studentSubs);
          } catch (subErr) {
            console.error('Error fetching student sub:', subErr);
          }
        }

        // Load custom notes
        const listSnap = await getDocs(query(collection(db, 'class_notes'), orderBy('createdAt', 'desc')));
        const customLoaded: ClassNote[] = [];
        listSnap.forEach((doc) => {
          const d = doc.data();
          customLoaded.push({
            id: doc.id,
            title: d.title,
            subject: d.subject,
            summary: d.summary,
            content: d.content,
            date: d.date || 'Update',
            downloads: d.downloads || 0,
            fileSize: d.fileSize || '1.0 MB',
            readingTime: d.readingTime || '5 mins read',
            isPremium: d.isPremium || false,
            price: d.price || 0,
            fileUrl: d.fileUrl || ''
          } as any);
        });

        if (customLoaded.length > 0) {
          setNotesList(prev => {
            const filteredPrev = prev.filter(p => !customLoaded.map(c => c.id).includes(p.id));
            return [...customLoaded, ...filteredPrev];
          });
        }

        // Load custom ebooks
        try {
          const booksSnap = await getDocs(query(collection(db, 'ebooks'), orderBy('createdAt', 'desc')));
          const customBooks: BookItem[] = [];
          booksSnap.forEach((doc) => {
            const d = doc.data();
            customBooks.push({
              id: doc.id,
              title: d.title || '',
              author: d.author || 'Santosh Kumar',
              subject: d.subject || 'General Knowledge',
              fileSize: d.fileSize || '2.5 MB',
              downloads: d.downloads || 0,
              isPremium: d.isPremium || false,
              price: d.price || 0,
              fileUrl: d.fileUrl || ''
            });
          });
          if (customBooks.length > 0) {
            setBooksList(prev => {
              const filteredPrev = prev.filter(p => !customBooks.map(c => c.id).includes(p.id));
              return [...customBooks, ...filteredPrev];
            });
          }
        } catch (bkErr) {
          console.error('Error fetching ebooks:', bkErr);
        }
      } catch (err) {
        console.error('Error fetching study notes/settings:', err);
      }
    };
    fetchAdminData();
  }, [currentUser]);

  // --- MOCK EDUCATION DATA ---
  const [notesList, setNotesList] = useState<ClassNote[]>([
    {
      id: 'n1',
      title: 'GK Static Notes - Important Indian Dynasties & Founders',
      subject: 'General Knowledge',
      summary: 'Comprehensive static GK revision sheet detailing major ancient and medieval Indian dynasties, their capital cities, and prominent rulers.',
      content: 'Major Dynasties of Ancient India:\n\n1. Maurya Dynasty:\n- Founder: Chandragupta Maurya (322 BC)\n- Capital: Pataliputra (modern Patna)\n- Notable Kings: Ashoka the Great (expanded empire, conversion to Buddhism after Kalinga War)\n\n2. Gupta Dynasty:\n- Founder: Sri Gupta\n- Capital: Pataliputra / Ujjain\n- Notable Kings: Samudragupta (Napoleon of India), Chandragupta II (Vikramaditya)\n- Golden Age of India: Major discoveries in astronomy (Aryabhata) and literature (Kalidasa).\n\n3. Mughal Empire:\n- Founder: Babur (1526 AD, Battle of Panipat)\n- Capital: Agra / Delhi\n- Notable Kings: Akbar, Shah Jahan (built Taj Mahal), Aurangzeb.',
      date: '18 June 2026',
      downloads: 4420,
      fileSize: '1.2 MB',
      readingTime: '5 mins read'
    },
    {
      id: 'n2',
      title: 'Mathematics Short-Tricks - Time & Work Principles',
      subject: 'Mathematics',
      summary: 'Formula sheets and lightning-fast math short-tricks to compute inverse day ratio equations in under 10 seconds.',
      content: 'Time and Work Formula Frameworks:\n\nRule 1: If A does a work in \'x\' days, then A\'s 1 day work = 1/x.\n\nRule 2: If A can do a work in \'x\' days and B can do it in \'y\' days, then both A and B together will do the work in:\n(x * y) / (x + y) days.\n\nExample problem:\nA can complete a piece of online entry work in 10 days and B can do it in 15 days. In how many days can they complete it together?\n\nSolution: (10 * 15) / (10 + 15) = 150 / 25 = 6 days!',
      date: '15 June 2026',
      downloads: 3200,
      fileSize: '850 KB',
      readingTime: '4 mins read'
    },
    {
      id: 'n3',
      title: 'Computer Awareness - MS Office Shortcut cheat sheet',
      subject: 'Computer concepts',
      summary: 'Official Windows and MS Office keyboard shortcut guides required for clerical exam computer checks.',
      content: 'Essential Shortcuts for Word, Excel & Windows:\n\n1. Ctrl + A: Select All text & contents.\n2. Ctrl + S: Save active file layout.\n3. Ctrl + C / V: Copy / Paste selected items.\n4. Ctrl + H: Replace text values dialog.\n5. F7: Launch spell check algorithms.\n6. Ctrl + Shift + Space: Insert non-breaking spaces.',
      date: '10 June 2026',
      downloads: 5100,
      fileSize: '620 KB',
      readingTime: '3 mins read'
    }
  ]);

  const [booksList, setBooksList] = useState<BookItem[]>([
    { id: 'b1', title: 'Static GK Ultimate Blueprint 2026', author: 'Santosh Kumar', subject: 'General Knowledge', fileSize: '12.4 MB', downloads: 12500, isPremium: false },
    { id: 'b2', title: 'Quantitative Aptitude Formula Vault', author: 'Digital Hub India', subject: 'Mathematics', fileSize: '8.2 MB', downloads: 8900, isPremium: false },
    { id: 'b3', title: 'Speed Typing Master Handbook (Hindi/Eng)', author: 'Santosh Tech', subject: 'Typing Guide', fileSize: '4.1 MB', downloads: 14200, isPremium: true, price: 49 }
  ]);

  const [syllabusList] = useState<SyllabusItem[]>([
    {
      id: 's1',
      title: 'Syllabus: SSC CHSL (Clerk Grade) 2026 Exam',
      examType: 'SSC CGL/CHSL',
      totalMarks: 200,
      duration: '60 minutes',
      negativeMarking: '0.50 Marks per wrong answer',
      sections: [
        { name: 'General Intelligence (Reasoning)', questions: 25, marks: 50, topics: ['Verbal classification', 'Analogies', 'Venn Diagrams', 'Spatial visualization'] },
        { name: 'Quantitative Aptitude (Mathematics)', questions: 25, marks: 50, topics: ['Algebra', 'Geometry', 'Data Interpretation', 'Trigonometry', 'Percentage'] },
        { name: 'English Comprehension', questions: 25, marks: 50, topics: ['Active & Passive Voice', 'Direct/Indirect Narration', 'Error spotting', 'Cloze test'] },
        { name: 'General Awareness (GK)', questions: 25, marks: 50, topics: ['Current Events', 'Static History', 'Polity', 'Basic Physics & Chemistry'] }
      ]
    },
    {
      id: 's2',
      title: 'Syllabus: Railway NTPC & Group D Recruitment 2026',
      examType: 'RRB Railways',
      totalMarks: 100,
      duration: '90 minutes',
      negativeMarking: '0.33 Marks per wrong answer',
      sections: [
        { name: 'General Awareness & Science', questions: 40, marks: 40, topics: ['Sports awards', 'Indian culture', 'Life sciences 10th level', 'History'] },
        { name: 'Mathematics', questions: 30, marks: 30, topics: ['Lcm Hcf', 'Decimals', 'Fractional math', 'Profit Loss'] },
        { name: 'General Intelligence & Reasoning', questions: 30, marks: 30, topics: ['Coding decoding', 'Syllogism', 'Blood relations', 'Puzzles'] }
      ]
    }
  ]);

  // --- ONLINE LEARNING STATE & YouTube linkage ---
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const videoAcademy = [
    {
      title: '[Hindi Class] How to type 50+ WPM in Hindi (Mangal Unicode/KrutiDev)',
      duration: '18:45',
      summary: 'Step-by-step masterclass by Santosh showing proper finger rows alignment, visual map coordinates, and daily errors recovery routines.',
      youtubeLink: 'https://youtube.com/@santoh8988'
    },
    {
      title: 'SSC CHSL Typing Exam Parameters & Real-Time Setup Explained',
      duration: '12:10',
      summary: 'Guidance explaining exact SSC CHSL backspace usage codes, net word speed count calculations, and mock keyboard trials.',
      youtubeLink: 'https://youtube.com/@santoh8988'
    },
    {
      title: 'Photo & Signature resizing to exactly under 50KB for Government Jobs',
      duration: '8:30',
      summary: 'Tutorial on utilizing Digital Hub India merger tool to resize and bundle JPEG applications flawlessly.',
      youtubeLink: 'https://youtube.com/@santoh8988'
    }
  ];

  const handleDownloadFile = (fileName: string, fileUrl?: string, fileContent?: string) => {
    confetti({ particleCount: 30, spread: 40 });
    if (fileUrl && fileUrl.trim().startsWith('http')) {
      window.open(fileUrl.trim(), '_blank');
      return;
    }
    if (fileContent) {
      // Generate immediate text download of content as physical fallback
      const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.md') ? fileName : fileName.replace('.pdf', '.md');
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    alert(`Starting download of document: "${fileName}". Safe transfer active!`);
  };

  const handleBookmarkToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedNotes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredNotes = notesList.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (requireAuth) {
        requireAuth(() => {}, 'Please sign in to register your VIP subscription.');
      } else {
        alert('Please sign in / sign up at the top menu first!');
      }
      return;
    }
    if (!subName.trim() || !subPhone.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setSubscribingStatus('processing');
      
      const chosenPlan = availablePlans.find(p => p.id === selectedPlanOption) || availablePlans[0] || {
        name: 'Silver VIP Pass',
        price: 149,
        duration: '1 Month'
      };
      const chosenPlanName = `${chosenPlan.name} (${chosenPlan.duration})`;
      const chosenPrice = chosenPlan.price;

      await addDoc(collection(db, 'subscriptions_all'), {
        studentName: subName.trim(),
        studentPhone: subPhone.trim(),
        studentEmail: currentUser.email,
        price: chosenPrice,
        planName: chosenPlanName,
        createdAt: new Date().toISOString(),
        status: 'Pending Review',
        uid: currentUser.uid
      });

      confetti({ particleCount: 50, spread: 40 });
      setSubscribingStatus('success');

      // Reload list dynamically
      const subSnap = await getDocs(collection(db, 'subscriptions_all'));
      const studentSubs: any[] = [];
      subSnap.forEach((doc) => {
        const data = doc.data();
        if (data.studentEmail === currentUser.email) {
          studentSubs.push({ id: doc.id, ...data });
        }
      });
      setUserSubscriptions(studentSubs);
    } catch (err) {
      console.error(err);
      alert('Error recording subscription logs. Check Firestore connection.');
    }
  };

  const activePlanObj = availablePlans.find(p => p.id === selectedPlanOption) || availablePlans[0] || {
    name: 'Silver VIP Pass',
    price: 149,
    duration: '1 Month'
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Visual Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="space-y-1">
          <span className="text-[10px] bg-sky-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            ACADEMIC STUDY CENTER
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 display-title">
            Notes, Books & Exam Syllabus
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Access free curriculum notes, download essential exam guides, read competitive syllabus outlines, and play computer learning content.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-xl self-start md:self-center">
          {[
            { id: 'notes', label: 'Class Notes' },
            { id: 'syllabus', label: 'Syllabus' },
            { id: 'books', label: 'E-Books Shelf' },
            { id: 'subscriptions', label: 'VIP Pass 👑' },
            { id: 'learning', label: 'Online Academy' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setEducationTab(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                educationTab === item.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB 1: CLASS NOTES CENTER --- */}
      {educationTab === 'notes' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search GK, Math, Computer notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* List notes */}
            <div className="space-y-3 max-h-120 overflow-y-auto pr-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => { setActiveNoteId(note.id); window.scrollTo({ top: 120, behavior: 'smooth' }); }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    activeNoteId === note.id
                      ? 'bg-indigo-50/50 border-indigo-400 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[9px] font-extrabold tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono uppercase">
                        {note.subject}
                      </span>
                      {note.isPremium ? (
                        <span className="text-[8px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold font-mono">
                          🔒 ₹{note.price || 49}
                        </span>
                      ) : (
                        <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono">
                          🆓 FREE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleBookmarkToggle(note.id, e)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarkedNotes.includes(note.id) ? 'text-rose-500 fill-current' : ''}`} />
                    </button>
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 mt-2 truncate leading-tight">
                    {note.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {note.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 font-mono">
                    <span>{note.readingTime}</span>
                    <span>•</span>
                    <span>{note.downloads} reads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reading panel */}
          <div className="lg:col-span-8">
            {activeNoteId ? (
              (() => {
                const note = notesList.find(n => n.id === activeNoteId);
                if (!note) return null;
                const isPremiumLocked = note.isPremium && !unlockedItems.includes(note.id);
                
                if (isPremiumLocked) {
                  return (
                    <div className="bg-white border p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
                      <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                        <div>
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 uppercase font-mono">
                            <Lock className="w-3 h-3 text-rose-600" />
                            PREMIUM LOCKED STUDY SHEET
                          </span>
                          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5 leading-snug">
                            {note.title}
                          </h2>
                        </div>
                        <span className="text-sm font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl font-mono shrink-0">
                          Price: ₹ {note.price || 49}
                        </span>
                      </div>

                      {/* Premium Scan Payment Gateway Interface */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-6 text-left font-medium text-xs text-slate-700">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                          <div className="bg-white p-3 rounded-2xl border shadow-sm shrink-0 flex flex-col items-center">
                            <img src={upiSettings.upiQrUrl} alt="UPI QR Scanner" className="w-32 h-32 object-cover rounded-xl border" />
                            <span className="text-[10px] font-extrabold text-slate-400 mt-2 font-mono flex items-center gap-1">
                              <QrCode className="w-3 h-3 text-slate-400" />
                              SCAN & PAY
                            </span>
                          </div>
                          <div className="space-y-3 flex-1 leading-relaxed">
                            <div className="space-y-0.5">
                              <span className="text-[9px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase font-mono">Recipient UPI ID:</span>
                              <p className="text-xs sm:text-sm font-bold font-mono text-slate-800">{upiSettings.upiId}</p>
                            </div>
                            <p className="text-slate-500 font-normal">
                              {upiSettings.paymentMsg}
                            </p>
                            <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100/80 flex items-start gap-2 text-[11px]">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <span>This material requires a premium unlock. You can test this flow instantly by typing your details and clicking <strong>"Submit Verification & Unlock"</strong>.</span>
                            </div>
                          </div>
                        </div>

                        {/* Student validation inputs */}
                        <div className="border-t pt-4 space-y-3">
                          <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Fast-Validation Verification form</p>
                          <div className="grid sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="text-slate-600 block">Your Full Name *</label>
                              <input
                                type="text"
                                id="payment-student-name"
                                defaultValue={currentUser?.displayName || ""}
                                placeholder="Enter your full name"
                                className="w-full px-3.5 py-2.5 bg-white border rounded-xl"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-600 block">Your Contact Mobile/WhatsApp *</label>
                              <input
                                type="text"
                                id="payment-student-phone"
                                defaultValue={currentUser?.phone || ""}
                                placeholder="Enter mobile number"
                                className="w-full px-3.5 py-2.5 bg-white border rounded-xl"
                              />
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                setSubmittingInquiry(true);
                                const nameVal = (document.getElementById("payment-student-name") as HTMLInputElement)?.value;
                                const phoneVal = (document.getElementById("payment-student-phone") as HTMLInputElement)?.value;
                                if (!nameVal || !phoneVal) {
                                  alert("Please fill your Name and Mobile Number for validation.");
                                  setSubmittingInquiry(false);
                                  return;
                                }

                                const msg = `I scanned the QR code of ₹${note.price || 49} to unlock study note: "${note.title}". Please verify and authorize access!`;
                                await addDoc(collection(db, "inquiries_all"), {
                                  clientName: nameVal,
                                  clientPhone: phoneVal,
                                  clientEmail: currentUser?.email || "guest@student.hub",
                                  service: `Dynamic Classroom Unlock`,
                                  message: msg,
                                  createdAt: new Date().toISOString()
                                });

                                setUnlockedItems(prev => [...prev, note.id]);
                                confetti({ particleCount: 80, spread: 50 });
                                alert(`Awesome! Unlock authorized. Your screenshot details have been logged in the Real-Time Inquiries list!`);
                              } catch (e) {
                                console.error(e);
                                setUnlockedItems(prev => [...prev, note.id]);
                              } finally {
                                setSubmittingInquiry(false);
                              }
                            }}
                            disabled={submittingInquiry}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>{submittingInquiry ? "Connecting dynamic database secure portal..." : "Submit Verification & Unlock"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-white border p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200 print-card text-left">
                    <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        {note.isPremium ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PREMIUM UNLOCKED
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 uppercase font-mono">
                            {note.subject}
                          </span>
                        )}
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5 leading-snug">
                          {note.title}
                        </h2>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => window.print()}
                          className="p-2 bg-slate-50 border rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Print Note Sheet"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(`${note.title.substring(0, 15).replace(/\s+/g, '_')}_ClassNotes.pdf`, note.fileUrl, note.content)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Save PDF
                        </button>
                      </div>
                    </div>

                    {/* Pre-formatted Note content */}
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      {note.content}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t pt-4">
                      <span>Subject specialist evaluation: Santosh</span>
                      <span>Modified: {note.date}</span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-12 text-center text-slate-400 text-sm flex flex-col justify-center h-full">
                Select a class study note card from the sidebar list to load full course material layouts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: EXAM SYLLABUS ANALYZER --- */}
      {educationTab === 'syllabus' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest px-1">Selected Vacancies</h3>
            <div className="space-y-2">
              {syllabusList.map((syl) => (
                <div
                  key={syl.id}
                  onClick={() => { setActiveSyllabusId(syl.id); }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    activeSyllabusId === syl.id
                      ? 'bg-indigo-50 border-indigo-400'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[9px] font-extrabold tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase font-mono">
                    {syl.examType}
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 mt-2">
                    {syl.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Time: {syl.duration} ∙ {syl.totalMarks} Marks</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeSyllabusId ? (
              (() => {
                const syl = syllabusList.find(s => s.id === activeSyllabusId);
                if (!syl) return null;
                return (
                  <div className="bg-white border p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="border-b pb-4 flex justify-between items-baseline gap-2">
                      <div>
                        <span className="text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase font-mono">
                          {syl.examType}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900 mt-2">{syl.title}</h2>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 shrink-0">
                        {syl.negativeMarking}
                      </span>
                    </div>

                    {/* Section table */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Sectional Marks Distribution</h3>
                      <div className="divide-y divide-slate-100 bg-slate-50/50 p-4 rounded-2xl border">
                        {syl.sections.map((sec, id) => (
                          <div key={id} className="py-3 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-slate-800">{sec.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Topics: {sec.topics.join(', ')}</p>
                            </div>
                            <div className="text-right font-mono font-bold text-slate-700 bg-white border px-3 py-1 rounded-lg shrink-0">
                              {sec.questions} Q ∙ {sec.marks} M
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-12 text-center text-slate-400 text-sm flex flex-col justify-center h-full">
                Choose an exam syllabus syllabus card on the left to review distribution and topic weights.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: BOOK DOWNLOAD CENTER --- */}
      {educationTab === 'books' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {booksList.map((book) => {
            const hasVipAccess = userSubscriptions.some(s => s.status === 'Approved');
            const needsPurchase = book.isPremium && !hasVipAccess;
            return (
              <div
                key={book.id}
                className={`p-5 bg-white border rounded-2xl flex flex-col justify-between hover:shadow-md transition-all ${
                  needsPurchase ? 'border-amber-200 bg-amber-50/5' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border">
                      {book.subject}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-slate-400 font-bold">
                      {book.isPremium && (
                        <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded ${
                          hasVipAccess ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs' : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs'
                        }`}>
                          {hasVipAccess ? '👑 VIP ACTIVE' : '🔒 VIP PASS'}
                        </span>
                      )}
                      <span>{book.fileSize}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 leading-snug">{book.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Author/Publisher: {book.author}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-semibold">
                    {book.downloads.toLocaleString('en-IN')} downloads
                  </span>
                  {needsPurchase ? (
                    <button
                      onClick={() => {
                        setEducationTab('subscriptions');
                        setSelectedPlanOption('gold');
                        setTimeout(() => {
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }, 200);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-[10px] font-extrabold rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      Get VIP Pass
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownloadFile(`${book.title.replace(/\s+/g, '_')}_SarkariNotes.pdf`, book.fileUrl)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 4: ONLINE CLASSROOM ACADEMY --- */}
      {educationTab === 'learning' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {/* Simulated YouTube Video Player frame */}
            <div className="bg-slate-950 aspect-video rounded-3xl border border-slate-800 overflow-hidden relative group flex items-center justify-center text-white">
              <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold z-10 flex items-center gap-1 text-sky-400">
                <Video className="w-4 h-4" />
                <span>Simulated Playback console</span>
              </div>

              <div className="text-center p-6 space-y-4 relative z-10">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center mx-auto text-white shadow-lg font-bold shadow-red-650/40 cursor-pointer hover:scale-105 active:scale-95 transition-transform">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{videoAcademy[activeVideoIndex].title}</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 font-light">{videoAcademy[activeVideoIndex].summary}</p>
                </div>
              </div>

              {/* YouTube Link action */}
              <div className="absolute bottom-4 right-4 z-10">
                <a
                  href={videoAcademy[activeVideoIndex].youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Visit Channel
                </a>
              </div>
            </div>
          </div>

          {/* Playlist list */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest px-1">YouTube prep channels</h3>
            <div className="space-y-2.5">
              {videoAcademy.map((vid, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveVideoIndex(idx)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    activeVideoIndex === idx
                      ? 'bg-indigo-50/70 border-indigo-300'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-[10px] font-mono font-bold text-indigo-600">Video Lesson {idx + 1} ({vid.duration})</p>
                  <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 mt-1">{vid.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: MEMBERSHIP & SUBSCRIPTIONS PASS --- */}
      {educationTab === 'subscriptions' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-305">
          
          {/* Aesthetic Promotion Hero */}
          <div className="relative bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 rounded-4xl p-6 sm:p-10 text-white overflow-hidden shadow-xl border border-indigo-850">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-sky-500/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-extrabold select-none">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span>GOLDEN TICKET TO UNLIMITED EXAMP PREP</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight display-title leading-tight">
                Unlock All Premium E-Books, Notes & Mock Guides
              </h2>
              <p className="text-indigo-100/90 text-xs sm:text-sm leading-relaxed max-w-lg font-medium">
                Subscribe to our premium VIP student circles to bypass all content locks instantly. Subscriptions directly support high-quality education translation and formatting. Let's study smarter together.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-[10px] sm:text-xs font-bold text-indigo-200">
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Downloads</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Daily Class Sync</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp VIP Circle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current VIP Status card for logged in user */}
          {currentUser ? (
            <div className="p-5 sm:p-6 bg-white border rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm border-indigo-100 text-left">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">My Account Status</p>
                <h3 className="text-sm font-extrabold text-slate-800">{currentUser.displayName || 'Candidate'} ({currentUser.email})</h3>
                {userSubscriptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {userSubscriptions.map((sub, i) => (
                      <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg font-semibold border ${
                        sub.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-250 font-extrabold'
                          : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-extrabold'
                      }`}>
                        <span>Plan: <strong>{sub.planName}</strong></span>
                        <span className="opacity-40">•</span>
                        <span>Status: <strong className="uppercase">{sub.status || 'Pending Review'}</strong></span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rose-500 font-bold pt-1">❌ No active subscription found for this account. Select a plan below to activate.</p>
                )}
              </div>
              {userSubscriptions.some(s => s.status === 'Approved') && (
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-750 rounded-2xl flex items-center gap-2 text-xs font-bold self-start sm:self-center">
                  <Unlock className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span>Master Access & VIP Perks Activated!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 bg-amber-50/70 border border-amber-100 rounded-3xl text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-3xs">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">🔒 Student Identity Verification Required</h4>
                <p className="text-xs text-slate-500 max-w-lg font-medium leading-normal">
                  To register payments, dynamic receipts, and monitor approval status, you must be logged into SarkariHub. Please sign in or register in 5 seconds!
                </p>
              </div>
              <p className="text-xs text-indigo-700 font-black tracking-tight uppercase hover:underline">
                Use top header menu to Sign In
              </p>
            </div>
          )}

          {/* Plan Choice and Layout */}
          <div className="grid lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* Plans List Left Column (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest px-1">1. Choose Subscription Duration</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlanOption === plan.id;
                  const isGoldStyle = plan.tag?.toLowerCase().includes('valued') || plan.name?.toLowerCase().includes('gold') || plan.name?.toLowerCase().includes('master') || plan.name?.toLowerCase().includes('diamond') || plan.name?.toLowerCase().includes('lifetime');
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlanOption(plan.id);
                        if(subscribingStatus === 'success') setSubscribingStatus('idle');
                      }}
                      className={`p-6 rounded-3xl border text-left cursor-pointer transition-all space-y-4 relative overflow-hidden ${
                        isSelected
                          ? isGoldStyle
                            ? 'bg-gradient-to-br from-amber-50/65 to-white border-amber-400 ring-2 ring-amber-400 shadow-md'
                            : 'bg-gradient-to-br from-indigo-50/65 to-white border-indigo-400 ring-2 ring-indigo-400 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-350 shadow-2xs'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-6 -mt-6"></div>
                      )}
                      {plan.tag && (
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[8px] uppercase tracking-wide shadow-xs ${
                            isGoldStyle ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' : 'bg-slate-100 border text-slate-650'
                          }`}>
                            {plan.tag}
                          </span>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-slate-100 border text-slate-650 rounded-md font-bold text-[9px] uppercase tracking-wider font-mono">
                          {plan.duration}
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 pt-1 leading-snug">{plan.name}</h4>
                        <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">{plan.description}</p>
                      </div>

                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="text-2xl font-black text-slate-900">₹{plan.price}</span>
                        {plan.originalPrice > plan.price && (
                          <>
                            <span className="text-slate-400 text-xs line-through font-medium">₹{plan.originalPrice}</span>
                            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md ml-2 border border-indigo-100">
                              Save {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                            </span>
                          </>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-650">
                        {plan.features?.map((feature: string, i: number) => (
                          <p key={i} className="flex items-center gap-1.5 font-medium leading-relaxed">
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isGoldStyle ? 'text-amber-500' : 'text-indigo-500'}`} />
                            <span>{feature}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-50 border rounded-2xl flex items-start gap-3 text-xs leading-normal font-medium text-slate-500">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  * Note: All transactions are processed using a manual UPI transaction ledger verification process. This ensures maximum safety, cost transparency, and lets us transfer files directly via WhatsApp support lines. Thank you for your cooperation!
                </p>
              </div>

            </div>

            {/* Checkout Gate Column (Span 5) */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/85 shadow-sm space-y-6">
              
              <div className="flex items-center gap-1.5 border-b pb-3">
                <QrCode className="w-4.5 h-4.5 text-indigo-650" />
                <h4 className="font-extrabold text-sm text-slate-950">2. Instant Scan Checkout Setup</h4>
              </div>

              {subscribingStatus === 'success' ? (
                <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-extrabold text-sm text-slate-900 text-left">Subscription Registered!</h5>
                    <p className="text-xs text-slate-450 leading-relaxed text-left font-medium">
                      We have successfully registered your payment request for the <strong className="text-indigo-600 font-extrabold">{activePlanObj.name} ({activePlanObj.duration})</strong>.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-850 text-[11px] rounded-xl text-left space-y-2.5 font-medium leading-relaxed shadow-3xs">
                    <p className="font-extrabold">🚀 Next Steps to Live Activation:</p>
                    <p>1. Please share a screenshot of your successful UPI transfer on WhatsApp: <strong className="text-emerald-700 font-black">8935882550</strong>.</p>
                    <p>2. Our admin will instantly cross-reference the reference log and mark your status as Approved in the database.</p>
                  </div>

                  <button
                    onClick={() => {
                      setSubscribingStatus('idle');
                      setSubName('');
                      setSubPhone('');
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Register Another Payment
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs font-semibold text-slate-650 text-left">
                  
                  {/* Select Plan Preview Badge */}
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center text-indigo-900 select-none">
                    <div>
                      <p className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-widest font-mono">Active Choice:</p>
                      <h5 className="text-[11px] font-extrabold text-indigo-950 mt-0.5">{activePlanObj.name} ({activePlanObj.duration})</h5>
                    </div>
                    <span className="font-mono text-base font-black text-indigo-850">₹{activePlanObj.price}</span>
                  </div>

                  {/* QR Scan Display Container */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center space-y-3">
                    <img src={upiSettings.upiQrUrl} className="mx-auto w-36 h-36 object-cover border-2 border-white bg-white rounded-xl shadow-xs" alt="SarkariHub QR Scan" />
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">SarkariHub VPA Gateway</p>
                      <p className="text-[11.5px] font-mono font-extrabold text-slate-800">{upiSettings.upiId}</p>
                    </div>
                    <p className="text-[10px] text-slate-450 max-w-xs mx-auto leading-relaxed italic font-semibold">
                      Scan the barcode above to pay ₹{activePlanObj.price} using any UPI App (GPay, PhonePe, Paytm).
                    </p>
                  </div>

                  {/* Form input fields */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-slate-750 block font-extrabold">Student / Candidate Full Name *</label>
                      <input
                        type="text"
                        required
                        value={subName}
                        onChange={e => setSubName(e.target.value)}
                        placeholder="Enter full name for receipt logs"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:bg-white transition-all font-medium text-slate-800 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-755 block font-extrabold">WhatsApp Phone Number *</label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        value={subPhone}
                        onChange={e => setSubPhone(e.target.value)}
                        placeholder="10-digit mobile number for support"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:bg-white transition-all font-mono font-medium text-slate-805 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Prompt if details are missing */}
                  <div className="text-[10px] text-slate-500 font-medium leading-normal bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    {upiSettings.paymentMsg}
                  </div>

                  <button
                    type="submit"
                    disabled={subscribingStatus === 'processing'}
                    className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase tracking-wide"
                  >
                    {subscribingStatus === 'processing' ? 'Submitting Receipt...' : 'Confirm UPI Scan & Register'}
                  </button>

                  {!currentUser && (
                    <p className="text-[9.5px] text-rose-500 font-extrabold text-center leading-normal">
                      * Please click on the "Sign In" button in the navigation header to register/sign in before submitting!
                    </p>
                  )}

                </form>
              )}

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
