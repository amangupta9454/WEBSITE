import React from "react";
import MainLayout from '../layouts/MainLayout';
import { motion } from "framer-motion";
import { fadeUp } from '../animations/variants';
import { AlertCircle, ShieldAlert } from "lucide-react";

const Refund = () => {
  const policyPoints = [
    {
      title: "No Refunds",
      description: "All purchases and agreements are final. We do not offer refunds under any circumstances once a project contract has been signed or a transaction has been completed."
    },
    {
      title: "No Exchanges",
      description: "We do not provide exchange options for completed digital products or services. All sales are non-exchangeable after purchase or deployment."
    },
    {
      title: "Milestone Approvals",
      description: "For custom web development and digital solutions, clients are required to approve milestones. Once a milestone is approved and paid for, that payment is non-refundable."
    },
    {
      title: "Cancellation",
      description: "If a project is cancelled by the client before completion, any payments made up to that point are retained by Code-A-Nova to cover resources and time spent. No refunds will be issued for incomplete projects."
    },
    {
      title: "Limited Exceptions",
      description: "While our no-refund policy is absolute, we may consider action in rare circumstances such as technical failures caused exclusively by us, or incorrect charges due to billing errors."
    }
  ];

  return (
    <MainLayout>
      <div className="pt-32 pb-24 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-50 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-600 rounded-2xl mb-6 shadow-sm border border-red-100">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">Refund Policy</h1>
            <p className="text-gray-500 text-lg font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </motion.div>

          {/* Warning Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 bg-red-50 border border-red-100 rounded-3xl p-6 md:p-8 flex items-start gap-4"
          >
            <AlertCircle className="w-8 h-8 text-red-500 shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Important Notice</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                This refund policy is final and non-negotiable. By engaging with our services, you acknowledge that you have read, understood, and agree to this strict no-refund policy.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm"
          >
            <div className="space-y-12">
              {policyPoints.map((sec, idx) => (
                <div key={idx}>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{idx + 1}. {sec.title}</h3>
                  <p className="text-gray-600 font-medium leading-relaxed">{sec.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Refund;
