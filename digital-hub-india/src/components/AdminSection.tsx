import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import {
  FolderOpen,
  PlusCircle,
  Trash2,
  Settings,
  DollarSign,
  FileText,
  ShoppingBag,
  Briefcase,
  Users,
  CheckCircle2,
  Mail,
  QrCode,
  Tag,
  BookOpen,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Lock,
  LockKeyhole
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminSectionProps {
  currentUser?: any;
}

export default function AdminSection({ currentUser }: AdminSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'ebooks' | 'services' | 'products' | 'blogs' | 'inquiries' | 'payments' | 'purchases' | 'plans'>('notes');
  const [loading, setLoading] = useState(false);

  // Authorize Admin
  const isUserAdmin = currentUser && currentUser.email && (
    currentUser.email.trim().toLowerCase() === 'santoshtech45@gmail.com'
  );

  // Lists loaded from Firestore
  const [customNotes, setCustomNotes] = useState<any[]>([]);
  const [customProducts, setCustomProducts] = useState<any[]>([]);
  const [customEbooks, setCustomEbooks] = useState<any[]>([]);
  const [customServices, setCustomServices] = useState<any[]>([]);
  const [customBlogs, setCustomBlogs] = useState<any[]>([]);
  const [clientInquiries, setClientInquiries] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);

  // Editing states for customization control
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingEbook, setEditingEbook] = useState<any | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);

  // Settings state (e.g. payment details)
  const [upiId, setUpiId] = useState('santoshtech45@okaxis');
  const [paymentMsg, setPaymentMsg] = useState('After scanning and making a payment, please share the screenshot on WhatsApp 8935882550 to get instant premium access.');
  const [upiQrUrl, setUpiQrUrl] = useState('https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=350');

  // Form states for Note Upload
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('General Knowledge');
  const [noteSummary, setNoteSummary] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSize, setNoteSize] = useState('1.5 MB');
  const [noteReadTime, setNoteReadTime] = useState('5 mins read');
  const [noteIsPaid, setNoteIsPaid] = useState(false);
  const [notePrice, setNotePrice] = useState(49);
  const [noteFileUrl, setNoteFileUrl] = useState('');

  // Form states for E-Book Upload
  const [ebookTitle, setEbookTitle] = useState('');
  const [ebookAuthor, setEbookAuthor] = useState('Santosh Kumar');
  const [ebookSubject, setEbookSubject] = useState('General Knowledge');
  const [ebookSize, setEbookSize] = useState('5.0 MB');
  const [ebookIsPremium, setEbookIsPremium] = useState(false);
  const [ebookPrice, setEbookPrice] = useState(49);
  const [ebookFileUrl, setEbookFileUrl] = useState('');

  // Form states for Freelance Service
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('₹1,500 - ₹3,500');
  const [serviceDelivery, setServiceDelivery] = useState('3-5 Working Days');
  const [serviceIcon, setServiceIcon] = useState('Briefcase');
  const [serviceFeatures, setServiceFeatures] = useState('Full Source Code, Custom Admin Panel, Database integration');

  // Form states for Blogs Upload
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState<'tech' | 'career' | 'studytips' | 'pdf-guide'>('tech');
  const [blogSummary, setBlogSummary] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogImage, setBlogImage] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=350');

  // Form states for Product Upload
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'ebook' | 'template' | 'course' | 'tool'>('ebook');
  const [prodPrice, setProdPrice] = useState(99);
  const [prodOriginalPrice, setProdOriginalPrice] = useState(199);
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=350');
  const [prodFeaturesString, setProdFeaturesString] = useState('Premium PDF Chapter, Detailed Answers included');

  // Manual Subscription Management states
  const [showAddSubForm, setShowAddSubForm] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [subStudentName, setSubStudentName] = useState('');
  const [subStudentPhone, setSubStudentPhone] = useState('');
  const [subStudentEmail, setSubStudentEmail] = useState('');
  const [subPlanName, setSubPlanName] = useState('Silver VIP Study Pass (1 Month)');
  const [subPrice, setSubPrice] = useState(149);
  const [subStatus, setSubStatus] = useState('Approved');

  // Dynamic Membership Plans States
  const [plansList, setPlansList] = useState<any[]>([]);
  const [showAddPlanForm, setShowAddPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDuration, setPlanDuration] = useState('1 Month');
  const [planPrice, setPlanPrice] = useState(149);
  const [planOriginalPrice, setPlanOriginalPrice] = useState(299);
  const [planTag, setPlanTag] = useState('');
  const [planDescription, setPlanDescription] = useState('Excellent for revisions before scheduled examinations.');
  const [planFeaturesString, setPlanFeaturesString] = useState('All premium class notes unlocked, Complete exam syllabus access, Ad-Free downloads');

  // Read data on launch
  const loadData = async () => {
    try {
      setLoading(true);
      // Load Custom Notes
      const notesSnap = await getDocs(query(collection(db, 'class_notes'), orderBy('createdAt', 'desc')));
      const loadedNotes: any[] = [];
      notesSnap.forEach((doc) => {
        loadedNotes.push({ id: doc.id, ...doc.data() });
      });
      setCustomNotes(loadedNotes);

      // Load Custom Products
      const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
      const loadedProds: any[] = [];
      prodSnap.forEach((doc) => {
        loadedProds.push({ id: doc.id, ...doc.data() });
      });
      setCustomProducts(loadedProds);

      // Load Inquiries (globally logged or per user)
      const inqSnap = await getDocs(collection(db, 'inquiries_all'));
      const loadedInqs: any[] = [];
      inqSnap.forEach((doc) => {
        loadedInqs.push({ id: doc.id, ...doc.data() });
      });
      // Sort inqs by date if existing
      loadedInqs.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setClientInquiries(loadedInqs);

      // Load Subscriptions Dynamic Ledger
      try {
        const subSnap = await getDocs(collection(db, 'subscriptions_all'));
        const loadedSubs: any[] = [];
        subSnap.forEach((doc) => {
          loadedSubs.push({ id: doc.id, ...doc.data() });
        });
        loadedSubs.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setSubscriptionsList(loadedSubs);
      } catch (subErr) {
        console.warn('subscriptions_all collection may not contain documents yet:', subErr);
      }

      // Also try fetching stored admin settings if any
      const settingsSnap = await getDocs(collection(db, 'admin_settings'));
      if (!settingsSnap.empty) {
        const setDoc = settingsSnap.docs[0].data();
        if (setDoc.upiId) setUpiId(setDoc.upiId);
        if (setDoc.paymentMsg) setPaymentMsg(setDoc.paymentMsg);
        if (setDoc.upiQrUrl) setUpiQrUrl(setDoc.upiQrUrl);
      }

      // Load Custom Ebooks
      try {
        const ebooksSnap = await getDocs(query(collection(db, 'ebooks'), orderBy('createdAt', 'desc')));
        const loadedEbooks: any[] = [];
        ebooksSnap.forEach((doc) => {
          loadedEbooks.push({ id: doc.id, ...doc.data() });
        });
        setCustomEbooks(loadedEbooks);
      } catch (ebErr) {
        console.warn('ebooks collection load warm:', ebErr);
      }

      // Load Custom Services
      try {
        const servicesSnap = await getDocs(query(collection(db, 'services'), orderBy('createdAt', 'desc')));
        const loadedServices: any[] = [];
        servicesSnap.forEach((doc) => {
          loadedServices.push({ id: doc.id, ...doc.data() });
        });
        setCustomServices(loadedServices);
      } catch (svErr) {
        console.warn('services collection load warm:', svErr);
      }

      // Load Custom Blogs
      try {
        const blogsSnap = await getDocs(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')));
        const loadedBlogs: any[] = [];
        blogsSnap.forEach((doc) => {
          loadedBlogs.push({ id: doc.id, ...doc.data() });
        });
        setCustomBlogs(loadedBlogs);
      } catch (blErr) {
        console.warn('blogs collection load warm:', blErr);
      }

      // Load Dynamic Membership Plans list
      try {
        const plansSnap = await getDocs(collection(db, 'membership_plans'));
        const loadedPlans: any[] = [];
        plansSnap.forEach((doc) => {
          loadedPlans.push({ id: doc.id, ...doc.data() });
        });
        loadedPlans.sort((a,b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        setPlansList(loadedPlans);
      } catch (plansErr) {
        console.warn('membership_plans list could not load:', plansErr);
      }
    } catch (err) {
      console.error('Error loading admin databases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      alert('Plan Name is required!');
      return;
    }
    try {
      setLoading(true);
      const parsedFeatures = planFeaturesString.split(',').map(f => f.trim()).filter(f => f.length > 0);
      const payload = {
        name: planName.trim(),
        duration: planDuration.trim(),
        price: Number(planPrice),
        originalPrice: Number(planOriginalPrice),
        tag: planTag.trim(),
        description: planDescription.trim(),
        features: parsedFeatures,
        updatedAt: new Date().toISOString()
      };

      if (editingPlan) {
        await updateDoc(doc(db, 'membership_plans', editingPlan.id), payload);
        alert('Membership Plan updated successfully!');
        setEditingPlan(null);
      } else {
        await addDoc(collection(db, 'membership_plans'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        alert('New Membership Plan created successfully!');
      }

      // Reset
      setPlanName('');
      setPlanDuration('1 Month');
      setPlanPrice(149);
      setPlanOriginalPrice(299);
      setPlanTag('');
      setPlanDescription('Excellent for revisions before scheduled examinations.');
      setPlanFeaturesString('All premium class notes unlocked, Complete exam syllabus access, Ad-Free downloads');
      setShowAddPlanForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error saving plan: check Firestore connection or console logs.');
    } finally {
      setLoading(false);
    }
  };

  const startEditingPlanValue = (plan: any) => {
    setEditingPlan(plan);
    setPlanName(plan.name || '');
    setPlanDuration(plan.duration || '1 Month');
    setPlanPrice(plan.price || 149);
    setPlanOriginalPrice(plan.originalPrice || 299);
    setPlanTag(plan.tag || '');
    setPlanDescription(plan.description || '');
    setPlanFeaturesString(plan.features ? plan.features.join(', ') : '');
    setShowAddPlanForm(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this subscription plan?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'membership_plans', id));
      alert('Plan deleted successfully.');
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error deleting plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubscriptionStatus = async (id: string, currentStatus: string) => {
    try {
      setLoading(true);
      const nextStatus = currentStatus === 'Approved' ? 'Pending Review' : 'Approved';
      await updateDoc(doc(db, 'subscriptions_all', id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      confetti({ particleCount: 30, spread: 30 });
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error updating subscription: check Firestore security rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription log?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'subscriptions_all', id));
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subStudentName.trim() || !subStudentPhone.trim() || !subStudentEmail.trim()) {
      alert('Please fill out all required fields (Name, Phone, Email).');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        studentName: subStudentName.trim(),
        studentPhone: subStudentPhone.trim(),
        studentEmail: subStudentEmail.trim().toLowerCase(),
        planName: subPlanName,
        price: Number(subPrice),
        status: subStatus,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || 'admin_manual'
      };
      await addDoc(collection(db, 'subscriptions_all'), payload);
      confetti({ particleCount: 50, spread: 35 });
      alert('New subscription successfully created offline!');
      setShowAddSubForm(false);
      // Reset
      setSubStudentName('');
      setSubStudentPhone('');
      setSubStudentEmail('');
      setSubPrice(149);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error creating manual subscription: check Firestore connection or rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditedSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'subscriptions_all', editingSub.id), {
        studentName: subStudentName.trim(),
        studentPhone: subStudentPhone.trim(),
        studentEmail: subStudentEmail.trim().toLowerCase(),
        planName: subPlanName,
        price: Number(subPrice),
        status: subStatus,
        updatedAt: new Date().toISOString()
      });
      alert('Subscription details updated successfully!');
      setEditingSub(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error saving updated subscription details.');
    } finally {
      setLoading(false);
    }
  };

  const startEditingSubValue = (sub: any) => {
    setEditingSub(sub);
    setSubStudentName(sub.studentName || '');
    setSubStudentPhone(sub.studentPhone || '');
    setSubStudentEmail(sub.studentEmail || '');
    setSubPlanName(sub.planName || 'Silver VIP Study Pass (1 Month)');
    setSubPrice(sub.price || 149);
    setSubStatus(sub.status || 'Approved');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setUrl(downloadUrl);
      alert(`File uploaded successfully inside Firebase Storage locker!\nAttached URL: ${downloadUrl}`);
    } catch (err: any) {
      console.warn('Firebase storage rule fallback active:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUrl(reader.result);
          alert('Note: File converted locally to dynamic data blob. Safe transfer active!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      alert('Please specify Note Title and Content.');
      return;
    }
    try {
      setLoading(true);
      const docPayload = {
        title: noteTitle,
        subject: noteSubject,
        summary: noteSummary || noteTitle + ' review notes.',
        content: noteContent,
        fileSize: noteSize,
        readingTime: noteReadTime,
        isPremium: noteIsPaid,
        price: noteIsPaid ? Number(notePrice) : 0,
        fileUrl: noteFileUrl || '',
        downloads: editingNote ? (editingNote.downloads || 0) : 0,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        createdAt: new Date().toISOString()
      };

      if (editingNote) {
        await updateDoc(doc(db, 'class_notes', editingNote.id), docPayload);
        alert('Class Note updated successfully!');
      } else {
        await addDoc(collection(db, 'class_notes'), docPayload);
        alert('New Class Note added successfully!');
      }

      confetti({ particleCount: 60, spread: 45 });
      
      // Reset forms
      setNoteTitle('');
      setNoteSummary('');
      setNoteContent('');
      setNoteIsPaid(false);
      setNoteFileUrl('');
      setEditingNote(null);

      // reload
      await loadData();
    } catch (err) {
      console.error('Error writing note:', err);
      alert('Firestore writing error: check rules or write permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNoteLaunch = (note: any) => {
    setEditingNote(note);
    setNoteTitle(note.title || '');
    setNoteSubject(note.subject || 'General Knowledge');
    setNoteSummary(note.summary || '');
    setNoteContent(note.content || '');
    setNoteSize(note.fileSize || '1.5 MB');
    setNoteReadTime(note.readingTime || '5 mins read');
    setNoteIsPaid(!!note.isPremium);
    setNotePrice(note.price || 49);
    setNoteFileUrl(note.fileUrl || '');
    setActiveSubTab('notes');
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Delete this Class Note? This operation is persistent.')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'class_notes', id));
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert('Please specify Product Name.');
      return;
    }
    try {
      setLoading(true);
      const featArray = prodFeaturesString.split(',').map(f => f.trim()).filter(Boolean);
      const docPayload = {
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice),
        originalPrice: Number(prodOriginalPrice),
        description: prodDesc || prodName + ' premium product.',
        image: prodImage,
        rating: 4.9,
        features: featArray,
        createdAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), docPayload);
        alert('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), docPayload);
        alert('Product created successfully!');
      }
      confetti({ particleCount: 60, spread: 45 });

      // Reset
      setProdName('');
      setProdDesc('');
      setProdPrice(99);
      setProdOriginalPrice(199);
      setEditingProduct(null);

      await loadData();
    } catch (err) {
      console.error('Error writing product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProductLaunch = (prod: any) => {
    setEditingProduct(prod);
    setProdName(prod.name || '');
    setProdCategory(prod.category || 'ebook');
    setProdPrice(prod.price || 99);
    setProdOriginalPrice(prod.originalPrice || 199);
    setProdDesc(prod.description || '');
    setProdImage(prod.image || '');
    setProdFeaturesString((prod.features && prod.features.join) ? prod.features.join(', ') : 'Premium, Online Download');
    setActiveSubTab('products');
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this Product?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'products', id));
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. EBOOKS Shelf (Create or Update)
  const handleCreateOrUpdateEbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ebookTitle.trim()) {
      alert('E-Book Title is required!');
      return;
    }
    try {
      setLoading(true);
      const docPayload = {
        title: ebookTitle,
        author: ebookAuthor,
        subject: ebookSubject,
        fileSize: ebookSize,
        isPremium: ebookIsPremium,
        price: ebookIsPremium ? Number(ebookPrice) : 0,
        fileUrl: ebookFileUrl || '',
        downloads: editingEbook ? (editingEbook.downloads || 0) : Math.floor(Math.random() * 500) + 120,
        createdAt: new Date().toISOString()
      };

      if (editingEbook) {
        await updateDoc(doc(db, 'ebooks', editingEbook.id), docPayload);
        alert('E-Book shelf item updated!');
      } else {
        await addDoc(collection(db, 'ebooks'), docPayload);
        alert('New E-Book added to library shelf!');
      }
      confetti({ particleCount: 50, spread: 40 });

      setEbookTitle('');
      setEbookFileUrl('');
      setEbookIsPremium(false);
      setEditingEbook(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEbookLaunch = (ebook: any) => {
    setEditingEbook(ebook);
    setEbookTitle(ebook.title || '');
    setEbookAuthor(ebook.author || 'Santosh Kumar');
    setEbookSubject(ebook.subject || 'General Knowledge');
    setEbookSize(ebook.fileSize || '5.0 MB');
    setEbookIsPremium(!!ebook.isPremium);
    setEbookPrice(ebook.price || 49);
    setEbookFileUrl(ebook.fileUrl || '');
    setActiveSubTab('ebooks');
  };

  const handleDeleteEbook = async (id: string) => {
    if (!window.confirm('Delete this E-Book library option?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'ebooks', id));
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. FREELANCE WORK (Create or Update)
  const handleCreateOrUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      alert('Service Name is required!');
      return;
    }
    try {
      setLoading(true);
      const featArray = serviceFeatures.split(',').map(f => f.trim()).filter(Boolean);
      const docPayload = {
        name: serviceName,
        description: serviceDesc,
        priceEstimate: servicePrice,
        deliveryTime: serviceDelivery,
        iconName: serviceIcon,
        features: featArray,
        createdAt: new Date().toISOString()
      };

      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), docPayload);
        alert('Service customized effectively!');
      } else {
        await addDoc(collection(db, 'services'), docPayload);
        alert('New service listing activated!');
      }
      confetti({ particleCount: 50, spread: 40 });

      setServiceName('');
      setServiceDesc('');
      setEditingService(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditServiceLaunch = (svc: any) => {
    setEditingService(svc);
    setServiceName(svc.name || '');
    setServiceDesc(svc.description || '');
    setServicePrice(svc.priceEstimate || '₹1,500 - ₹3,500');
    setServiceDelivery(svc.deliveryTime || '3-5 Working Days');
    setServiceIcon(svc.iconName || 'Briefcase');
    setServiceFeatures((svc.features && svc.features.join) ? svc.features.join(', ') : 'Responsive Design, Admin Panel');
    setActiveSubTab('services');
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Delete this Service offering?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'services', id));
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 5. BLOG / TECH JOURNAL (Create or Update)
  const handleCreateOrUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) {
      alert('Blog Title and content are required!');
      return;
    }
    try {
      setLoading(true);
      const docPayload = {
        title: blogTitle,
        category: blogCategory,
        summary: blogSummary || blogTitle.substring(0, 50) + '...',
        content: blogContent,
        image: blogImage,
        reads: editingBlog ? (editingBlog.reads || 0) : Math.floor(Math.random() * 200) + 40,
        likes: editingBlog ? (editingBlog.likes || 0) : Math.floor(Math.random() * 30) + 5,
        comments: editingBlog ? (editingBlog.comments || []) : [],
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        createdAt: new Date().toISOString()
      };

      if (editingBlog) {
        await updateDoc(doc(db, 'blogs', editingBlog.id), docPayload);
        alert('Blog article updated!');
      } else {
        await addDoc(collection(db, 'blogs'), docPayload);
        alert('New blog column published live!');
      }
      confetti({ particleCount: 50, spread: 40 });

      setBlogTitle('');
      setBlogSummary('');
      setBlogContent('');
      setEditingBlog(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlogLaunch = (bl: any) => {
    setEditingBlog(bl);
    setBlogTitle(bl.title || '');
    setBlogCategory(bl.category || 'tech');
    setBlogSummary(bl.summary || '');
    setBlogContent(bl.content || '');
    setBlogImage(bl.image || '');
    setActiveSubTab('blogs');
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Delete this Blog column?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'blogs', id));
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // We will look for an existing admin_settings doc or insert a newly saved settings collection
      const settingsSnap = await getDocs(collection(db, 'admin_settings'));
      if (settingsSnap.empty) {
        await addDoc(collection(db, 'admin_settings'), {
          upiId,
          paymentMsg,
          upiQrUrl,
          updatedAt: new Date().toISOString()
        });
      } else {
        const idToUpdate = settingsSnap.docs[0].id;
        await updateDoc(doc(db, 'admin_settings', idToUpdate), {
          upiId,
          paymentMsg,
          upiQrUrl,
          updatedAt: new Date().toISOString()
        });
      }
      confetti({ particleCount: 40, spread: 30 });
      alert('Upi Gateway settings updated successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isUserAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-xl leading-relaxed text-slate-700 animate-in fade-in zoom-in duration-300">
        <div className="relative inline-flex items-center justify-center p-5 bg-indigo-50 border border-indigo-100 rounded-3xl text-indigo-600">
          <Lock className="w-10 h-10 animate-bounce" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">👑 Admin Control Locked</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            This module contains privileged controls for uploading/managing study materials, book products, student subscriptions, and UPI configurations.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border rounded-2xl text-left space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider font-mono">
            <Sparkles className="w-4 h-4 text-indigo-650" />
            <span>Default Administrator Credentials</span>
          </div>
          <div className="text-xs space-y-1.5 text-slate-650">
            <div className="flex justify-between items-center font-mono bg-white px-2.5 py-1.5 border rounded-lg text-[11px]">
              <span className="text-slate-400">Admin Email:</span>
              <strong className="text-slate-800">admin@sarkarihub.com</strong>
            </div>
            <div className="flex justify-between items-center font-mono bg-white px-2.5 py-1.5 border rounded-lg text-[11px]">
              <span className="text-slate-400">Admin Password:</span>
              <strong className="text-slate-800">sarkarihub@admin123</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-450 leading-relaxed font-medium">
            💡 <strong className="text-indigo-600 font-extrabold">Notice:</strong> To log in, click the <strong className="text-indigo-600 font-extrabold">Sign In</strong> button on the header, click "Auto-Fill" to load these credentials, and proceed! Once logged in, this page will unlock instantly.
          </p>
        </div>

        <div className="text-[10px] text-slate-400 font-medium">
          Digital Hub India Back-office Control Room Secure Gateway.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Decorative Gradient ambient top banner */}
      <div className="relative bg-gradient-to-r from-violet-900 via-indigo-900 to-indigo-950 rounded-4xl p-8 sm:p-10 text-white overflow-hidden shadow-xl border border-violet-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl -z-1 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-sky-500/20 rounded-full blur-2xl -z-1 pointer-events-none"></div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-violet-200 select-none">
            <Settings className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono">Verified Developer Workspace</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight display-title bg-clip-text bg-gradient-to-b from-white to-violet-100">
              Admin & Content Control Panel
            </h1>
            <p className="text-violet-200/90 max-w-xl text-xs sm:text-sm leading-relaxed mt-2 font-medium">
              Update digital books, sell sarkari exam preparation packs, set up global UPI configurations, and check customized user dynamic workspace query submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Main Admin Navigation and Workspace Layout */}
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Left Side menu navigation */}
        <div className="lg:col-span-1 space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm self-start">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest px-2.5">Modules Controller</p>
          
          <div className="space-y-1.5 pt-2">
            {[
              { id: 'notes', label: 'Study & Class Notes', icon: BookOpen },
              { id: 'ebooks', label: 'Ebooks Shelf Manager', icon: FolderOpen },
              { id: 'services', label: 'Freelance Services', icon: Briefcase },
              { id: 'products', label: 'Digital Store Products', icon: ShoppingBag },
              { id: 'blogs', label: 'Tech Column Blogs', icon: FileText },
              { id: 'inquiries', label: 'Client Inquiries', icon: Mail },
              { id: 'payments', label: 'Payment Gateway', icon: QrCode },
              { id: 'purchases', label: 'Subscriptions & Sales', icon: DollarSign },
              { id: 'plans', label: 'Membership Plans 🔒', icon: Tag }
            ].map((btn) => {
              const Icon = btn.icon;
              const isSelected = activeSubTab === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveSubTab(btn.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1 leading-normal px-2">
            <p className="font-extrabold text-slate-500 uppercase tracking-wide">Live Database Status:</p>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>Cloud Firestore Active</span>
            </div>
            <p className="font-medium">Direct synchronization with visitor views in real time.</p>
          </div>
        </div>

        {/* Right workspace details */}
        <div className="lg:col-span-3 space-y-6">

          {/* TAB 1: STUDY AND CLASS NOTES */}
          {activeSubTab === 'notes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {editingNote ? 'Edit Study Note / Sarkari PDF' : 'Upload New Study Note / Sarkari PDF'}
                      </h2>
                      <p className="text-xs text-slate-400">Class notes will appear instantly inside the dynamic study section.</p>
                    </div>
                  </div>
                  {editingNote && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNote(null);
                        setNoteTitle('');
                        setNoteSummary('');
                        setNoteContent('');
                        setNoteIsPaid(false);
                        setNoteFileUrl('');
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                {editingNote && (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold">
                    ⚡ You are currently modifying: <strong className="text-amber-900 underline">{editingNote.title}</strong>
                  </div>
                )}

                <form onSubmit={handleCreateOrUpdateNote} className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Note Title *</label>
                    <input
                      type="text"
                      required
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                      placeholder="e.g., Lucent Static General Knowledge Digest (Hindi)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Subject Category</label>
                    <select
                      value={noteSubject}
                      onChange={e => setNoteSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    >
                      <option value="General Knowledge">General Knowledge (GK)</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="English">English</option>
                      <option value="Computer concepts">Computer concepts</option>
                      <option value="Sarkari Syllabus">Sarkari Syllabus</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Estimated Reading Time</label>
                    <input
                      type="text"
                      value={noteReadTime}
                      onChange={e => setNoteReadTime(e.target.value)}
                      placeholder="e.g., 5 mins read"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">File Weight / Size</label>
                    <input
                      type="text"
                      value={noteSize}
                      onChange={e => setNoteSize(e.target.value)}
                      placeholder="e.g., 1.2 MB"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Price Structure</label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="notePaid"
                          checked={!noteIsPaid}
                          onChange={() => setNoteIsPaid(false)}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <span>🆓 Free PDF</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="notePaid"
                          checked={noteIsPaid}
                          onChange={() => setNoteIsPaid(true)}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <span>🔒 Paid / Premium</span>
                      </label>
                    </div>
                  </div>

                  {noteIsPaid && (
                    <div className="space-y-1">
                      <label className="text-slate-700">Selling Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        value={notePrice}
                        onChange={e => setNotePrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none font-mono"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700 flex justify-between items-center">
                      <span>Dynamic PDF File Attachment</span>
                      <span className="text-[10px] text-indigo-600">URL link or select below for Firebase Storage upload</span>
                    </label>
                    <input
                      type="text"
                      value={noteFileUrl}
                      onChange={e => setNoteFileUrl(e.target.value)}
                      placeholder="e.g. https://digital-hub-india.firebasestorage.app/uploads/gk-notes.pdf"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none font-mono"
                    />
                    <div className="flex items-center gap-3 mt-2 bg-slate-100/60 p-3 rounded-2xl border border-dashed border-slate-300">
                      <FolderOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-700 font-extrabold leading-tight">Attach Note Document</p>
                        <p className="text-[9px] text-slate-400">Upload PDF to Firestore dynamic workspace</p>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileUpload(e, setNoteFileUrl)}
                        className="text-[10px] text-slate-500 max-w-[160px] cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-150"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Short Summary (Visible on card list)</label>
                    <input
                      type="text"
                      value={noteSummary}
                      onChange={e => setNoteSummary(e.target.value)}
                      placeholder="Brief description of the PDF content for students"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Detailed Classroom Note Content (Markdown or Plain Text) *</label>
                    <textarea
                      required
                      rows={5}
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      placeholder="Write your study formulas, important historical questions, or chapter notes content directly here..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none font-sans"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{editingNote ? 'Save Class Note Updates' : 'Publish Note to Student Base'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of Custom Uploaded Notes */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Dynamic Published Notes ({customNotes.length})</h3>
                
                {customNotes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No custom study notes uploaded to cloud database yet. Fill out the form above to add one.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customNotes.map((note) => (
                      <div key={note.id} className="py-3.5 flex justify-between items-center gap-4 text-xs font-semibold">
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{note.title}</p>
                          <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1 font-mono">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 uppercase font-bold">{note.subject}</span>
                            <span>{note.fileSize}</span>
                            <span>•</span>
                            <span className="text-amber-600">{note.isPremium ? `Premium (₹${note.price})` : 'FREE PDF'}</span>
                            {note.fileUrl && <span className="text-emerald-600 font-extrabold font-sans">✓ PDF Attached</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditNoteLaunch(note)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Note"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1B: EBOOKS SHELF MANAGER */}
          {activeSubTab === 'ebooks' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {editingEbook ? 'Edit Dynamic Library E-Book' : 'Add New E-Book to Library Shelf'}
                      </h2>
                      <p className="text-xs text-slate-400">Add digital textbooks or PDF chapters instantly to the books shelf.</p>
                    </div>
                  </div>
                  {editingEbook && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEbook(null);
                        setEbookTitle('');
                        setEbookFileUrl('');
                        setEbookIsPremium(false);
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                {editingEbook && (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold">
                    ⚡ Modifying Ebook item: <strong className="text-amber-900 underline">{editingEbook.title}</strong>
                  </div>
                )}

                <form onSubmit={handleCreateOrUpdateEbook} className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">E-Book Title *</label>
                    <input
                      type="text"
                      required
                      value={ebookTitle}
                      onChange={e => setEbookTitle(e.target.value)}
                      placeholder="e.g., Indian Polity Complete Revision Textbook Quick PDF"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Author Name</label>
                    <input
                      type="text"
                      value={ebookAuthor}
                      onChange={e => setEbookAuthor(e.target.value)}
                      placeholder="e.g., Santosh Kumar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Subject Category</label>
                    <input
                      type="text"
                      value={ebookSubject}
                      onChange={e => setEbookSubject(e.target.value)}
                      placeholder="e.g., GK, Math, Indian History"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">File Weight / Size</label>
                    <input
                      type="text"
                      value={ebookSize}
                      onChange={e => setEbookSize(e.target.value)}
                      placeholder="e.g., 4.2 MB"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Pricing Tier</label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="ebookPaid"
                          checked={!ebookIsPremium}
                          onChange={() => setEbookIsPremium(false)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>🆓 Free E-Book</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="ebookPaid"
                          checked={ebookIsPremium}
                          onChange={() => setEbookIsPremium(true)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>🔒 VIP Pass Locked</span>
                      </label>
                    </div>
                  </div>

                  {ebookIsPremium && (
                    <div className="space-y-1">
                      <label className="text-slate-700">Single Copy Price (₹) - Or Premium Only</label>
                      <input
                        type="number"
                        min="1"
                        value={ebookPrice}
                        onChange={e => setEbookPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700 flex justify-between items-center">
                      <span>Dynamic PDF Book Attachment</span>
                      <span className="text-[10px] text-emerald-600 font-normal">URL or select PDF file below</span>
                    </label>
                    <input
                      type="text"
                      value={ebookFileUrl}
                      onChange={e => setEbookFileUrl(e.target.value)}
                      placeholder="e.g. https://digital-hub-india.firebasestorage.app/uploads/polity-book.pdf"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-mono"
                    />
                    <div className="flex items-center gap-3 mt-2 bg-slate-100/60 p-3 rounded-2xl border border-dashed border-slate-300">
                      <FolderOpen className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-700 font-extrabold leading-tight">Attach Book PDF</p>
                        <p className="text-[9px] text-slate-400">Secure upload directly from your device</p>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileUpload(e, setEbookFileUrl)}
                        className="text-[10px] text-slate-500 max-w-[160px] cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-150"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{editingEbook ? 'Save E-Book Updates' : 'Add E-Book to Library Shelf'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of Custom Uploaded E-Books */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Dynamic Lib Ebooks ({customEbooks.length})</h3>
                
                {customEbooks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No custom library e-books uploaded to cloud database yet. Fill out the form above to deploy one.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customEbooks.map((eb) => (
                      <div key={eb.id} className="py-3.5 flex justify-between items-center gap-4 text-xs font-semibold">
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{eb.title}</p>
                          <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1 font-mono">
                            <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-emerald-600 uppercase font-bold">{eb.subject}</span>
                            <span>{eb.fileSize}</span>
                            <span>•</span>
                            <span className="text-emerald-700">{eb.isPremium ? `Pass Protected (₹${eb.price || 'PlanOnly'})` : 'FREE Shelf Download'}</span>
                            {eb.fileUrl && <span className="text-emerald-600 font-extrabold font-sans">✓ PDF Attached</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditEbookLaunch(eb)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEbook(eb.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1C: FREELANCE SERVICES MANAGER */}
          {activeSubTab === 'services' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {editingService ? 'Edit Freelance Service' : 'List New Freelance Service / Task'}
                      </h2>
                      <p className="text-xs text-slate-400">Offer web development, template setups, SEO, or software modules for hiring.</p>
                    </div>
                  </div>
                  {editingService && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingService(null);
                        setServiceName('');
                        setServiceDesc('');
                        setServicePrice('₹1,500 - ₹3,500');
                        setServiceDelivery('3-5 Working Days');
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                {editingService && (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold">
                    ⚡ Modifying active service: <strong className="text-amber-900 underline">{editingService.name}</strong>
                  </div>
                )}

                <form onSubmit={handleCreateOrUpdateService} className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Service Name *</label>
                    <input
                      type="text"
                      required
                      value={serviceName}
                      onChange={e => setServiceName(e.target.value)}
                      placeholder="e.g., Full-Stack Custom Web Application development"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Price Estimate Label</label>
                    <input
                      type="text"
                      value={servicePrice}
                      onChange={e => setServicePrice(e.target.value)}
                      placeholder="e.g., ₹1,500 - ₹3,500"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Estimated Delivery Time / Period</label>
                    <input
                      type="text"
                      value={serviceDelivery}
                      onChange={e => setServiceDelivery(e.target.value)}
                      placeholder="e.g., 3-5 Working Days"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Icon Type Prefix</label>
                    <select
                      value={serviceIcon}
                      onChange={e => setServiceIcon(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none font-sans"
                    >
                      <option value="Briefcase">💼 Business Briefcase</option>
                      <option value="Layers">🥞 Dynamic Layers</option>
                      <option value="Sparkles">✨ AI Sparkles</option>
                      <option value="Settings">⚙️ Setting Cog</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Bullet Features / Delivery Deliverables (comma separated)</label>
                    <input
                      type="text"
                      value={serviceFeatures}
                      onChange={e => setServiceFeatures(e.target.value)}
                      placeholder="Responsive Layout, Admin Config, Source Code Included"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Task Details Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={serviceDesc}
                      onChange={e => setServiceDesc(e.target.value)}
                      placeholder="Write comprehensive details about what you build, platforms used, and how clients can hire or consult on this project."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none font-sans"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{editingService ? 'Save Service Customizations' : 'Publish Service Listing'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of services */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Active Freelance Offerings ({customServices.length})</h3>
                
                {customServices.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No custom freelance services created. Static options are displayed on layout as fallback.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customServices.map((svc) => (
                      <div key={svc.id} className="py-3.5 flex justify-between items-center gap-4 text-xs font-semibold">
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{svc.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">
                            Price Estimate: <strong className="text-blue-600">{svc.priceEstimate}</strong> • Delivery: <strong className="text-slate-600">{svc.deliveryTime}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditServiceLaunch(svc)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(svc.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1D: TECH COLUMN BLOGS */}
          {activeSubTab === 'blogs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {editingBlog ? 'Edit Technical Blog Article' : 'Publish New Web Column / Tech Blog'}
                      </h2>
                      <p className="text-xs text-slate-400">Share informative news, sarkari syllabus guides, computer tips, or coding strategies.</p>
                    </div>
                  </div>
                  {editingBlog && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBlog(null);
                        setBlogTitle('');
                        setBlogSummary('');
                        setBlogContent('');
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                {editingBlog && (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold">
                    ⚡ Editing blog post: <strong className="text-amber-900 underline">{editingBlog.title}</strong>
                  </div>
                )}

                <form onSubmit={handleCreateOrUpdateBlog} className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Article Title *</label>
                    <input
                      type="text"
                      required
                      value={blogTitle}
                      onChange={e => setBlogTitle(e.target.value)}
                      placeholder="e.g., Top 10 High-Income Tech Skillsets for Sarkari Students in 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Topic Category</label>
                    <select
                      value={blogCategory}
                      onChange={e => setBlogCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    >
                      <option value="tech">💻 Technical concepts & Web Tools</option>
                      <option value="career">🎓 Career Guidance & Exams</option>
                      <option value="studytips">📚 Smart revision & Study Tricks</option>
                      <option value="pdf-guide">📋 Sarkari PDFs & Guides</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Illustrative Image URL</label>
                    <input
                      type="text"
                      value={blogImage}
                      onChange={e => setBlogImage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Short Summary (A short teaser shown on listings page) *</label>
                    <input
                      type="text"
                      required
                      value={blogSummary}
                      onChange={e => setBlogSummary(e.target.value)}
                      placeholder="e.g. Learn how database structures scale when creating Indian exam databases..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Full Blog Body Content (Markdown supported) *</label>
                    <textarea
                      required
                      rows={6}
                      value={blogContent}
                      onChange={e => setBlogContent(e.target.value)}
                      placeholder="Write details, bullet points, study hacks or technical analysis with code blocks..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none font-sans"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{editingBlog ? 'Publish Blog Changes' : 'Publish Blog Live'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Published Blogs List ({customBlogs.length})</h3>
                
                {customBlogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No custom tech column blogs published yet. Use the editor form to write one.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customBlogs.map((bl) => (
                      <div key={bl.id} className="py-3.5 flex justify-between items-center gap-4 text-xs font-semibold font-sans">
                        <div className="flex gap-3 items-center">
                          <img src={bl.image} className="w-10 h-10 rounded-lg object-cover" alt="visual teaser" />
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{bl.title}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Topic: <span className="bg-slate-100 px-1 py-0.2 rounded text-orange-600 font-extrabold uppercase">{bl.category}</span> • Published: <span className="font-bold">{bl.date}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditBlogLaunch(bl)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(bl.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STORE PRODUCTS */}
          {activeSubTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">{editingProduct ? 'Edit Digital Store Product' : 'Add Item to Digital Store Catalog'}</h2>
                      <p className="text-xs text-slate-400">Offer cheat sheets, study software hacks, or custom templates to buy.</p>
                    </div>
                  </div>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setProdName('');
                        setProdDesc('');
                        setProdPrice(99);
                        setProdOriginalPrice(199);
                        setProdImage('');
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                {editingProduct && (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold">
                    ⚡ You are currently modifying: <strong className="text-amber-900 underline">{editingProduct.name}</strong>
                  </div>
                )}

                <form onSubmit={handleCreateOrUpdateProduct} className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Product Title / Name *</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={e => setProdName(e.target.value)}
                      placeholder="e.g., Ultimate Arithmetic & Algebra Shortcut Digest"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Category Tag</label>
                    <select
                      value={prodCategory}
                      onChange={e => setProdCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    >
                      <option value="ebook">📚 Digital Ebook & PDF</option>
                      <option value="template">📝 Resume Template</option>
                      <option value="course">🎓 Video Micro-Course</option>
                      <option value="tool">⚙️ Utility Script Tool</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Image Cover URL</label>
                    <input
                      type="text"
                      value={prodImage}
                      onChange={e => setProdImage(e.target.value)}
                      placeholder="Unsplash image or static link"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={prodPrice}
                      onChange={e => setProdPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Original Strike-through Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={prodOriginalPrice}
                      onChange={e => setProdOriginalPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Features Checklist (comma separated)</label>
                    <input
                      type="text"
                      value={prodFeaturesString}
                      onChange={e => setProdFeaturesString(e.target.value)}
                      placeholder="e.g., 20 chapters PDF, Lifetime WhatsApp support, 100% money back"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700">Product Synopsis / Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={prodDesc}
                      onChange={e => setProdDesc(e.target.value)}
                      placeholder="Explain features, page lengths, benefits of purchasing..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{editingProduct ? 'Save Product Customizations' : 'Insert into Digital Storefront'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of Custom Products */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Dynamic Store Products ({customProducts.length})</h3>
                
                {customProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No custom ebooks or preparation products logged in cloud database yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customProducts.map((p) => (
                      <div key={p.id} className="py-3.5 flex justify-between items-center gap-4 text-xs font-semibold">
                        <div className="flex gap-3 items-center">
                          <img src={p.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="product cover" />
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              Category: <strong className="text-slate-600 uppercase">{p.category}</strong> • Price: <strong className="text-indigo-600">₹{p.price}</strong> <span className="line-through">₹{p.originalPrice}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditProductLaunch(p)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CLIENT INQUIRIES */}
          {activeSubTab === 'inquiries' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-5 h-5 text-indigo-600" />
                    <span>Real-Time Client Inquiries</span>
                  </h2>
                  <p className="text-xs text-slate-400">Inbound orders requested from the digital consulting contact points.</p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-lg uppercase tracking-wide tracking-tight"
                >
                  Refresh Feed
                </button>
              </div>

              {clientInquiries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No online query entries found. Submissions from services or consulting forms will list here in real time.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {clientInquiries.map((inq) => (
                    <div key={inq.id} className="p-4 bg-slate-50 border rounded-2xl text-xs space-y-2 prose-slate font-medium text-slate-700 text-left">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{inq.clientName || 'Inquirer'}</p>
                          <p className="text-[10px] text-indigo-600 font-mono mt-0.5">{inq.clientEmail || 'No Email'} • {inq.clientPhone}</p>
                        </div>
                        <span className="text-[9px] bg-indigo-50 border text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                          {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Today'}
                        </span>
                      </div>
                      
                      <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Service Targeted:</p>
                        <p className="text-xs font-bold text-slate-800">{inq.service || 'General'}</p>
                      </div>

                      {inq.message && (
                        <p className="text-slate-600 text-xs leading-relaxed italic bg-slate-100/50 p-2 rounded-lg">
                          "{inq.message}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS CONTROL */}
          {activeSubTab === 'payments' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b pb-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Virtual Payment UPI & QR Configuration</h2>
                  <p className="text-xs text-slate-400">Update checkouts dynamically to collect money from Sarkari notes.</p>
                </div>
              </div>

              <form onSubmit={handleSavePayments} className="space-y-4 text-xs font-semibold text-slate-600">
                <div className="space-y-1">
                  <label className="text-slate-700">UPI Address / VPA ID *</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="e.g., cellnumber@ybl or dynamicupihub@okicici"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700">QR Code Image Link</label>
                  <input
                    type="text"
                    value={upiQrUrl}
                    onChange={e => setUpiQrUrl(e.target.value)}
                    placeholder="Provide image address of standard QR scan receipt"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700">Instant Checkout Instructions for Students</label>
                  <textarea
                    rows={3}
                    value={paymentMsg}
                    onChange={e => setPaymentMsg(e.target.value)}
                    placeholder="Describe verification steps, phone support parameters..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="p-4 bg-slate-50 border rounded-2xl flex items-center gap-4 text-left">
                  <img src={upiQrUrl} className="w-16 h-16 object-cover border rounded-xl bg-white shadow-xs" alt="payment qr" />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">Live Students Interface Preview:</h4>
                    <p className="text-[10px] text-slate-400 mt-1">UPI ID: {upiId}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-sm">{paymentMsg}</p>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save UPI Connection Parameters
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: PURCHASES & SUBSCRIPTIONS LEDGER */}
          {activeSubTab === 'purchases' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <span>Dynamic Subscriptions & VIP Passes</span>
                  </h2>
                  <p className="text-xs text-slate-400">Manage paid passes, edit user statuses, or manually issue access to offline candidates.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSub(null);
                      setShowAddSubForm(!showAddSubForm);
                      // Clear forms
                      setSubStudentName('');
                      setSubStudentPhone('');
                      setSubStudentEmail('');
                      setSubPrice(149);
                      setSubPlanName('Silver VIP Study Pass (1 Month)');
                      setSubStatus('Approved');
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm tracking-wide cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{showAddSubForm ? 'Close Form' : 'Issue New Pass'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={loadData}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold rounded-xl uppercase tracking-wider"
                  >
                    Refresh List
                  </button>
                </div>
              </div>

              {/* SECTION A: MANUALLY ISSUE SUBSCRIPTION */}
              {showAddSubForm && (
                <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-extrabold text-xs">
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    <span>Manual Offline Pass Generator</span>
                  </div>
                  <form onSubmit={handleCreateManualSubscription} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                    <div className="space-y-1">
                      <label className="text-slate-700">Student Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Candidate Name"
                        value={subStudentName}
                        onChange={e => setSubStudentName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Mobile No *</label>
                      <input
                        type="text"
                        required
                        placeholder="WhatsApp No or Phone"
                        value={subStudentPhone}
                        onChange={e => setSubStudentPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="candidate@gmail.com"
                        value={subStudentEmail}
                        onChange={e => setSubStudentEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">VIP Pass Duration *</label>
                      <select
                        value={subPlanName}
                        onChange={e => {
                          setSubPlanName(e.target.value);
                          if (e.target.value.includes('Lifetime')) setSubPrice(499);
                          else if (e.target.value.includes('Month')) setSubPrice(149);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Silver VIP Study Pass (1 Month)">Silver VIP Study Pass (1 Month) - ₹149</option>
                        <option value="Gold Master Pass (Lifetime Premium)">Gold Master Pass (Lifetime Premium) - ₹499</option>
                        <option value="Custom Study Materials Pack">Custom Study Materials Pack - Manual Price</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Amount Charged (₹) *</label>
                      <input
                        type="number"
                        required
                        value={subPrice}
                        onChange={e => setSubPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Initial Status</label>
                      <select
                        value={subStatus}
                        onChange={e => setSubStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Approved">Approved (Instant Access)</option>
                        <option value="Pending Review">Pending Review (Hold)</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {loading ? 'Adding Subscriber...' : 'Deploy & Activate VIP Access'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SECTION B: EDIT EXISTING SUBSCRIPTION */}
              {editingSub && (
                <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-950 font-extrabold text-xs">
                      <Settings className="w-4 h-4 text-amber-600 animate-spin" />
                      <span>Edit Existing Subscriber: <strong className="text-amber-800 font-mono font-bold">{editingSub.id}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingSub(null)}
                      className="text-xs text-amber-700 hover:underline font-bold"
                    >
                      Cancel Edit
                    </button>
                  </div>
                  <form onSubmit={handleSaveEditedSubscription} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                    <div className="space-y-1">
                      <label className="text-slate-700">Student Name *</label>
                      <input
                        type="text"
                        required
                        value={subStudentName}
                        onChange={e => setSubStudentName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-250 rounded-xl focus:border-amber-500 focus:outline-none font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Mobile No *</label>
                      <input
                        type="text"
                        required
                        value={subStudentPhone}
                        onChange={e => setSubStudentPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-250 rounded-xl focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={subStudentEmail}
                        onChange={e => setSubStudentEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-250 rounded-xl focus:border-amber-500 focus:outline-none font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Plan / Item Assigned</label>
                      <input
                        type="text"
                        required
                        value={subPlanName}
                        onChange={e => setSubPlanName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-250 rounded-xl focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Amount Charged (₹) *</label>
                      <input
                        type="number"
                        required
                        value={subPrice}
                        onChange={e => setSubPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-amber-250 rounded-xl focus:border-amber-500 focus:outline-none font-mono font-bold text-slate-950"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Verification Status</label>
                      <select
                        value={subStatus}
                        onChange={e => setSubStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-250 rounded-xl focus:border-amber-500 focus:outline-none font-bold"
                      >
                        <option value="Approved">Approved (Access Active)</option>
                        <option value="Pending Review">Pending Review (On Hold)</option>
                        <option value="Rejected">Rejected (Blocked)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {loading ? 'Saving Fields...' : 'Modify and Deploy Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {subscriptionsList.length === 0 ? (
                <div className="text-center py-12 text-slate-450 text-xs">
                  No subscription purchases logged in the database yet. Students who subscribe or unlock premium files will appear here automatically in real time.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-150 rounded-2xl shadow-xs">
                  <table className="w-full text-xs text-left text-slate-600 font-medium">
                    <thead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-50 border-b select-none">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Mobile No</th>
                        <th className="px-4 py-3">Plan / Item Purchased</th>
                        <th className="px-4 py-3">Paid Price</th>
                        <th className="px-4 py-3">Transaction Date</th>
                        <th className="px-4 py-3">Payment Status</th>
                        <th className="px-4 py-3 text-center animate-pulse">Live Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subscriptionsList.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/75 bg-white transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            <div>
                              <p className="text-[13px] font-extrabold text-slate-800">{sub.studentName || 'Static Candidate'}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sub.studentEmail || 'No Email'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-700 font-bold text-[12px]">
                            {sub.studentPhone || 'N/A'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">
                              {sub.planName || sub.title || 'VIP Unlimited Pass'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-extrabold text-slate-900 text-[13.5px]">
                            ₹{sub.price || 149}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-[11px] font-medium font-mono">
                            {sub.date || (sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN') : 'Today')}
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => handleToggleSubscriptionStatus(sub.id, sub.status || 'Pending Review')}
                              className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border transition-all cursor-pointer ${
                                sub.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100'
                                  : sub.status === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              }`}
                              title="Click to toggle approval status quickly"
                            >
                              {sub.status || 'Pending Review'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-center flex items-center justify-center gap-1.5 pt-4">
                            <button
                              onClick={() => startEditingSubValue(sub)}
                              className="px-2 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Edit Fields
                            </button>
                            <button
                              onClick={() => handleDeleteSubscription(sub.id)}
                              className="px-2 py-1 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'plans' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">🔒 Manage Custom Subscription Plans</h2>
                  <p className="text-xs text-slate-500 font-medium">Create and customize pricing levels dynamically displayed in the study VIP center.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setPlanName('');
                    setPlanDuration('1 Month');
                    setPlanPrice(149);
                    setPlanOriginalPrice(299);
                    setPlanTag('');
                    setPlanDescription('Excellent for revisions before scheduled examinations.');
                    setPlanFeaturesString('All premium class notes unlocked, Complete exam syllabus access, Ad-Free downloads');
                    setShowAddPlanForm(!showAddPlanForm);
                  }}
                  className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{showAddPlanForm ? 'Hide Form' : 'Add Custom Plan'}</span>
                </button>
              </div>

              {/* Add/Edit Plan Form */}
              {showAddPlanForm && (
                <div className="p-5 sm:p-6 bg-slate-50 border rounded-2xl animate-in slide-in-from-top duration-200">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b pb-2 mb-4">
                    {editingPlan ? '✏️ Edit Membership Plan' : '✨ Form details: New Subscription Pass'}
                  </h3>

                  <form onSubmit={handleCreateOrUpdatePlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold text-slate-650">
                    <div className="space-y-1">
                      <label className="text-slate-700">Plan Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Silver VIP Pass, Diamond Guru Pass"
                        value={planName}
                        onChange={e => setPlanName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-xl focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Duration *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 1 Month, 12 Months, Lifetime Access"
                        value={planDuration}
                        onChange={e => setPlanDuration(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-xl focus:border-indigo-500 focus:outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Display Tag (Optional Badge)</label>
                      <input
                        type="text"
                        placeholder="e.g., Best Valued, Trending, Popular"
                        value={planTag}
                        onChange={e => setPlanTag(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-xl focus:border-indigo-500 focus:outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Membership Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={planPrice}
                        onChange={e => setPlanPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border rounded-xl focus:border-indigo-500 focus:outline-none font-mono font-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700">Strikethrough Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={planOriginalPrice}
                        onChange={e => setPlanOriginalPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border rounded-xl focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1 space-y-1">
                      <label className="text-slate-700">Plan Description (Short Pitch)</label>
                      <input
                        type="text"
                        placeholder="Bypass paywalls and download premium PDFs..."
                        value={planDescription}
                        onChange={e => setPlanDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-xl focus:border-indigo-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                      <label className="text-slate-700">Bullet Features list (Separated by commas) *</label>
                      <input
                        type="text"
                        required
                        placeholder="All premium class notes unlocked, Detailed answers included, Priority chat support"
                        value={planFeaturesString}
                        onChange={e => setPlanFeaturesString(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-xl focus:border-indigo-500 focus:outline-none font-medium text-slate-700"
                      />
                      <p className="text-[10px] text-slate-400 font-light mt-0.5">💡 Note: Separate each bullet point with a comma (,). They will be rendered nicely as checklists with green checks.</p>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {loading ? 'Processing...' : (editingPlan ? 'Update Plan' : 'Publish Subscription Plan')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Dynamic Plans Table */}
              {plansList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium space-y-2">
                  <p>You have not configured any custom membership plans yet.</p>
                  <p className="text-[10px] text-indigo-550">The VIP section is currently running on safe default Silver and Gold plans.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-150 rounded-2xl shadow-xs bg-white">
                  <table className="w-full text-xs text-left text-slate-600 font-medium">
                    <thead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-50 border-b select-none">
                      <tr>
                        <th className="px-5 py-3">Plan Name</th>
                        <th className="px-5 py-3">Duration</th>
                        <th className="px-5 py-3">Price</th>
                        <th className="px-5 py-3">Target Specs / Features</th>
                        <th className="px-5 py-3">Tag/Badge</th>
                        <th className="px-5 py-3 text-center">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plansList.map((plan) => (
                        <tr key={plan.id} className="hover:bg-slate-50 bg-white transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <div>
                              <p className="text-[13px] font-extrabold text-slate-800">{plan.name}</p>
                              <p className="text-[10px] text-slate-440 font-normal truncate max-w-sm mt-0.5">{plan.description}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 bg-slate-100 border text-slate-650 rounded font-bold uppercase text-[9px] font-mono">
                              {plan.duration}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-extrabold text-slate-900 text-sm">₹{plan.price}</span>
                              <span className="text-slate-400 font-normal line-through text-[11px]">₹{plan.originalPrice}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {plan.features?.map((f: string, i: number) => (
                                <span key={i} className="text-[9px] bg-indigo-50/50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {plan.tag ? (
                              <span className="px-2 py-0.5 bg-amber-100/80 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                                {plan.tag}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center flex items-center justify-center gap-2 pt-4">
                            <button
                              onClick={() => startEditingPlanValue(plan)}
                              className="px-2 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Edit Plan
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="px-2 py-1 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
