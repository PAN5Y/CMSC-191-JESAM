import React from 'react';
import { Link } from 'react-router';
import { Search, BookOpen, Upload, ShieldCheck, TrendingUp, ChevronRight, Mail, Facebook, MapPin, Globe } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-['Public_Sans',sans-serif]">
      {/* Top Navbar (Matching Sidebar Blue) */}
      <nav className="bg-[#3f4b7e] px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <img 
            src="logos\UPLB LOGO w SESAM White text.png" 
            alt="UPLB SESAM" 
            className="h-20 w-auto"
          />
          <div className="h-8 w-[1px] bg-white/20 hidden md:block"></div>
          <span className="font-['Newsreader',serif] text-xl text-white hidden md:block tracking-wide">JESAM</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex gap-6 text-white/80 text-sm font-medium">
            <a href="/about" className="hover:text-[#F5C344] transition">About</a>
            <a href="/archive" className="hover:text-[#F5C344] transition">Archive</a>
          </div>
          <Link to="/login">
            <button className="px-5 py-2 bg-[#F5C344] text-[#3f4b7e] font-bold rounded text-sm hover:bg-yellow-400 transition shadow-md">
              LOGIN
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-[#3f4b7e] py-24 px-6 overflow-hidden">
        {/* Subtle Decorative Background Element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-20"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center md:text-left">
          <h1 className="font-['Newsreader',serif] text-4xl md:text-6xl text-white mb-6 leading-tight">
            Advancing Scientific Excellence, <br />
            <span className="text-[#F5C344]">Respecting the Limits of Nature.</span>
            </h1>
          <p className="text-lg text-white/80 mb-10 max-w-2xl leading-relaxed">
            JESAM is the official knowledge platform of UPLB SESAM, dedicated to bridging 
      scientific investigation, policy dialogue, and sustainable community action.
          </p>
          
          {/* Redirect Actions (Replaced Search Bar) */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
            {/* Primary Action: Go to Browse */}
            <Link to="/browse">
                <button className="w-full sm:w-auto px-8 py-4 bg-[#F5C344] text-[#3f4b7e] font-bold rounded shadow-lg hover:bg-yellow-400 transition flex items-center justify-center gap-3 group">
                <BookOpen className="w-5 h-5" /> 
                BROWSE JOURNALS
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </Link>

            <Link to="/submit" className="h-full">
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded hover:bg-white/10 transition flex items-center justify-center gap-3">
                <Upload className="w-5 h-5" /> SUBMIT NOW
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Statistics Bar */}
      <div className="bg-[#f8f9fa] border-b border-slate-200">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 py-8 px-6">
          {[
            { label: 'Avg. First Decision', value: '21 Days' },
            { label: 'Acceptance Rate', value: '24%' },
            { label: 'Indexed in', value: 'Scopus / WoS' },
            { label: 'Open Access', value: 'Full CC-BY' },
          ].map((stat, i) => (
            <div key={i} className="text-center md:border-r last:border-0 border-slate-200">
              <div className="text-xl font-bold text-[#3f4b7e]">{stat.value}</div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Research Area */}
      <main className="max-w-6xl mx-auto py-20 px-6 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-8 w-1 bg-[#F5C344]"></div>
            <h2 className="font-['Newsreader',serif] text-3xl text-[#3f4b7e]">Latest Publications</h2>
          </div>
          
          <div className="space-y-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="group cursor-pointer">
                <div className="text-[#F5C344] text-xs font-bold mb-2 tracking-widest uppercase">Research Article • Vol 24, Issue 2</div>
                <h3 className="font-['Newsreader',serif] text-2xl text-[#3f4b7e] group-hover:underline mb-3">
                  Analysis of Biodiversity Conservation in the Makiling Forest Reserve
                </h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  This study investigates the anthropogenic factors affecting the flora and fauna within the protected zones...
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="font-bold text-slate-700">Juan Dela Cruz, Maria Santos</span>
                  <span>Published Oct 2024</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KMS Sidebar */}
        <aside className="space-y-12">
          <div className="p-8 bg-[#3f4b7e] rounded-xl text-white shadow-xl shadow-[#3f4b7e]/20">
            <h3 className="font-['Newsreader',serif] text-xl mb-4 text-[#F5C344]">For Reviewers</h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              Help us maintain the highest scientific standards. Join our panel of expert reviewers.
            </p>
            <button className="w-full py-3 border border-[#F5C344] text-[#F5C344] font-bold rounded text-xs hover:bg-[#F5C344] hover:text-[#3f4b7e] transition">
              BECOME A REVIEWER
            </button>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
              <TrendingUp className="w-4 h-4 text-[#F5C344]" /> Trending Knowledge
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Watershed Management', 'Climate Adaptation', 'Solid Waste', 'UPLB SESAM', 'Agroforestry'].map(topic => (
                <span key={topic} className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200 cursor-pointer hover:bg-[#F5C344]/10 transition">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Section */}
        <footer className="bg-[#1a1f33] text-white/60 py-16 px-6 border-t-4 border-[#F5C344] mt-auto font-['Public_Sans',sans-serif]">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
            
            {/* 1. Identity & Partnerships Section */}
            <div className="space-y-8">
                <div>
                <img 
                    src="logos\UPLB LOGO w SESAM White text.png" 
                    alt="UPLB SESAM" 
                    className="h-14 w-auto mb-4 grayscale brightness-200 opacity-80"
                />
                <h3 className="font-['Newsreader',serif] text-xl text-white italic">JESAM</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">
                    Journal of Environmental Science and Management
                </p>
                </div>

                {/* KMS Partners - Shows Authority */}
                <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5C344]">
                    Indexed & Partnered With
                </h4>
                <div className="flex flex-wrap items-center gap-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <img src="/logos/Clarivate Analytics Web of Science logo.png" alt="Web of Science" className="h-6 w-auto" />
                    <img src="/logos/Elsevier Scopus logo.png" alt="Scopus" className="h-6 w-auto" />
                    <img src="/logos/Contrimetric Logo.png" alt="Contrimetric" className="h-6 w-auto" />
                </div>
                </div>
            </div>

            {/* 2. Contact Details Section (KMS Support) */}
            <div className="space-y-6">
                <h4 className="text-white font-bold text-sm border-b border-white/10 pb-2 inline-block uppercase tracking-wider">
                Contact Information
                </h4>
                <ul className="space-y-5 text-sm">
                <li className="flex items-start gap-4 group">
                    <MapPin className="w-5 h-5 text-[#F5C344] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="leading-relaxed">
                    School of Environmental Science and Management (SESAM)<br />
                    University of the Philippines Los Baños<br />
                    College, 4031, Laguna, Philippines
                    </span>
                </li>
                <li className="flex items-center gap-4 group">
                    <Mail className="w-5 h-5 text-[#F5C344] shrink-0 group-hover:scale-110 transition-transform" />
                    <a href="mailto:jesam.uplb@up.edu.ph" className="hover:text-white transition-colors">
                    jesam.uplb@up.edu.ph
                    </a>
                </li>
                <li className="flex items-center gap-4 group">
                    <Facebook className="w-5 h-5 text-[#F5C344] shrink-0 group-hover:scale-110 transition-transform" />
                    <a href="https://facebook.com/uplbjesam/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    uplbjesam
                    </a>
                </li>
                </ul>
            </div>

            {/* 3. Legal & University Context Section */}
            <div className="flex flex-col md:items-end space-y-8 md:text-right">
                <div className="space-y-4">
                <h4 className="text-white font-bold text-sm border-b border-white/10 pb-2 inline-block md:border-b-0 md:pb-0 uppercase tracking-wider">
                    About the Publisher
                </h4>
                <p className="text-sm leading-relaxed max-w-xs text-white/50">
                    Produced by the University of the Philippines Los Baños, 
                    dedicated to advancing environmental research through 
                    scientific excellence and policy dialogue in line with 
                    the aspirations of the Filipino people.
                </p>
                </div>

                <div className="pt-8 border-t border-white/10 w-full flex flex-col md:items-end">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-2">
                    © {new Date().getFullYear()} ALL RIGHTS RESERVED
                </p>
                <p className="text-sm font-semibold text-white/80">
                    University of the Philippines Los Baños
                </p>
                </div>
            </div>

            </div>
        </div>
        </footer>
    </div>
  );
};

export default LandingPage;