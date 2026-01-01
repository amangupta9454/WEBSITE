import { useEffect, useRef, useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Send, Loader, Clock } from 'lucide-react';

function Contact() {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState('');
  const observerRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = document.querySelectorAll('.reveal-section');
    sections.forEach((section) => {
      if (observerRef.current) {
        observerRef.current.observe(section);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage('');

    try {
      const formData = new FormData(formRef.current);
      const response = await fetch('https://getform.io/f/aejvldpb', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSubmitMessage('Message sent successfully! We will get back to you soon.');
        formRef.current.reset();
        setTimeout(() => setSubmitMessage(''), 5000);
      } else {
        setSubmitMessage('Failed to send message. Please try again.');
      }
    } catch {
      setSubmitMessage('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      <div
        id="hero"
        className={`reveal-section transition-all duration-1000 ${
          isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8 sm:pb-12">
          <div className="text-center">
            <div className="inline-block mb-4 mt-10">
              <span className="px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-medium border border-cyan-500/20">
                Contact Us
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              Let's Start a <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Conversation</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Have questions about our internship programs? We're here to help you take the next step in your career journey.
            </p>
          </div>
        </div>
      </div>

      <div
        id="contact-section"
        className={`reveal-section transition-all duration-1000 delay-200 ${
          isVisible('contact-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
            <div className="lg:col-span-3">
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-slate-800/50 shadow-2xl hover:border-slate-700/50 transition-all duration-300">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Send us a Message</h2>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      onFocus={() => setFocusedInput('name')}
                      onBlur={(e) => !e.target.value && setFocusedInput('')}
                      className="peer w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-transparent transition-all duration-300"
                      placeholder="Your Name"
                    />
                    <label
                      htmlFor="name"
                      className={`absolute left-4 transition-all duration-300 text-gray-400 pointer-events-none ${
                        focusedInput === 'name' || formRef.current?.name.value
                          ? '-top-2.5 text-xs bg-slate-900 px-2 text-cyan-400'
                          : 'top-3.5 text-sm'
                      } peer-focus:-top-2.5 peer-focus:text-xs peer-focus:bg-slate-900 peer-focus:px-2 peer-focus:text-cyan-400`}
                    >
                      Your Name
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      onFocus={() => setFocusedInput('email')}
                      onBlur={(e) => !e.target.value && setFocusedInput('')}
                      className="peer w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-transparent transition-all duration-300"
                      placeholder="Your Email"
                    />
                    <label
                      htmlFor="email"
                      className={`absolute left-4 transition-all duration-300 text-gray-400 pointer-events-none ${
                        focusedInput === 'email' || formRef.current?.email.value
                          ? '-top-2.5 text-xs bg-slate-900 px-2 text-cyan-400'
                          : 'top-3.5 text-sm'
                      } peer-focus:-top-2.5 peer-focus:text-xs peer-focus:bg-slate-900 peer-focus:px-2 peer-focus:text-cyan-400`}
                    >
                      Your Email
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      onFocus={() => setFocusedInput('subject')}
                      onBlur={(e) => !e.target.value && setFocusedInput('')}
                      className="peer w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-transparent transition-all duration-300"
                      placeholder="Subject"
                    />
                    <label
                      htmlFor="subject"
                      className={`absolute left-4 transition-all duration-300 text-gray-400 pointer-events-none ${
                        focusedInput === 'subject' || formRef.current?.subject.value
                          ? '-top-2.5 text-xs bg-slate-900 px-2 text-cyan-400'
                          : 'top-3.5 text-sm'
                      } peer-focus:-top-2.5 peer-focus:text-xs peer-focus:bg-slate-900 peer-focus:px-2 peer-focus:text-cyan-400`}
                    >
                      Subject
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows="4"
                      onFocus={() => setFocusedInput('message')}
                      onBlur={(e) => !e.target.value && setFocusedInput('')}
                      className="peer w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-transparent resize-none transition-all duration-300"
                      placeholder="Message"
                    ></textarea>
                    <label
                      htmlFor="message"
                      className={`absolute left-4 transition-all duration-300 text-gray-400 pointer-events-none ${
                        focusedInput === 'message' || formRef.current?.message.value
                          ? '-top-2.5 text-xs bg-slate-900 px-2 text-cyan-400'
                          : 'top-3.5 text-sm'
                      } peer-focus:-top-2.5 peer-focus:text-xs peer-focus:bg-slate-900 peer-focus:px-2 peer-focus:text-cyan-400`}
                    >
                      Your Message
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-[1.02]"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>

                  {submitMessage && (
                    <div
                      className={`p-4 rounded-xl text-center font-medium animate-in fade-in slide-in-from-top-2 ${
                        submitMessage.includes('success')
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {submitMessage}
                    </div>
                  )}
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-slate-800/50 shadow-2xl hover:border-slate-700/50 transition-all duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Get in Touch</h2>
                <div className="space-y-5">
                  <a
                    href="mailto:codenova31@gmail.com"
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-transparent hover:border-cyan-500/30 transition-all duration-300 group"
                  >
                    <div className="w-11 h-11 bg-linear-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center shrink-0 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-all duration-300">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-400 mb-1">Email</h3>
                      <p className="text-white group-hover:text-cyan-400 transition-colors duration-300">
                       codenova31@gmail.com
                      </p>
                    </div>
                  </a>


                  <a
                    href="https://wa.me/917880533908"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-transparent hover:border-emerald-500/30 transition-all duration-300 group"
                  >
                    <div className="w-11 h-11 bg-linear-to-br from-emerald-500/20 to-green-500/20 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-300">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-400 mb-1">WhatsApp</h3>
                      <p className="text-white group-hover:text-emerald-400 transition-colors duration-300">
                        +91 7880533908
                      </p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-transparent">
                    <div className="w-11 h-11 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center shrink-0 border border-orange-500/20">
                      <MapPin className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-400 mb-1">Office</h3>
                      <p className="text-white text-sm leading-relaxed">
                        Ghaziabad<br />
                        Uttar Pradesh, India 201009
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-800/50 shadow-2xl hover:border-slate-700/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-linear-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/20">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Business Hours</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-gray-400 text-sm">Monday - Friday</span>
                    <span className="text-cyan-400 font-medium text-sm">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-gray-400 text-sm">Saturday</span>
                    <span className="text-cyan-400 font-medium text-sm">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Sunday</span>
                    <span className="text-gray-600 font-medium text-sm">Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        id="map-section"
        className={`reveal-section transition-all duration-1000 delay-300 ${
          isVisible('map-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-16 sm:pb-20">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Visit Our Office</h2>
            <p className="text-gray-400 text-sm sm:text-base">Find us on the map and drop by anytime during business hours</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 shadow-2xl overflow-hidden hover:border-slate-700/50 transition-all duration-300">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3500.545251972305!2d77.49128877566565!3d28.673331882226368!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cf2c4cac27f99%3A0xd9961659aee6d5b2!2sHi-Tech%20Institute%20of%20Engineering%20%26%20Technology!5e0!3m2!1sen!2sin!4v1739723721387!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
              title="Office Location"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;



// new map 