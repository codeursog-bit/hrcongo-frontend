import React from 'react';
import { XCircle } from 'lucide-react';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Add New Company</h2>
          <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-500 hover:text-white transition-colors" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Wizard Steps */}
          <div className="flex items-center mb-8 px-8">
             <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-red/20">1</div>
             <div className="flex-1 h-px bg-gray-700 mx-4"></div>
             <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm border border-gray-700">2</div>
             <div className="flex-1 h-px bg-gray-700 mx-4"></div>
             <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm border border-gray-700">3</div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Legal Name <span className="text-brand-red">*</span></label>
                  <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-600" placeholder="e.g. Acme Corp SA" />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">RCCM Number <span className="text-brand-red">*</span></label>
                  <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-600" placeholder="CG-BZV-..." />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Region</label>
                  <div className="relative">
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none appearance-none cursor-pointer hover:border-gray-600 focus:border-brand-red transition-all">
                        <option>Brazzaville</option>
                        <option>Pointe-Noire</option>
                        <option>Dolisie</option>
                        <option>Oyo</option>
                        <option>Other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-700 pl-2">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin Email <span className="text-brand-red">*</span></label>
                  <input type="email" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-600" placeholder="admin@company.com" />
               </div>
            </div>

            <div className="pt-6 border-t border-gray-800">
              <h3 className="text-sm font-bold text-white mb-4">Select Subscription Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="border border-brand-red/50 bg-brand-red/10 p-4 rounded-xl cursor-pointer ring-1 ring-brand-red relative group">
                    <div className="absolute top-2 right-2 w-2 h-2 bg-brand-red rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                    <div className="font-bold text-white group-hover:text-brand-red transition-colors">Pro</div>
                    <div className="text-xs text-brand-red/80 mt-1 font-mono">30,000 FCFA</div>
                    <div className="text-[10px] text-gray-400 mt-3 border-t border-brand-red/20 pt-2">Up to 50 employees</div>
                 </div>
                 <div className="border border-gray-700 bg-gray-800/50 p-4 rounded-xl cursor-pointer hover:border-gray-500 hover:bg-gray-800 transition-all">
                    <div className="font-bold text-white">Starter</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">15,000 FCFA</div>
                    <div className="text-[10px] text-gray-500 mt-3 border-t border-gray-700 pt-2">Up to 10 employees</div>
                 </div>
                 <div className="border border-gray-700 bg-gray-800/50 p-4 rounded-xl cursor-pointer hover:border-gray-500 hover:bg-gray-800 transition-all">
                    <div className="font-bold text-white">Enterprise</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">Custom</div>
                    <div className="text-[10px] text-gray-500 mt-3 border-t border-gray-700 pt-2">Unlimited</div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button className="px-6 py-2.5 bg-brand-red hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transform hover:-translate-y-0.5">
            Create Company
          </button>
        </div>
      </div>
    </div>
  );
};
