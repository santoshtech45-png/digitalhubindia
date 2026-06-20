import React, { useState, useRef, useEffect } from 'react';
import {
  ImageIcon,
  Download,
  Calendar,
  Sparkles,
  Camera,
  Crop,
  Shield,
  Clock,
  Printer,
  ChevronRight,
  FileImage,
  Sliders,
  Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImageToolsSectionProps {
  activeTab?: 'merger' | 'age' | 'bg-remover';
  setActiveTab?: (tab: 'merger' | 'age' | 'bg-remover') => void;
  currentUser?: any;
  requireAuth?: (action: () => void, message: string) => void;
}

export default function ImageToolsSection({ activeTab: propActiveTab, setActiveTab: propSetActiveTab, currentUser, requireAuth }: ImageToolsSectionProps = {}) {
  const [localActiveTab, setLocalActiveTab] = useState<'merger' | 'age' | 'bg-remover'>('merger');

  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  // --- 1. Photo Signature Merger State ---
  const [mPhoto, setMPhoto] = useState<string | null>(null);
  const [mSig, setMSig] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [photoDate, setPhotoDate] = useState('');
  const [canvasWidth, setCanvasWidth] = useState(350);
  const [canvasHeight, setCanvasHeight] = useState(450);
  const [photoRatio, setPhotoRatio] = useState(70); // % height taken by photo
  const mergerCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- 2. Age Calculator State ---
  const [dob, setDob] = useState('2000-01-01');
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0]);
  const [ageReport, setAgeReport] = useState<any | null>(null);

  // --- 3. Background Remover State ---
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgImageName, setBgImageName] = useState('');
  const [threshold, setThreshold] = useState(20);
  const [targetColor, setTargetColor] = useState('#ffffff');
  const [replacementColor, setReplacementColor] = useState('transparent'); // transparent, solid-blue, solid-white
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  };

  // --- PHOTO SIGNATURE MERGER DRAWING ---
  useEffect(() => {
    if (activeTab === 'merger' && mergerCanvasRef.current) {
      drawMergedCanvas();
    }
  }, [activeTab, mPhoto, mSig, candidateName, photoDate, canvasWidth, canvasHeight, photoRatio]);

  const drawMergedCanvas = () => {
    const canvas = mergerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw thin gray border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    const photoHeight = Math.floor((canvasHeight * photoRatio) / 100);
    const signatureHeight = canvasHeight - photoHeight;

    // Load photo
    if (mPhoto) {
      const imgPhoto = new Image();
      imgPhoto.src = mPhoto;
      imgPhoto.onload = () => {
        // Draw photo centered with cover aspect
        const ratio = Math.max(canvasWidth / imgPhoto.width, photoHeight / imgPhoto.height);
        const w = imgPhoto.width * ratio;
        const h = imgPhoto.height * ratio;
        const x = (canvasWidth - w) / 2;
        const y = (photoHeight - h) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(2, 2, canvasWidth - 4, photoHeight - 2);
        ctx.clip();
        ctx.drawImage(imgPhoto, x, y, w, h);
        ctx.restore();

        // Draw name overlay if exists in the photo space
        if (candidateName.trim() || photoDate.trim()) {
          const overlayHeight = 35;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(2, photoHeight - overlayHeight, canvasWidth - 4, overlayHeight);

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          if (candidateName && photoDate) {
            ctx.fillText(candidateName.toUpperCase(), canvasWidth / 2, photoHeight - 20);
            ctx.font = '9px monospace';
            ctx.fillText(`DOB/DOP: ${photoDate}`, canvasWidth / 2, photoHeight - 8);
          } else if (candidateName) {
            ctx.fillText(candidateName.toUpperCase(), canvasWidth / 2, photoHeight - 12);
          } else {
            ctx.font = '10px monospace';
            ctx.fillText(`DOP: ${photoDate}`, canvasWidth / 2, photoHeight - 12);
          }
        }

        // Now draw signature below
        drawSignature(ctx, photoHeight, signatureHeight);
      };
    } else {
      // Photo placeholder
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(4, 4, canvasWidth - 8, photoHeight - 4);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Candidate Photograph', canvasWidth / 2, photoHeight / 2 - 5);
      ctx.font = '10px sans-serif';
      ctx.fillText('(Passport Size, Max 50KB)', canvasWidth / 2, photoHeight / 2 + 15);

      // Now draw signature below
      drawSignature(ctx, photoHeight, signatureHeight);
    }
  };

  const drawSignature = (ctx: CanvasRenderingContext2D, yOffset: number, sigH: number) => {
    // Draw division line
    ctx.beginPath();
    ctx.moveTo(0, yOffset);
    ctx.lineTo(canvasWidth, yOffset);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (mSig) {
      const imgSig = new Image();
      imgSig.src = mSig;
      imgSig.onload = () => {
        const ratio = Math.min(canvasWidth / imgSig.width, sigH / imgSig.height);
        const w = imgSig.width * ratio * 0.9;
        const h = imgSig.height * ratio * 0.9;
        const x = (canvasWidth - w) / 2;
        const y = yOffset + (sigH - h) / 2;

        ctx.drawImage(imgSig, x, y, w, h);
      };
    } else {
      // Signature placeholder
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(4, yOffset + 4, canvasWidth - 8, sigH - 8);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Candidate Signature', canvasWidth / 2, yOffset + sigH / 2 + 3);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => setMPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => setMSig(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadMergedImage = () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => downloadMergedImage(), 'You must be logged in to download your combined passport photo and signature file.');
      return;
    }
    const canvas = mergerCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.85);
    link.download = `Merged_Photo_Signature_${Date.now()}.jpg`;
    link.click();
    triggerConfetti();
  };

  // --- AGE CALCULATOR LOGIC ---
  const calculateAge = (e: React.FormEvent) => {
    e.preventDefault();
    if (requireAuth && !currentUser) {
      requireAuth(() => calculateAge(e), 'You must be logged in to compile detailed age eligibility reports.');
      return;
    }
    const dobDate = new Date(dob);
    const targetDate = new Date(refDate);

    if (isNaN(dobDate.getTime()) || isNaN(targetDate.getTime())) {
      alert('Please enter valid dates.');
      return;
    }

    if (dobDate > targetDate) {
      alert('Date of Birth cannot be greater than Target Evaluation Date!');
      return;
    }

    let years = targetDate.getFullYear() - dobDate.getFullYear();
    let months = targetDate.getMonth() - dobDate.getMonth();
    let days = targetDate.getDate() - dobDate.getDate();

    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Total milliseconds elapsed
    const diffMs = targetDate.getTime() - dobDate.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const remainingDaysAfterWeeks = totalDays % 7;
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diffMs / (1000 * 60));

    // Next Birthday countdown
    const nextBirthday = new Date(targetDate.getFullYear(), dobDate.getMonth(), dobDate.getDate());
    if (nextBirthday < targetDate) {
      nextBirthday.setFullYear(targetDate.getFullYear() + 1);
    }
    const diffNextBdayMs = nextBirthday.getTime() - targetDate.getTime();
    const daysToNextBday = Math.ceil(diffNextBdayMs / (1000 * 60 * 60 * 24));

    // Indian exam checks
    const sscEligibility = (years >= 18 && years <= 30) ? 'ELIGIBLE (General Limits)' : 'Check recruitment table limits';

    // Zodiac and Zodiac animals
    const zodiacs = [
      { name: 'Capricorn', start: '12-22', end: '01-19' },
      { name: 'Aquarius', start: '01-20', end: '02-18' },
      { name: 'Pisces', start: '02-19', end: '03-20' },
      { name: 'Aries', start: '03-21', end: '04-19' },
      { name: 'Taurus', start: '04-20', end: '05-20' },
      { name: 'Gemini', start: '05-21', end: '06-20' },
      { name: 'Cancer', start: '06-21', end: '07-22' },
      { name: 'Leo', start: '07-23', end: '08-22' },
      { name: 'Virgo', start: '08-23', end: '09-22' },
      { name: 'Libra', start: '09-23', end: '10-22' },
      { name: 'Scorpio', start: '10-23', end: '11-21' },
      { name: 'Sagittarius', start: '11-22', end: '12-21' }
    ];

    const dobMonth = dobDate.getMonth() + 1;
    const dobDay = dobDate.getDate();
    const formattedDob = `${dobMonth.toString().padStart(2, '0')}-${dobDay.toString().padStart(2, '0')}`;
    let zodiacSign = 'Aries';
    for (const z of zodiacs) {
      if (formattedDob >= z.start || formattedDob <= z.end) {
        zodiacSign = z.name;
        break;
      }
    }

    setAgeReport({
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      remainingDaysAfterWeeks,
      totalHours,
      totalMinutes,
      daysToNextBday,
      sscEligibility,
      zodiacSign
    });
    triggerConfetti();
  };

  // --- PHOTO BACKGROUND REMOVER LOGIC ---
  const handleBgRemovalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBgImageName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (activeTab === 'bg-remover' && bgImage) {
      applyBgKeying();
    }
  }, [activeTab, bgImage, threshold, targetColor, replacementColor]);

  const applyBgKeying = () => {
    const canvas = filterCanvasRef.current;
    if (!canvas || !bgImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = bgImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original
      ctx.drawImage(img, 0, 0);

      const parsedTargetColor = hexToRgb(targetColor) || { r: 255, g: 255, b: 255 };
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Color difference calculation
        const diff = Math.sqrt(
          Math.pow(r - parsedTargetColor.r, 2) +
          Math.pow(g - parsedTargetColor.g, 2) +
          Math.pow(b - parsedTargetColor.b, 2)
        );

        if (diff < threshold) {
          if (replacementColor === 'transparent') {
            data[i + 3] = 0; // Transparent alpha
          } else if (replacementColor === 'solid-blue') {
            // Official sarkari blue background: RGB(0, 102, 204)
            data[i] = 0;
            data[i + 1] = 102;
            data[i + 2] = 204;
            data[i + 3] = 255;
          } else if (replacementColor === 'solid-white') {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = filterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const rgbToHex = (rNum: number, gNum: number, bNum: number) => {
        const comp = (c: number) => {
          const hex = c.toString(16);
          return hex.length === 1 ? '0' : '' + hex;
        };
        return '#' + comp(rNum) + comp(gNum) + comp(bNum);
      };

      const sampledHex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      setTargetColor(sampledHex);
    } catch (err) {
      console.error("Failed to read pixel data from index:", err);
    }
  };

  const downloadFilteredImage = () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => downloadFilteredImage(), 'You must be logged in to download your transparent background image file.');
      return;
    }
    const canvas = filterCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Filtered_Background_${bgImageName}`;
    link.click();
    triggerConfetti();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Category Tabs Header */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4 no-print">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('merger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'merger'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            📷 Photo & Signature Merger
          </button>
          <button
            onClick={() => setActiveTab('age')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'age'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            📅 Exam Age Calculator
          </button>
          <button
            onClick={() => setActiveTab('bg-remover')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bg-remover'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            ✂️ Passport BG Remover
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono tracking-wider font-semibold uppercase">
          Digital India Utility Suite
        </div>
      </div>

      {/* --- TAB 1: PHOTO & SIGNATURE MERGER --- */}
      {activeTab === 'merger' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Controls section */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border">COMPOSITOR</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Merge Photo & Signature</h2>
              <p className="text-slate-500 text-xs">Instantly combine credentials for official Indian application portals (SSC, UPSC, RRB).</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Photo upload */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block">1. Upload Candidate Photo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="merger-photo-input"
                  />
                  <label
                    htmlFor="merger-photo-input"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer text-slate-700 transition"
                  >
                    Select Photo File
                  </label>
                  {mPhoto && <span className="text-emerald-600 font-bold font-mono">✓ Loaded</span>}
                </div>
              </div>

              {/* Signature upload */}
              <div className="space-y-1.5 border-t pt-4">
                <label className="font-extrabold text-slate-700 block">2. Upload Signature</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                    id="merger-sig-input"
                  />
                  <label
                    htmlFor="merger-sig-input"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer text-slate-700 transition"
                  >
                    Select Signature File
                  </label>
                  {mSig && <span className="text-emerald-600 font-bold font-mono">✓ Loaded</span>}
                </div>
              </div>

              {/* Custom Text Boxes */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-extrabold text-slate-700">3. Form Sizing Text Overlays (Optional)</h4>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Applicant Name (ALL CAPS)</label>
                  <input
                    type="text"
                    placeholder="e.g. SANTOSH KUMAR"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Date of Photo (DOP)</label>
                  <input
                    type="text"
                    placeholder="e.g. 18-06-2026"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-lg"
                  />
                </div>
              </div>

              {/* Layout adjustments */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Layout Scaling Settings
                </h4>
                <div>
                  <label className="text-[11px] text-slate-400 font-mono flex justify-between">
                    <span>Photo height ratio:</span>
                    <span className="font-bold text-slate-700">{photoRatio}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="85"
                    value={photoRatio}
                    onChange={(e) => setPhotoRatio(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Preview Page */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200/60 shadow-inner">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Official Combined Canvas View</h3>

            {/* Combined canvas */}
            <div className="p-4 bg-white rounded-2xl border shadow shadow-indigo-600/5">
              <canvas
                ref={mergerCanvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="max-w-full rounded bg-white shadow-sm border border-slate-100"
              />
            </div>

            <button
              onClick={downloadMergedImage}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow hover:bg-indigo-700 transition"
            >
              <Download className="w-4 h-4" />
              Download Merged Application JPG
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 2: EXAM AGE CALCULATOR --- */}
      {activeTab === 'age' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* DOB Form input */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border">DATE UTILITY</span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Competitive Age Checker</h2>
                <p className="text-slate-500 text-xs text-light">Calculate your total months/days precisely to verify eligibility criteria before filing recruitment vacancies.</p>
              </div>

              <form onSubmit={calculateAge} className="space-y-4 text-xs font-semibold text-slate-600">
                <div>
                  <label className="block mb-1.5 text-slate-700 font-extrabold">Enter Your Date of Birth (DOB)</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-xl font-medium outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-slate-700 font-extrabold">Eligibility Reference Cut-off Date</label>
                  <input
                    type="date"
                    required
                    value={refDate}
                    onChange={(e) => setRefDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-xl font-medium outline-none text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Sarkari notifications often specify date thresholds (e.g. 01-08-2026 or 01-01-2026).</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow hover:bg-indigo-700 transition"
                >
                  Analyze Age Metrics
                </button>
              </form>
            </div>
          </div>

          {/* Results dashboard */}
          <div className="lg:col-span-7">
            {ageReport ? (
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="border-b pb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Calculated Age Records</h3>
                  <div className="text-3xl font-extrabold text-[#111] font-display mt-1">
                    {ageReport.years} Years, {ageReport.months} Months, {ageReport.days} Days
                  </div>
                </div>

                {/* Sub statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border">
                    <p className="text-slate-400">Total days lived</p>
                    <p className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{ageReport.totalDays.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border">
                    <p className="text-slate-400">Total weeks</p>
                    <p className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{ageReport.totalWeeks} w, {ageReport.remainingDaysAfterWeeks} d</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border">
                    <p className="text-slate-400">Total Hours elapsed</p>
                    <p className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{ageReport.totalHours.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Horoscope & Recruitment limits checks */}
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl grid sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <p className="text-indigo-950 font-extrabold flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                      Zodiac Astrological Sign
                    </p>
                    <p className="text-indigo-800 font-medium">Sign: <strong>{ageReport.zodiacSign}</strong>. Digital Hub India daily luck checks active!</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-indigo-950 font-extrabold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Next Birthday countdown
                    </p>
                    <p className="text-indigo-800">Only <strong>{ageReport.daysToNextBday} days</strong> left until your celebration!</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 text-xs no-print">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-1 hover:bg-slate-800 transition"
                  >
                    <Printer className="w-4 h-4 text-sky-400" />
                    Print Age Certificate
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-12 text-center text-slate-400 text-sm flex flex-col justify-center h-full">
                Enter your Date of Birth parameters in the panel to obtain exact eligibility profiles.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: PASSPORT BG REMOVER --- */}
      {activeTab === 'bg-remover' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border">CHROMA CHANNELS</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Passport Photo BG Customizer</h2>
              <p className="text-slate-500 text-xs">Omit solid background colors of your photo files, replacing them with white, transparent, or standard passport blue.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block">Choose Candidate Photograph</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBgRemovalUpload}
                  className="w-full text-slate-700"
                />
              </div>

              {bgImage && (
                <>
                  {/* Chroma color picker */}
                  <div className="space-y-1.5 border-t pt-4">
                    <label className="font-extrabold text-slate-700 block text-xs">Select background color to isolate</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={targetColor}
                        onChange={(e) => setTargetColor(e.target.value)}
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <input
                        type="text"
                        value={targetColor}
                        onChange={(e) => setTargetColor(e.target.value)}
                        className="flex-1 p-2 bg-slate-50 rounded border font-mono font-bold uppercase"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Click the box to pick the color you wish to replace (defaults to White #FFFFFF).</p>
                  </div>

                  {/* Settings slider & replacement colors */}
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-extrabold text-slate-700">Filter parameters</h4>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 flex justify-between">
                        <span>Tolerance slider:</span>
                        <span className="font-bold">{threshold}</span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                        className="w-full cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="font-extrabold text-slate-700 block">Replacement Background Style</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'transparent', label: 'Transparent' },
                          { id: 'solid-blue', label: 'Passport Blue' },
                          { id: 'solid-white', label: 'Passport White' }
                        ].map((bg) => (
                          <button
                            key={bg.id}
                            type="button"
                            onClick={() => setReplacementColor(bg.id)}
                            className={`py-2 px-1 rounded-lg border text-[11px] font-bold ${
                              replacementColor === bg.id
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            {bg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Result image box */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-inner">
            {bgImage ? (
              <div className="space-y-6 text-center max-w-full">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Canvas Result</h4>

                <div className="p-3 bg-white border rounded-2xl shadow">
                  <canvas
                    ref={filterCanvasRef}
                    onClick={handleCanvasClick}
                    className="max-w-full rounded border select-none max-h-96 cursor-crosshair hover:ring-2 hover:ring-indigo-500/50 transition-all"
                    title="Click or tap anywhere on the photo background to instantly key and replace that color!"
                  />
                </div>

                <button
                  onClick={downloadFilteredImage}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow hover:bg-indigo-700 self-center mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download Processed Photograph
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm flex flex-col justify-center h-full">
                No photograph imported. Upload a photo on the left sidebar to isolate visual background details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
