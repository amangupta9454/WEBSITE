import React from "react";
import { AlertCircle, Clock, CheckCircle, AlertTriangle, Shield, HelpCircle } from "lucide-react";

const Refund = () => {
  const policyPoints = [
    {
      id: 1,
      icon: AlertCircle,
      title: "No Refunds",
      description: "All purchases are final. We do not offer refunds under any circumstances once a transaction has been completed."
    },
    {
      id: 2,
      icon: AlertTriangle,
      title: "No Exchanges",
      description: "We do not provide exchange options for products or services. All sales are non-exchangeable after purchase."
    },
    {
      id: 3,
      icon: Clock,
      title: "No Returns",
      description: "Returned items are not accepted. Please carefully review your purchase before completing the transaction."
    },
    {
      id: 4,
      icon: Shield,
      title: "Final Purchase",
      description: "Once payment is processed and confirmed, the transaction is irreversible. Verify all details before checkout."
    }
  ];

  const beforePurchase = [
    "Review all product descriptions carefully",
    "Check pricing and included services",
    "Verify compatibility with your needs",
    "Read all terms and conditions",
    "Confirm your delivery address (if applicable)",
    "Ensure you understand the features included"
  ];

  const exceptions = [
    "Technical failures or service unavailability caused by us",
    "Incorrect charges or billing errors",
    "Unauthorized transactions or fraud"
  ];

  return (
    <section className="relative w-full min-h-screen py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-rose-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 bg-linear-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-red-300 text-sm font-medium">
              Important Policy Information
            </span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6 bg-linear-to-r from-red-400 via-rose-300 to-orange-400 text-transparent bg-clip-text leading-tight tracking-tight">
            Refund & Return Policy
          </h1>

          <p className="text-gray-400 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
            Please read our refund and return policy carefully before making a purchase. All sales are final.
          </p>
        </div>

        {/* Main Policy Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {policyPoints.map((point) => {
            const IconComponent = point.icon;
            const gradients = [
              "from-red-500 to-rose-500",
              "from-rose-500 to-orange-500",
              "from-orange-500 to-amber-500",
              "from-amber-500 to-red-500"
            ];

            return (
              <div
                key={point.id}
                className="group relative bg-linear-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 hover:border-red-500/30 rounded-3xl p-8 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-red-500/10"
              >
                <div className="absolute inset-0 bg-linear-to-br from-red-500/0 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-linear-to-br ${gradients[point.id - 1]} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-red-300 transition-colors">
                    {point.title}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    {point.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Before You Purchase Section */}
        <div className="relative group bg-linear-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-3xl p-8 md:p-12 transition-all duration-300 backdrop-blur-sm overflow-hidden mb-8">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/0 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-100">Review Before Purchasing</h3>
            </div>
            <p className="text-gray-300 text-lg mb-8">
              Since all sales are final, please verify the following before completing your purchase:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {beforePurchase.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Limited Exceptions */}
        <div className="relative group bg-linear-to-br from-blue-500/10 via-cyan-500/10 to-indigo-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-3xl p-8 md:p-12 transition-all duration-300 backdrop-blur-sm overflow-hidden mb-16">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-100">Limited Exceptions</h3>
            </div>
            <p className="text-gray-300 text-lg mb-8">
              While our no-refund policy is absolute, we may consider action in these rare circumstances:
            </p>
            <div className="space-y-4">
              {exceptions.map((exception, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="w-6 h-6 bg-blue-500/30 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <span className="text-gray-300">{exception}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-8 italic">
              Any action taken in these cases will be at our sole discretion and does not constitute acceptance of returns or refunds as a standard practice.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-100 mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I cancel my order after purchase?",
                a: "No. Once your purchase is confirmed and processed, the transaction cannot be cancelled or refunded."
              },
              {
                q: "What if I change my mind about my purchase?",
                a: "Unfortunately, we cannot accommodate changes of mind. All sales are final. Please carefully consider your purchase before completing the transaction."
              },
              {
                q: "Are there any circumstances where I can get a refund?",
                a: "Our no-refund policy is strict. The only exceptions are technical failures, service unavailability caused by us, or unauthorized/fraudulent transactions, which we will investigate individually."
              },
              {
                q: "Can I exchange a product for a different one?",
                a: "No. We do not offer exchanges. All purchases are final and cannot be exchanged for alternative products or services."
              },
              {
                q: "What if the product arrives damaged?",
                a: "Please contact us immediately with photographic evidence. We will assess the situation and may offer a replacement or credit at our sole discretion."
              },
              {
                q: "Is there a cooling-off period?",
                a: "No. Our no-refund, no-exchange policy is immediate upon purchase completion. There is no cooling-off or trial period."
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="group p-6 md:p-8 bg-linear-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 hover:border-orange-500/30 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5"
              >
                <h4 className="text-xl font-bold text-gray-100 mb-3 group-hover:text-orange-300 transition-colors">
                  {faq.q}
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Banner */}
        <div className="relative bg-linear-to-r from-red-500/20 via-rose-500/20 to-orange-500/20 border-2 border-red-500/40 rounded-3xl p-8 md:p-12 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-red-500/0 via-rose-500/10 to-orange-500/0 pointer-events-none"></div>
          <div className="relative z-10 flex gap-6">
            <div className="shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-100 mb-3">Important Notice</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                This refund and return policy is final and non-negotiable. By completing a purchase, you acknowledge that you have read, understood, and agree to this policy. We strongly recommend reviewing all product details, specifications, pricing, and terms before making any purchase. If you do not agree with this policy, please do not complete the transaction.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/40 border border-slate-700/50 rounded-full backdrop-blur-sm">
            <Shield className="w-5 h-5 text-red-400" />
            <span className="text-gray-400 text-sm">
              © {new Date().getFullYear()} - All Sales Final, No Refunds or Exchanges
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Refund;
