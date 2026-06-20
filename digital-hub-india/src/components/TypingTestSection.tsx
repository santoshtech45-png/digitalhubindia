import React, { useState, useEffect, useRef } from 'react';
import { TypingResult } from '../types';
import {
  Keyboard,
  Timer,
  RefreshCw,
  Award,
  BookOpen,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface TypingTestSectionProps {
  currentUser?: any;
  requireAuth?: (action: () => void, message: string) => void;
}

export default function TypingTestSection({ currentUser, requireAuth }: TypingTestSectionProps = {}) {
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [timerPreset, setTimerPreset] = useState<number>(60); // in seconds
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [testActive, setTestActive] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);

  const [paragraphs] = useState({
    english: [
      "The Indian Civil Services examinations mock standard formats. Speed and correctness play vital roles in clearing these clerical tasks. Working consistently daily on keyboards enables fingers to glide perfectly over target letters quickly. This typing test provides clear visual indicators to assist you in monitoring gross word rates and net word indices.",
      "Vite is a next-generation frontend tool which is extremely fast. React utilizes a reactive virtual DOM mechanism to update state smoothly. When combined with Tailwind, developers can coordinate pristine layout forms and animations efficiently. Building digital hubs is a great creative outlet for enthusiastic individuals.",
      "Digital Hub India strives to bring functional web applications to local communities. Helping aspiring students prepare for exams builds confidence and improves technical dexterity. Practicing typing regularly for just ten minutes every day is the easiest way to double your output speed."
    ],
    hindi: [
      "डिजिटल हब इंडिया के इस हिंदी टाइपिंग टेस्ट में आपका स्वागत है। भारतीय सरकारी परीक्षाओं में हिंदी टाइपिंग का बहुत महत्व है। प्रतिदिन नियमित गति से अभ्यास करने से आपकी उंगलियां कीबोर्ड पर तेजी से गति करने लगेंगी। टाइपिंग करते समय त्रुटियों को सुधारने का प्रयास करें ताकि आपकी शुद्धता का प्रतिशत उच्च बना रहे।",
      "भारत एक महान देश है जहाँ अनेक भाषाएँ और संस्कृतियाँ एक साथ सहअस्तित्व में रहती हैं। यहाँ शिक्षा और डिजिटल साक्षरता का प्रसार तेजी से हो रहा है। छात्र विभिन्न सरकारी प्रतियोगी परीक्षाओं जैसे एसएससी और रेलवे क्लर्क की तैयारी के लिए कीबोर्ड टाइपिंग का निरंतर अभ्यास कर रहे हैं।",
      "कंप्यूटर ऑपरेटर और क्लर्क बनने के लिए हिंदी टंकण की गति महत्वपूर्ण पात्रता मानी जाती है। इसमें सटीकता और कुल शब्दों प्रति मिनट की दर को ध्यान में रखकर मूल्यांकन किया जाता है। नियमित मॉक टेस्ट देने से परीक्षा के तनाव को कम किया जा सकता है।"
    ]
  });

  const [passageIndex, setPassageIndex] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [wpm, setWpm] = useState<number>(0);
  const [netWpm, setNetWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [errorCount, setErrorCount] = useState<number>(0);

  const [history, setHistory] = useState<TypingResult[]>([
    { wpm: 45, accuracy: 96, errors: 4, textLength: 200, timeSpent: 60, date: '18 June 2026' }
  ]);

  // Load dynamic candidate score sheets from Cloud Firestore
  useEffect(() => {
    if (currentUser) {
      const loadScores = async () => {
        try {
          const q = query(
            collection(db, 'users', currentUser.uid, 'typing_scores'),
            orderBy('createdAt', 'desc'),
            limit(15)
          );
          const snapshot = await getDocs(q);
          const loaded: TypingResult[] = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            loaded.push({
              wpm: d.wpm,
              accuracy: d.accuracy,
              errors: d.errors || 0,
              textLength: d.textLength || 100,
              timeSpent: d.timeSpent || 60,
              date: d.date || 'Saved'
            });
          });
          if (loaded.length > 0) {
            setHistory(loaded);
          }
        } catch (err) {
          console.error("Error reading scores from firestore: ", err);
        }
      };
      loadScores();
    } else {
      // Fallback clean historical mock values
      setHistory([
        { wpm: 45, accuracy: 96, errors: 4, textLength: 200, timeSpent: 60, date: '18 June 2026' }
      ]);
    }
  }, [currentUser]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activePassage = paragraphs[language][passageIndex] || paragraphs[language][0];

  // Start/Reset test
  const startTest = () => {
    setTestActive(true);
    setTestFinished(false);
    setTypedText('');
    setWpm(0);
    setNetWpm(0);
    setAccuracy(100);
    setErrorCount(0);
    setTimeLeft(timerPreset);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const resetTest = () => {
    setTestActive(false);
    setTestFinished(false);
    setTypedText('');
    setWpm(0);
    setNetWpm(0);
    setAccuracy(100);
    setErrorCount(0);
    setTimeLeft(timerPreset);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (testActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && testActive) {
      finishTest();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [testActive, timeLeft]);

  const finishTest = () => {
    setTestActive(false);
    setTestFinished(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Final calculation log
    const timeSpent = timerPreset - timeLeft || 1;
    const finalWpm = Math.round((typedText.length / 5) / (timeSpent / 60));
    const finalAccuracy = calculateAccuracy(typedText, activePassage);
    const finalErrors = calculateErrors(typedText, activePassage);
    const finalNetWpm = Math.max(0, finalWpm - Math.round(finalErrors / (timeSpent / 60)));

    setWpm(finalWpm);
    setNetWpm(finalNetWpm);
    setAccuracy(finalAccuracy);
    setErrorCount(finalErrors);

    // Save history
    const result: TypingResult = {
      wpm: finalWpm,
      accuracy: finalAccuracy,
      errors: finalErrors,
      textLength: typedText.length,
      timeSpent: timeSpent,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    setHistory((prev) => [result, ...prev]);

    // Save score automatically to Firestore if authenticated
    if (currentUser) {
      addDoc(collection(db, 'users', currentUser.uid, 'typing_scores'), {
        userId: currentUser.uid,
        wpm: finalWpm,
        accuracy: finalAccuracy,
        errors: finalErrors,
        textLength: typedText.length,
        timeSpent: timeSpent,
        date: result.date,
        createdAt: new Date().toISOString()
      }).catch((err) => {
        console.error('Error writing score to Cloud Firestore:', err);
      });
    }

    // Celebration
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > activePassage.length) return; // limit typing to passage size
    setTypedText(val);

    // Real time tracking
    const timeSpent = timerPreset - timeLeft || 1;
    const currentWpm = Math.round((val.length / 5) / (timeSpent / 60)) || 0;
    const currentErrors = calculateErrors(val, activePassage);
    const currentAccuracy = calculateAccuracy(val, activePassage);
    const currentNetWpm = Math.max(0, currentWpm - Math.round(currentErrors / (timeSpent / 60)));

    setWpm(currentWpm);
    setNetWpm(currentNetWpm);
    setAccuracy(currentAccuracy);
    setErrorCount(currentErrors);
  };

  const calculateErrors = (typed: string, target: string) => {
    let errs = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] !== target[i]) {
        errs++;
      }
    }
    return errs;
  };

  const calculateAccuracy = (typed: string, target: string) => {
    if (typed.length === 0) return 100;
    const errors = calculateErrors(typed, target);
    return Math.round(((typed.length - errors) / typed.length) * 100);
  };

  const printCertificate = () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => printCertificate(), 'Please Sign In or Register to print your verified typing speed certificate.');
      return;
    }
    const origTitle = document.title;
    document.title = `DigitalHubIndia_Typing_Certificate_${Date.now()}`;
    window.print();
    document.title = origTitle;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Upper Panel: Overview & Instructions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
            SARKARI MOCK TYPING TEST
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight display-title">
            Hindi & English Typing Speed Engine
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Prepare accurately for central/state clerk and data entry tests. Featuring instant feedback, Gross/Net WPM speed charts, and an official printable proficiency certificate!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 text-xs shrink-0 self-start md:self-center">
          <div className="bg-slate-50 border p-3 rounded-xl flex items-center gap-2">
            <Timer className="text-indigo-600 w-4.5 h-4.5" />
            <div>
              <p className="font-bold text-slate-600">Select Duration</p>
              <div className="flex gap-1.5 mt-1 font-semibold">
                {[60, 120, 300].map((t) => (
                  <button
                    key={t}
                    disabled={testActive}
                    onClick={() => { setTimerPreset(t); setTimeLeft(t); }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      timerPreset === t ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t / 60}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border p-3 rounded-xl flex items-center gap-2">
            <Keyboard className="text-sky-600 w-4.5 h-4.5" />
            <div>
              <p className="font-bold text-slate-600">Language Script</p>
              <div className="flex gap-1.5 mt-1 font-semibold">
                {(['english', 'hindi'] as const).map((lang) => (
                  <button
                    key={lang}
                    disabled={testActive}
                    onClick={() => { setLanguage(lang); setPassageIndex(0); resetTest(); }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                      language === lang ? 'bg-sky-600 text-white' : 'bg-white border text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Test Box */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Col: Speed metrics & Live text block */}
        <div className="md:col-span-2 space-y-6">
          {testFinished ? (
            /* Test summary dashboard */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">TYPING TEST COMPLETED Successfully!</h3>
                <p className="text-xs text-slate-400">Excellent metrics logged. Check your results badge below.</p>
              </div>

              {/* Stats breakdown */}
              <div className="grid grid-cols-3 gap-4 border-y py-6 max-w-md mx-auto">
                <div className="space-y-0.5">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">{netWpm}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NET WPM</p>
                </div>
                <div className="space-y-0.5 border-x">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">{accuracy}%</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ACCURACY</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-3xl font-extrabold text-rose-600 font-mono">{errorCount}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ERRORS SKIPPED</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={startTest}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow hover:bg-indigo-700 transition"
                >
                  Practice Again
                </button>
                <button
                  onClick={printCertificate}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow hover:bg-emerald-700 flex items-center gap-1.5 transition no-print"
                >
                  <Printer className="w-4 h-4" />
                  Print Score Certificate
                </button>
              </div>

              {/* Custom Printable speed Certificate inside paper */}
              <div className="hidden print-only print-card p-10 border-4 border-double border-slate-900 text-black rounded mx-auto text-center space-y-8 bg-white max-w-xl">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-widest uppercase">DIGITAL HUB INDIA</h2>
                  <p className="text-[10px] font-mono tracking-widest text-[#444] uppercase">TYPING PROFICIENCY CERTIFICATE</p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-light leading-relaxed text-slate-800">
                    This is to certify that an online candidate successfully completed an intensive evaluation typing session under digital exam parameters set by <strong className="font-bold">Santosh Tech Founder</strong>.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto bg-slate-50 p-4 rounded border-2 border-slate-900/10">
                    <p className="text-xs font-bold text-left">SPEED RATIO (NET WPM):</p>
                    <p className="text-xs font-mono font-extrabold text-right">{netWpm} WORDS / MINUTE</p>

                    <p className="text-xs font-bold text-left">ACCURACY PERCENTAGE:</p>
                    <p className="text-xs font-mono font-extrabold text-right">{accuracy}% CORRECTNESS</p>

                    <p className="text-xs font-bold text-left">EVALUATION SCRIPT:</p>
                    <p className="text-xs font-mono font-extrabold text-right uppercase">{language} SCRIPT</p>
                  </div>
                </div>

                <div className="pt-10 flex justify-between items-end border-t border-slate-200">
                  <div className="text-left">
                    <p className="text-[10px] font-mono font-bold text-slate-400">SESSION IDENTIFIER</p>
                    <p className="text-[11px] font-mono font-extrabold">DHI-TYP-{Date.now()}</p>
                  </div>
                  <div className="text-right">
                    <div className="h-0.5 w-24 bg-black mb-2"></div>
                    <p className="text-[10px] font-extrabold tracking-wide uppercase">SANTOSH TECH ADMIN</p>
                    <p className="text-[9px] text-slate-500 font-mono">Digital Signature Verified</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Live typing application */
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              {/* Dynamic passage layout indicator */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-sans tracking-wide text-sm leading-relaxed sm:text-base select-none max-h-48 overflow-y-auto">
                {activePassage.split('').map((char, index) => {
                  let charClass = 'text-slate-400';
                  if (index < typedText.length) {
                    charClass = typedText[index] === char ? 'text-emerald-600 bg-emerald-50 font-semibold' : 'text-rose-600 bg-rose-50 font-bold underline';
                  } else if (index === typedText.length && testActive) {
                    charClass = 'bg-indigo-100 text-indigo-700 animate-pulse outline outline-1 outline-indigo-400 p-0.5 rounded';
                  }
                  return (
                    <span key={index} className={`${charClass} transition-all`}>
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Textarea Input area */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  disabled={!testActive}
                  rows={4}
                  value={typedText}
                  onChange={handleTypingChange}
                  placeholder={testActive ? 'Start typing the passage text above here...' : 'Click the "Start Test Session" button below to begin.'}
                  className="w-full p-4 text-xs sm:text-sm border border-slate-200 rounded-2xl bg-white outline-none focus:border-indigo-500 font-sans disabled:bg-slate-50/50 resize-none shadow-inner"
                />
                {!testActive && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center rounded-2xl">
                    <button
                      onClick={startTest}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-xs tracking-tight flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <Keyboard className="w-4.5 h-4.5" />
                      Start Test Session
                    </button>
                  </div>
                )}
              </div>

              {/* Live operational logs */}
              {testActive && (
                <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                    <Timer className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>Timer left: <span className="text-indigo-600 text-sm font-extrabold">{timeLeft}s</span></span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 font-mono">
                    <span>NET speed: <span className="text-amber-600 font-extrabold">{netWpm}</span> WPM</span>
                    <span>Accuracy: <span className="text-emerald-600 font-extrabold">{accuracy}%</span></span>
                  </div>
                  <button
                    onClick={finishTest}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded text-[10px] font-bold"
                  >
                    Finish Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Passage selectors & History records */}
        <div className="space-y-6">
          {/* Passage browser list */}
          <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Practice Passage List
            </h3>
            <div className="space-y-2 text-xs">
              {paragraphs[language].map((p, idx) => (
                <button
                  key={idx}
                  disabled={testActive}
                  onClick={() => { setPassageIndex(idx); resetTest(); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2 ${
                    passageIndex === idx
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-semibold'
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200/60 font-mono flex items-center justify-center font-bold text-slate-600 shrink-0">{idx + 1}</span>
                  <span className="truncate">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User History charts */}
          <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Your Session Logs
              </h3>
              <button onClick={() => setHistory([])} className="text-[10px] hover:underline text-rose-500">Omit logs</button>
            </div>
            {history.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center text-slate-600 font-semibold">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-mono">{h.date}</p>
                      <p className="text-indigo-950 font-bold">{h.wpm} GROSS / {h.wpm - Math.round(h.errors / (h.timeSpent/60))} NET WPM</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono border font-extrabold">ACC {h.accuracy}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-slate-400">Complete tests to register speed tracks here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
