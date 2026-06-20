import React from 'react';
import {
  Youtube,
  Facebook,
  Instagram,
  MessageSquare,
  Users,
  ExternalLink,
  Sparkles,
  Phone,
  MessageCircle,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GroupsSocialSection() {
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const socialLinks = [
    {
      name: 'YOUTUBE ACADEMY',
      description: 'Official YouTube channel containing Hindi speed typing lessons, computer operator guidelines, notes reviews, and web development ideas.',
      url: 'https://youtube.com/@santoh8988?si=EuLdD0cbUAkeMpPJ',
      metric: '10,000+ Subscribers',
      cta: 'Subscribe Channel',
      icon: Youtube,
      color: 'bg-red-500 hover:bg-red-605 text-white shadow-lg shadow-red-500/10'
    },
    {
      name: 'FACEBOOK PAGE',
      description: 'Join my social page to get instant exam results dates, class note schedules, and state government vacancy declarations.',
      url: 'https://www.facebook.com/Santosh893588?mibextid=ZbWKwL',
      metric: '4,500+ Active Members',
      cta: 'Join Facebook Page',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-650 text-white shadow-lg shadow-blue-600/10'
    },
    {
      name: 'INSTAGRAM BLOGS',
      description: 'Check daily Reels and post snippets highlighting key shortcuts, math formulas, and motivation quotes!',
      url: 'https://www.instagram.com/wanted_8935?igsh=eTljajFtd29kdXF2',
      metric: '5,000+ Followers',
      cta: 'Follow Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/10'
    },
    {
      name: 'TELEGRAM DISPATCH',
      description: 'Instant PDF books downloads center. Receive free syllabi trackers, class notes documents, and practice codes files.',
      url: 'https://t.me/santoh8988', // Standard fallback channel format
      metric: '3,200+ Aspirants',
      cta: 'Join Telegram Channel',
      icon: MessageSquare,
      color: 'bg-sky-500 hover:bg-sky-550 text-white shadow-lg shadow-sky-500/10'
    },
    {
      name: 'WHATSAPP BROADCAST',
      description: 'Receive real-time recruitment notices alerts and customized web service quotations directly on your phone.',
      url: 'https://wa.me/918935882550?text=Please%20add%20me%20to%20Digital%20Hub%20India%20competitive%20student%20updates.',
      metric: 'Live support',
      cta: 'Join WhatsApp Group',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-650 text-white shadow-lg shadow-emerald-600/10'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Upper header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
            STUDENT & CLIENT CHANNELS
          </span>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-1 display-title">
            Our Official Community Center
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Never miss an exam notification or web coding update. Join Santosh Tech across leading networks to gain free access to textbooks, guides, and priority chat support.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 border p-2 rounded-xl">
            20K+ TOTAL MEMBERS
          </span>
        </div>
      </div>

      {/* Grid channel cards list */}
      <div className="grid gap-6 md:grid-cols-2">
        {socialLinks.map((link, idx) => {
          const Icon = link.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3.5">
                  <span className="text-xs font-extrabold text-slate-800 tracking-tight font-display">{link.name}</span>
                  <span className="text-[11px] font-mono text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                    {link.metric}
                  </span>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm font-light leading-relaxed">
                  {link.description}
                </p>
              </div>

              <div className="mt-6">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerConfetti}
                  className={`w-full py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${link.color}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.cta}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional motivation banner */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-indigo-600/10 to-transparent blur-2xl"></div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] font-mono tracking-widest text-sky-400 font-bold uppercase">Candidate updates</span>
          </div>
          <h3 className="text-lg font-bold display-title">Prepare with Santosh Daily</h3>
          <p className="text-xs text-slate-300 w-full max-w-md font-light leading-relaxed">Join my YouTube broadcast and practice on our interactive typing test platform to pass clerical typing exams with flying colors!</p>
        </div>

        <a
          href="https://youtube.com/@santoh8988?si=EuLdD0cbUAkeMpPJ"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-white text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-slate-100 transition relative z-10 shrink-0 self-start md:self-center"
        >
          Explore Free Practice Video Guides Now
        </a>
      </div>
    </div>
  );
}
