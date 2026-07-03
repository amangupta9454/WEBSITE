import React from 'react';
import ReactDOM from 'react-dom';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const packages = [
  { id: '50_tokens', title: '50 Tokens', price: 199, desc: 'Perfect for quick practice.' },
  { id: '100_tokens', title: '100 Tokens', price: 299, desc: 'Most popular for comprehensive prep.', recommended: true },
  { id: '200_tokens', title: '200 Tokens', price: 499, desc: 'Great value for extensive practice.' },
  { id: 'unlimited', title: 'Unlimited Access', price: 999, desc: '1 month unlimited interviews.' },
];

export default function BuyTokensModal({ isOpen, onClose, onSelectPackage }) {
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[95vh] flex flex-col"
        >
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-4 sm:mb-8 shrink-0 mt-2 sm:mt-0">
            <h2 className="text-xl sm:text-3xl font-black text-slate-800 mb-1 sm:mb-2">Upgrade Your Practice</h2>
            <p className="text-xs sm:text-base text-slate-500 font-medium">Choose a token package that fits your goals.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto px-1 pb-2">
            {packages.map((pkg) => (
              <div 
                key={pkg.id} 
                onClick={() => onSelectPackage(pkg)}
                className={`relative p-3 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-1 ${
                  pkg.recommended 
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' 
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                {pkg.recommended && (
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-0.5 px-2 sm:py-1 sm:px-3 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="flex justify-between items-start mb-1 sm:mb-2">
                  <h3 className={`text-base sm:text-lg font-bold ${pkg.recommended ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {pkg.title}
                  </h3>
                  <div className={`text-lg sm:text-xl font-black ${pkg.recommended ? 'text-indigo-600' : 'text-slate-700'}`}>
                    ₹{pkg.price}
                  </div>
                </div>
                <p className={`text-[11px] sm:text-sm leading-tight ${pkg.recommended ? 'text-indigo-700/80' : 'text-slate-500'}`}>
                  {pkg.desc}
                </p>
                <div className="mt-2 sm:mt-4 flex items-center gap-2 text-[11px] sm:text-sm font-bold text-slate-700">
                  <div className={`p-1 rounded-full ${pkg.recommended ? 'bg-indigo-200 text-indigo-700' : 'bg-green-100 text-green-600'}`}>
                    <Check size={12} className="sm:w-3.5 sm:h-3.5" />
                  </div>
                  Instant Access
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
