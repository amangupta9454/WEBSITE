import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Sparkles, Zap, Gift, Coins, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const bonusPackages = [
  { id: 'pack_199', title: '219 Tokens', price: 199, bonus: '+20 FREE COINS (10%)', desc: 'Ideal for quick practice & applications.' },
  { id: 'pack_499', title: '549 Tokens', price: 499, bonus: '+50 FREE COINS (10%)', desc: 'Most popular for comprehensive preparation.', recommended: true },
  { id: 'pack_999', title: '1099 Tokens', price: 999, bonus: '+100 FREE COINS (10%)', desc: 'Maximum value for intensive career prep.' },
];

export default function BuyTokensModal({ isOpen, onClose, onSelectPackage }) {
  const [activeTab, setActiveTab] = useState('custom'); // 'packs' | 'custom'
  const [customAmount, setCustomAmount] = useState(100);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customAmount || customAmount < 10) {
      alert('Please enter a minimum recharge amount of ₹10.');
      return;
    }
    onSelectPackage({
      id: `custom_${customAmount}`,
      title: `${customAmount} Custom Tokens`,
      price: Number(customAmount)
    });
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[92vh] flex flex-col border border-slate-100 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-50/50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20 shadow-sm"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6 shrink-0 mt-2 sm:mt-0 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs uppercase tracking-wider mb-2 border border-indigo-100 shadow-xs">
                <Coins className="w-3.5 h-3.5 text-indigo-600" /> Unified Wallet Recharge
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Upgrade Your Tokens</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                Tokens can be used across the platform for Job Portal Premium, AI Interviews, and Resume Builder!
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-2 relative z-10 shrink-0 border border-slate-200/60 max-w-lg mx-auto w-full">
              <button
                type="button"
                onClick={() => setActiveTab('packs')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'packs' ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gift className="w-4 h-4 text-emerald-500 shrink-0" />
                Value Packs (+10% Bonus)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'custom' ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                Custom Amount (1₹ = 1 Token)
              </button>
            </div>

            <div className="overflow-y-auto px-2 pt-6 pb-3 flex-1 relative z-10">
              {activeTab === 'packs' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
                  {bonusPackages.map((pkg) => (
                    <div 
                      key={pkg.id} 
                      onClick={() => onSelectPackage(pkg)}
                      className={`relative p-5 sm:p-6 rounded-3xl border-2 cursor-pointer transition-all hover:-translate-y-1.5 flex flex-col justify-between ${
                        pkg.recommended 
                          ? 'border-indigo-600 bg-indigo-50/30 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-600/20' 
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg'
                      }`}
                    >
                      {pkg.recommended && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest py-1 px-4 rounded-full shadow-md whitespace-nowrap z-20 border border-white/20">
                          Most Popular
                        </div>
                      )}
                      <div>
                        <div className="mt-1 inline-block bg-emerald-100/90 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-300/60 mb-3.5 shadow-xs">
                          {pkg.bonus}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">
                          {pkg.title}
                        </h3>
                        <div className="text-2xl font-black text-indigo-600 mb-2.5 flex items-baseline gap-1">
                          ₹{pkg.price}
                          <span className="text-xs text-slate-400 font-bold">INR</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                          {pkg.desc}
                        </p>
                      </div>

                      <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-slate-700">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Check size={14} className="stroke-[3]" /> Instant Access
                        </span>
                        <span className="text-indigo-600 font-black group-hover:underline">Select &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleCustomSubmit} className="max-w-md mx-auto mt-2 bg-slate-50/90 rounded-3xl p-6 border border-slate-200 text-center space-y-5 shadow-inner">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">Enter Custom Amount</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Recharge whatever you need. Exact simple pricing at <span className="font-bold text-indigo-600">₹1 = 1 Token</span>.
                    </p>
                  </div>

                  <div className="relative max-w-xs mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-black text-lg">
                      ₹
                    </div>
                    <input
                      type="number"
                      min="10"
                      max="50000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xl font-black text-slate-800 outline-none text-center shadow-sm transition-colors"
                      placeholder="e.g. 100"
                    />
                  </div>

                  <div className="bg-indigo-50/80 rounded-2xl p-4 border border-indigo-100 text-left flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">You Will Receive:</span>
                      <span className="text-xl font-black text-indigo-700">{customAmount || 0} Tokens</span>
                    </div>
                    <div className="bg-indigo-600 text-white p-2.5 rounded-xl">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-base shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5 fill-current text-amber-300" />
                    Buy {customAmount || 0} Custom Tokens (₹{customAmount || 0})
                  </button>
                  <p className="text-[11px] text-slate-400 font-medium">Minimum recharge amount is ₹10. Secure checkout via Razorpay.</p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
