import { Mail, Facebook, MapPin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1a1f33] text-white/60 py-16 px-6 border-t-4 border-[#F5C344] mt-auto font-['Public_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
          
          {/* Logo & Partnerships Section */}
          <div className="space-y-8">
            <div>
              <img 
                src="/logos/UPLB LOGO w SESAM White text.png" 
                alt="UPLB SESAM" 
                className="h-14 w-auto mb-4 grayscale brightness-200 opacity-80"
              />
              <h3 className="font-['Newsreader',serif] text-xl text-white italic">JESAM</h3>
              <p className="text-xs uppercase tracking-widest text-white/40 mt-1">
                Journal of Environmental Science and Management
              </p>
            </div>

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

          {/* Contact Details Section */}
          <div className="space-y-6">
            <h4 className="text-white font-bold text-sm border-b border-white/10 pb-2 inline-block">
              Contact Information
            </h4>
            <ul className="space-y-4 text-sm">
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

          {/* Legal & University Section */}
          <div className="flex flex-col md:items-end space-y-8 md:text-right">
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm border-b border-white/10 pb-2 inline-block md:border-b-0 md:pb-0">
                About the Publisher
              </h4>
              <p className="text-sm leading-relaxed max-w-xs">
                Produced by the University of the Philippines Los Baños, 
                dedicated to advancing environmental research through 
                scientific excellence and policy dialogue.
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
  );
}