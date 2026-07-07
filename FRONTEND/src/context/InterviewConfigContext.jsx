import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const InterviewConfigContext = createContext();

/**
 * Frontend Decorator: Maps backend DB modes to React components and Routes.
 * This satisfies the routing architecture requirement without polluting the MongoDB Schema.
 */
const ROUTING_METADATA = {
  Standard: {
    route: '/interview-setup',
    componentKey: 'InterviewActive',
    resumeRoute: '/interview-active'
  },
  Panel: {
    route: '/interview-setup',
    componentKey: 'PanelInterviewActive',
    resumeRoute: '/panel-interview-active'
  }
};

export const InterviewConfigProvider = ({ children }) => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      // We don't necessarily need a token just to see the configs, but we pass it if available
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('adminToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-config`, { headers });
      
      if (res.data.success) {
        // Decorate the backend configs with the frontend routing metadata
        const decoratedConfigs = res.data.configs.map(config => {
          const routingInfo = ROUTING_METADATA[config.modeId] || {
             route: '/interview-setup',
             componentKey: 'InterviewActive',
             resumeRoute: '/interview-active'
          };
          return { ...config, ...routingInfo };
        });
        setConfigs(decoratedConfigs);
      }
    } catch (err) {
      console.error('Failed to fetch interview configs:', err);
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const getConfig = (modeId) => {
    return configs.find(c => c.modeId === modeId) || null;
  };

  const refreshConfigs = () => {
    fetchConfigs();
  };

  return (
    <InterviewConfigContext.Provider value={{ configs, loading, error, getConfig, refreshConfigs }}>
      {children}
    </InterviewConfigContext.Provider>
  );
};

export const useInterviewConfig = () => {
  const context = useContext(InterviewConfigContext);
  if (context === undefined) {
    throw new Error('useInterviewConfig must be used within an InterviewConfigProvider');
  }
  return context;
};
