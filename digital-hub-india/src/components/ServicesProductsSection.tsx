import React, { useState, useEffect } from 'react';
import { PortfolioService, ProductItem, BlogPost } from '../types';
import {
  Briefcase,
  Layers,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Trash2,
  Mail,
  Heart,
  MessageCircle,
  Clock,
  Eye,
  ArrowRight,
  Phone,
  CheckCircle2,
  Bell,
  QrCode,
  AlertCircle,
  Unlock,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

interface ServicesProductsSectionProps {
  onOpenQuickInquiry: () => void;
  openInquiryWithService?: (serviceName: string) => void;
  currentUser?: any;
}

export default function ServicesProductsSection({
  onOpenQuickInquiry,
  openInquiryWithService,
  currentUser
}: ServicesProductsSectionProps) {
  const [activeSegment, setActiveSegment] = useState<'services' | 'products' | 'blog'>('services');
  const [loadingProds, setLoadingProds] = useState(false);
  const [dbProducts, setDbProducts] = useState<ProductItem[]>([]);
  const [dbServices, setDbServices] = useState<PortfolioService[]>([]);
  const [dbBlogs, setDbBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    const handleSegmentChange = (e: Event) => {
      const targetDetail = (e as CustomEvent).detail;
      if (targetDetail === 'services' || targetDetail === 'products' || targetDetail === 'blog') {
        setActiveSegment(targetDetail);
      }
    };
    window.addEventListener('change-segment', handleSegmentChange);
    return () => window.removeEventListener('change-segment', handleSegmentChange);
  }, []);
  
  // UPI QR settings fetched dynamically
  const [upiSettings, setUpiSettings] = useState({
    upiId: 'santoshtech45@okaxis',
    upiQrUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=350',
    paymentMsg: 'After scanning and making a payment, please share the screenshot on WhatsApp 8935882550 to get instant premium access.'
  });

  // Load custom products & settings from Firestore
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoadingProds(true);
        // Load settings
        const settingsSnap = await getDocs(collection(db, 'admin_settings'));
        if (!settingsSnap.empty) {
          const docData = settingsSnap.docs[0].data();
          setUpiSettings({
            upiId: docData.upiId || 'santoshtech45@okaxis',
            upiQrUrl: docData.upiQrUrl || 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=350',
            paymentMsg: docData.paymentMsg || 'After scanning and making a payment, please share the screenshot on WhatsApp 8935882550 to get instant premium access.'
          });
        }

        // Load custom products
        const prodSnap = await getDocs(collection(db, 'products'));
        const loaded: ProductItem[] = [];
        prodSnap.forEach((doc) => {
          const d = doc.data();
          loaded.push({
            id: doc.id,
            name: d.name,
            category: d.category || 'ebook',
            price: Number(d.price || 0),
            originalPrice: Number(d.originalPrice || 0),
            description: d.description || '',
            image: d.image || '',
            rating: d.rating || 4.9,
            features: d.features || []
          });
        });
        setDbProducts(loaded);

        // Load custom services
        const servSnap = await getDocs(collection(db, 'services'));
        const loadedServices: PortfolioService[] = [];
        servSnap.forEach((doc) => {
          const d = doc.data();
          loadedServices.push({
            id: doc.id,
            name: d.name,
            description: d.description || '',
            priceEstimate: d.priceEstimate || 'From ₹499',
            deliveryTime: d.deliveryTime || '2-3 Days',
            iconName: d.iconName || 'Briefcase',
            features: d.features || d.bullets || []
          });
        });
        setDbServices(loadedServices);

        // Load custom blogs
        const blogSnap = await getDocs(collection(db, 'blogs'));
        const loadedBlogs: BlogPost[] = [];
        blogSnap.forEach((doc) => {
          const d = doc.data();
          loadedBlogs.push({
            id: doc.id,
            title: d.title || '',
            summary: d.summary || '',
            content: d.content || '',
            category: d.category || 'tech',
            date: d.date || 'Today',
            reads: Number(d.reads || 0),
            likes: Number(d.likes || 0),
            comments: d.comments || [],
            image: d.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=350'
          });
        });
        setDbBlogs(loadedBlogs);
        if (loadedBlogs.length > 0) {
          setBlogs(prev => {
            const combined = [...loadedBlogs];
            prev.forEach(p => {
              if (!combined.some(c => c.id === p.id || c.title.toLowerCase() === p.title.toLowerCase())) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      } catch (err) {
        console.error('Error fetching dynamic store items:', err);
      } finally {
        setLoadingProds(false);
      }
    };
    fetchStoreData();
  }, []);

  // --- 1. Portfolio Services ---
  const staticServicesList: PortfolioService[] = [
    {
      id: 's1',
      name: 'Custom Web & App Dev',
      description: 'Craft beautiful, high-efficiency portals, tools, and portfolios for your local businesses.',
      priceEstimate: 'From ₹9,999',
      deliveryTime: '7 - 15 Days',
      iconName: 'web',
      features: ['Modern React architecture', 'Stripe/UPI integration', '100% Mobile responsive', 'SEO keyword structures']
    },
    {
      id: 's2',
      name: 'SSC / Gov Office Photo Size Correction',
      description: 'Resize, align, and format applicant credentials to upload safely without system rejections.',
      priceEstimate: 'From ₹49',
      deliveryTime: 'Same Day',
      iconName: 'photo',
      features: ['SSC, UPSC, Banking compliance', 'Combined photo signature sheets', 'RGB correction', 'Specific file weight sizing']
    },
    {
      id: 's3',
      name: 'Premium Resume & CV Writing',
      description: 'Convert plain summaries into executive, high-impact resume sheets optimized for recruiter scans.',
      priceEstimate: 'From ₹499',
      deliveryTime: '24 Hours',
      iconName: 'resume',
      features: ['2 ATS compilations available', 'Modern & minimalist versions included', 'PDF/MS Word original delivery']
    }
  ];

  const servicesList = [...dbServices, ...staticServicesList];

  // --- 2. Interactive Products Store ---
  const initialProducts: ProductItem[] = [
    { id: 'p1', name: 'Static General Knowledge formula booklet', category: 'ebook', price: 99, originalPrice: 199, description: 'Quick-revision formula sheets focusing on historical, geographical, and civic milestones regularly asked in Indian tests.', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=350', rating: 4.8, features: ['150 Static GK topics', 'Includes maps tracker', 'High resolution printable PDF format'] },
    { id: 'p2', name: 'CHSL/CGL Math Formulas cheat sheet', category: 'ebook', price: 149, originalPrice: 299, description: 'Formulas and shortcuts for geometry, algebra, and inverse trigonometry compiled for rapid reference.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=350', rating: 4.9, features: ['25 Shortcut theorems', 'Step-by-step example problem sheets'] },
    { id: 'p3', name: 'Speed Typing Master Handbook', category: 'template', price: 49, originalPrice: 99, description: 'Training guide for Hindi Krutidev/Mangal key alignments, reducing errors and pacing speeds quickly.', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=350', rating: 4.7, features: ['English home-row metrics', 'Hindi Mangal characters guide'] }
  ];

  const products = [...dbProducts, ...initialProducts];
  const [storeCart, setStoreCart] = useState<ProductItem[]>([]);
  const [showCartOverlay, setShowCartOverlay] = useState(false);
  
  // Checkout stage states
  const [checkoutMode, setCheckoutMode] = useState<'cart' | 'payment'>('cart');
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [purchaseName, setPurchaseName] = useState('');
  const [purchasePhone, setPurchasePhone] = useState('');

  // --- 3. Interactive Blogs Center ---
  const [blogs, setBlogs] = useState<BlogPost[]>([
    {
      id: 'b1',
      title: 'How to double your Typing Speed inside 14 Days',
      summary: 'Secret technical exercises, wrist alignments, and finger-glide habits utilized by typing test champions.',
      content: 'Speed typing is a motor-skill that relies deeply on muscle memory. Try following these rules:\n\n1. Maintain Home Row anchors diligently (A S D F on left hand, J K L ; on right hand).\n2. Keep your eyes strictly locked on the reading passage, never look down at your keyboard keys!\n3. Conduct 10-minutes high-focus mock sessions on Digital Hub India speed tests daily.',
      category: 'studytips',
      date: '18 June 2026',
      reads: 1250,
      likes: 124,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=350',
      comments: [
        { author: 'Ramesh Singh', text: 'This practice guide worked amazing! Raised my English speed from 28 to 41 WPM.', date: '18 June' }
      ]
    },
    {
      id: 'b2',
      title: 'Common Mistakes leading to SSC Photo/Signature Rejection',
      summary: 'Avoid critical candidate identity rejections. Best crop metrics, background standards, and signature weights reviewed.',
      content: 'Over 15% of government application rejections originate from invalid photo parameters. Remember:\n\n- Ensure background colors are solid blue or solid white.\n- The signatures must be drawn clearly on crisp white sheets, not lined papers.\n- Merge both elements using our standard composite crop canvas inside Digital Hub India.',
      category: 'pdf-guide',
      date: '15 June 2026',
      reads: 920,
      likes: 85,
      image: 'https://images.unsplash.com/photo-1542744173-8e08562744ad?auto=format&fit=crop&q=80&w=350',
      comments: []
    }
  ]);
  const [newBlogComments, setNewBlogComments] = useState<{ [blogId: string]: string }>({});

  const handleInquireService = (svcName: string) => {
    if (openInquiryWithService) {
      openInquiryWithService(svcName);
    } else {
      onOpenQuickInquiry();
    }
  };

  const handleAddToCart = (product: ProductItem) => {
    setStoreCart((prev) => [...prev, product]);
    confetti({ particleCount: 20, spread: 30, origin: { y: 0.8 } });
  };

  const handleRemoveFromCart = (index: number) => {
    setStoreCart((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateCartTotal = () => {
    return storeCart.reduce((sum, item) => sum + item.price, 0);
  };

  const handleCartWorkout = () => {
    confetti({ particleCount: 80, spread: 60 });
    alert(`Thank you! Santosh Tech will contact you on WhatsApp/Email with your secure checkout links for:\n${storeCart.map(item => `∙ ${item.name}`).join('\n')}\nTotal amount: ₹${calculateCartTotal()}`);
    setStoreCart([]);
    setShowCartOverlay(false);
  };

  const handleLikeBlog = (id: string) => {
    setBlogs(prev =>
      prev.map(b => b.id === id ? { ...b, likes: b.likes + 1 } : b)
    );
  };

  const handlePostComment = (blogId: string) => {
    const textStr = newBlogComments[blogId]?.trim();
    if (!textStr) return;

    setBlogs(prev =>
      prev.map(b => {
        if (b.id === blogId) {
          return {
            ...b,
            comments: [...b.comments, { author: 'Guest Student', text: textStr, date: 'Just now' }]
          };
        }
        return b;
      })
    );

    setNewBlogComments(prev => ({ ...prev, [blogId]: '' }));
    confetti({ particleCount: 15, spread: 20, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Category Navigation */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-1 bg-slate-150 p-1 rounded-xl">
          {[
            { id: 'services', label: '🛠️ Freelance Services' },
            { id: 'products', label: '📚 Digital Store' },
            { id: 'blog', label: '📰 Tech Column Blogs' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSegment(item.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSegment === item.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Store Cart Trigger Badge */}
        {activeSegment === 'products' && (
          <button
            onClick={() => setShowCartOverlay(true)}
            className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Store Cart ({storeCart.length})</span>
          </button>
        )}
      </div>

      {/* --- SEGMENT 1: PORTFOLIO SERVICES --- */}
      {activeSegment === 'services' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {servicesList.map((svc) => (
              <div
                key={svc.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow transition flex flex-col justify-between"
              >
                <div className="space-y-4 text-xs text-slate-500 font-semibold">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{svc.name}</h3>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border px-2 py-0.5 rounded font-mono">{svc.priceEstimate}</span>
                  </div>
                  <p className="text-xs font-light text-slate-400 mt-1">{svc.description}</p>

                  <div className="border-t pt-4 space-y-1">
                    <p className="font-extrabold text-slate-700 mb-2 uppercase text-[10px] tracking-wide">Included Features:</p>
                    {svc.features.map((feat, id) => (
                      <div key={id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="text-slate-600 truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">Time: {svc.deliveryTime}</span>
                  <button
                    onClick={() => handleInquireService(svc.name)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                  >
                    Inquire Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SEGMENT 2: STORE CATALOG --- */}
      {activeSegment === 'products' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((item) => (
            <div
              key={item.id}
              className="bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow transition-all flex flex-col justify-between"
            >
              <div>
                <img src={item.image} alt="book cover" className="w-full h-44 object-cover" />
                <div className="p-5 space-y-3 text-xs text-slate-500 font-semibold">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="bg-slate-100 text-slate-600 tracking-wider font-mono uppercase px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="font-mono font-bold text-amber-500">★ {item.rating} / 5</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{item.name}</h4>
                    <p className="text-xs font-light text-slate-400 leading-relaxed truncate mt-1">{item.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t mt-4 flex items-center justify-between text-xs">
                <div className="font-mono">
                  <span className="text-lg font-extrabold text-slate-900">₹{item.price}</span>
                  <span className="text-xs text-slate-400 line-through pl-1.5">₹{item.originalPrice}</span>
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                >
                  Purchase Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SEGMENT 3: BLOGS BOARD --- */}
      {activeSegment === 'blog' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white p-6 sm:p-8 border rounded-3xl space-y-6"
              >
                {/* Meta details */}
                <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-slate-100 text-slate-600 border px-2 py-0.5 rounded font-mono uppercase">
                      {blog.category}
                    </span>
                    <span className="font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {blog.date}
                    </span>
                  </div>
                  <span>{blog.reads} reads</span>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">{blog.title}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border font-light">
                    {blog.content}
                  </p>
                </div>

                {/* Like / Engage interface */}
                <div className="border-t pt-4 flex items-center gap-5 text-xs font-bold text-slate-500">
                  <button
                    onClick={() => handleLikeBlog(blog.id)}
                    className="flex items-center gap-1 hover:text-rose-600 transition"
                  >
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>{blog.likes} Likes</span>
                  </button>

                  <span className="flex items-center gap-1.5 font-mono text-slate-400">
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>{blog.comments.length} Comments logged</span>
                  </span>
                </div>

                {/* Sub-comments box list */}
                <div className="space-y-4 border-t pt-4 text-xs font-medium">
                  {blog.comments.length > 0 && (
                    <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                      {blog.comments.map((comm, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border">
                          <div className="flex justify-between font-bold text-slate-700 text-[10px]">
                            <span>{comm.author}</span>
                            <span className="text-slate-400 font-mono">{comm.date}</span>
                          </div>
                          <p className="text-slate-600 text-xs font-light mt-1">{comm.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comments form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Comment on this guide..."
                      value={newBlogComments[blog.id] || ''}
                      onChange={(e) => setNewBlogComments({ ...newBlogComments, [blog.id]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(blog.id); }}
                      className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                    />
                    <button
                      onClick={() => handlePostComment(blog.id)}
                      className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                    >
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick FAQ info panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-indigo-600 text-white p-6 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="space-y-1.5 relative z-10">
                <h3 className="font-extrabold text-base display-title leading-snug">Need a custom e-book, notes collection or resume guide?</h3>
                <p className="text-indigo-100 text-xs font-light leading-relaxed">Let Santosh prepare specialized layouts for your recruitment. Inquiry pricing options tailored instantly.</p>
              </div>
              <button
                onClick={onOpenQuickInquiry}
                className="w-full py-2.5 bg-white text-indigo-700 font-bold text-xs rounded-xl hover:scale-105 active:scale-95 transition-transform"
              >
                Inquire Special File Builder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CART SLIDE-IN OVERLAY PANEL --- */}
      {showCartOverlay && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end no-print font-sans">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-base font-bold text-slate-800">
                  {checkoutMode === 'cart' ? 'Your Shopping basket' : '✨ Secure QR Payment Gateway'}
                </h3>
                <button
                  onClick={() => {
                    setShowCartOverlay(false);
                    setCheckoutMode('cart');
                  }}
                  className="font-extrabold text-slate-400 hover:text-slate-800 text-xs uppercase cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>

              {checkoutMode === 'cart' ? (
                <>
                  {storeCart.length > 0 ? (
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[60vh] pr-1 mt-4">
                      {storeCart.map((item, id) => (
                        <div key={id} className="py-3.5 flex justify-between items-center text-xs text-left font-medium">
                          <div className="space-y-0.5 max-w-[280px]">
                            <p className="font-extrabold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider font-mono">{item.category}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-extrabold text-slate-900">₹{item.price}</span>
                            <button
                              onClick={() => handleRemoveFromCart(id)}
                              className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-12 text-slate-400 text-xs font-semibold leading-normal">
                      Your shopping basket is empty. Browse products inside Store shelf!
                    </p>
                  )}
                </>
              ) : (
                /* Dynamic payment scanning view */
                <div className="mt-4 space-y-5 text-left text-xs font-semibold text-slate-600 leading-relaxed">
                  <button
                    onClick={() => setCheckoutMode('cart')}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 mb-2"
                  >
                    ← Go Back to Basket List
                  </button>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col items-center text-center space-y-3">
                    <img
                      src={upiSettings.upiQrUrl}
                      alt="Merchant UPI scan qr code"
                      className="w-40 h-40 object-cover rounded-xl border bg-white shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Scan To Transfer</p>
                      <p className="text-xs font-extrabold text-slate-800 font-mono select-all">UPI ID: {upiSettings.upiId}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-slate-800 font-bold">Checkout Instructions:</p>
                    <p className="text-slate-500 font-normal">{upiSettings.paymentMsg}</p>
                  </div>

                  {/* Submit validation details */}
                  <div className="border-t pt-4 space-y-3 font-semibold text-xs">
                    <p className="text-slate-800 font-bold uppercase tracking-wider text-[10px]">Verification & Delivery fields</p>
                    
                    <div className="space-y-1">
                      <label className="text-slate-700 block">Your Student Name *</label>
                      <input
                        type="text"
                        required
                        value={purchaseName}
                        onChange={e => setPurchaseName(e.target.value)}
                        placeholder="e.g., Ramesh Kumar"
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-700 block">WhatsApp Number (For file delivery link) *</label>
                      <input
                        type="text"
                        required
                        value={purchasePhone}
                        onChange={e => setPurchasePhone(e.target.value)}
                        placeholder="e.g., 8935882550"
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {storeCart.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-xs font-extrabold text-slate-800">
                  <span>Grand Total Cumulative:</span>
                  <span className="font-mono text-sm font-extrabold text-indigo-700">₹{calculateCartTotal()}</span>
                </div>

                {checkoutMode === 'cart' ? (
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        alert("Please login before initiating digital store checkouts.");
                        return;
                      }
                      setCheckoutMode('payment');
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Proceed to Secure UPI & QR checkout</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (!purchaseName.trim() || !purchasePhone.trim()) {
                        alert("Please provide both your validation name and contact mobile first.");
                        return;
                      }
                      try {
                        setSubmittingPurchase(true);
                        const msgStr = `I have paid ₹${calculateCartTotal()} using scan codes for the purchase of: ${storeCart.map(item => `${item.name} (₹${item.price})`).join(', ')}`;
                        
                        await addDoc(collection(db, "inquiries_all"), {
                          clientName: purchaseName,
                          clientPhone: purchasePhone,
                          clientEmail: currentUser?.email || "anonymous-buyer",
                          service: `Digital Ebook Store purchase`,
                          message: msgStr,
                          createdAt: new Date().toISOString()
                        });

                        confetti({ particleCount: 100, spread: 65 });
                        alert("Purchase inquiry is successfully submitted! Admin Santosh will contact you or authorize links within 2-4 hours. Check dynamic logs in your workspace Admin Panel.");
                        
                        // Clear cart
                        setStoreCart([]);
                        setShowCartOverlay(false);
                        setCheckoutMode('cart');
                        setPurchaseName('');
                        setPurchasePhone('');
                      } catch (err) {
                        console.error(err);
                        alert("Network validation delay. Proceeding to mock checkouts.");
                        setStoreCart([]);
                        setShowCartOverlay(false);
                      } finally {
                        setSubmittingPurchase(false);
                      }
                    }}
                    disabled={submittingPurchase}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submittingPurchase ? "Connecting billing server..." : "Submit Verification & Request Delivery"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
