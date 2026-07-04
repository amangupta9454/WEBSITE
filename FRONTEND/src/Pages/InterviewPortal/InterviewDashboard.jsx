import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { clearAllUserData } from '../../utils/auth';
import InterviewDashboardContent from "./components/InterviewDashboardContent";
import BuyTokensModal from "./components/BuyTokensModal";
import toast from "react-hot-toast";

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

function InterviewDashboard() {
  const [sessions, setSessions] = useState([]);
  const [credits, setCredits] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [interviewEnabled, setInterviewEnabled] = useState(true);
  const [resumeEnabled, setResumeEnabled] = useState(true);
  const [isIntern, setIsIntern] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('interviewToken');
    if (!token) {
      navigate('/student-login');
      return;
    }
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      setIsLoading(true);
      const [creditsRes, sessionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/my-credits`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/my-sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      if (creditsRes.data.success) {
        setCredits(creditsRes.data.credits);
        setIsUnlimited(creditsRes.data.isUnlimited);
        if (creditsRes.data.user) {
          setUserData(creditsRes.data.user);
        }
        if (creditsRes.data.interviewEnabled !== undefined) {
          setInterviewEnabled(creditsRes.data.interviewEnabled);
        }
        if (creditsRes.data.resumeEnabled !== undefined) {
          setResumeEnabled(creditsRes.data.resumeEnabled);
        }
        if (creditsRes.data.role === 'intern') {
          setIsIntern(true);
          localStorage.setItem('interviewUserRole', 'intern');
          if (!localStorage.getItem('studentToken')) {
            localStorage.setItem('studentToken', token);
          }
        } else {
          setIsIntern(false);
          localStorage.setItem('interviewUserRole', 'interview_user');
        }
      }
      if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        clearAllUserData();
        navigate('/student-login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAllUserData();
    navigate('/');
  };

  const handleBuyPackage = async (pkg) => {
    setIsModalOpen(false);
    const token = localStorage.getItem('interviewToken');
    if (!token) return;

    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const toastId = toast.loading("Initializing payment...");
      
      const orderRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-payment/create-order`,
        { packageId: pkg.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(toastId);

      if (!orderRes.data.success) {
        toast.error("Failed to create order");
        return;
      }

      const { order, amount } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy',
        amount: order.amount,
        currency: "INR",
        name: "Code-A-Nova",
        description: pkg.title,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              toast.success("Payment Successful! Credits updated.");
              setCredits(verifyRes.data.credits);
              setIsUnlimited(verifyRes.data.isUnlimited);
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error(error);
            toast.error("An error occurred during verification");
          }
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="w-full">
      <InterviewDashboardContent 
        credits={credits} 
        isUnlimited={isUnlimited}
        interviewEnabled={interviewEnabled}
        resumeEnabled={resumeEnabled}
        sessions={sessions} 
        isLoading={isLoading} 
        onStartInterview={() => navigate('/interview-setup')} 
        isIntern={isIntern}
        userData={userData}
        onBuyClick={() => setIsModalOpen(true)}
      />
      <BuyTokensModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectPackage={handleBuyPackage} 
      />
    </div>
  );
}

export default InterviewDashboard;
