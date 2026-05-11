import { Mail, Facebook, MapPin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          
          {/* Logo Section - Highlighting Partnerships */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 text-center md:text-left">
              Indexed & Partnered With
            </h3>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src="/logos/Clarivate Analytics Web of Science logo.png" alt="Web of Science" className="h-8 w-auto" />
              <img src="/logos/Elsevier Scopus logo.png" alt="Scopus" className="h-8 w-auto" />
              <img src="/logos/Contrimetric Logo.png" alt="Contrimetric" className="h-8 w-auto" />
            </div>
          </div>

          {/* Contact Details - With Icons */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Contact Information</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>
                  School of Environmental Science and Management (SESAM)<br />
                  University of the Philippines Los Baños<br />
                  College, 4031, Laguna, Philippines
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href="mailto:jesam.uplb@up.edu.ph" className="hover:text-primary hover:underline transition-colors">
                  jesam.uplb@up.edu.ph
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-primary shrink-0" />
                <a href="https://facebook.com/uplbjesam/" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors">
                  uplbjesam
                </a>
              </li>
            </ul>
          </div>

          {/* Copyright and Legal */}
          <div className="flex flex-col items-center md:items-end justify-between h-full space-y-4 md:text-right">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm italic">JESAM</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Journal of Environmental Science and Management
              </p>
            </div>
            <div className="pt-4 border-t border-slate-200 w-full md:w-auto">
              <p className="text-[11px] text-slate-400 uppercase tracking-tighter">
                © {new Date().getFullYear()} All Rights Reserved
              </p>
              <p className="text-xs font-medium text-slate-600">
                University of the Philippines Los Baños
              </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}