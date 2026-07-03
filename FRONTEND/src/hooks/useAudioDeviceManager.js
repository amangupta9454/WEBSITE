import { useEffect, useState } from 'react';
import { Logger } from '../utils/logger';

export function useAudioDeviceManager() {
  const [deviceChanged, setDeviceChanged] = useState(false);

  useEffect(() => {
    // Some browsers don't support mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) return;

    const handleDeviceChange = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        
        Logger.info('Audio Device Changed', { 
          deviceCount: audioInputDevices.length,
          devices: audioInputDevices.map(d => d.label || 'Unknown device') 
        });

        if (audioInputDevices.length === 0) {
          Logger.error('No Microphone Detected', 'Microphone unplugged during session');
        }

        setDeviceChanged(prev => !prev); // toggle to trigger reactivity
      } catch (err) {
        Logger.error('Failed to enumerate devices', err);
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  return { deviceChanged };
}
