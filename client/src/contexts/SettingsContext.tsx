import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface SettingsState {
  // App preferences
  language: 'en' | 'es';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  soundEffects: boolean;
  vibration: boolean;
  
  // Voice settings
  voiceSpeed: number;
  voiceVolume: number;
  voiceLanguage: 'en' | 'es';
  autoTranslate: boolean;
  lowPowerMode: boolean;
  
  // Notification settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyOnNewMessages: boolean;
  notifyOnJobsiteUpdates: boolean;
  notifyOnWeatherAlerts: boolean;
  notifyOnSafetyIncidents: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // Privacy & Security
  locationSharing: boolean;
  dataCollection: boolean;
  biometricLogin: boolean;
  autoLogout: number;
}

export const defaultSettings: SettingsState = {
  // App preferences
  language: 'en',
  theme: 'system',
  notifications: true,
  soundEffects: true,
  vibration: true,
  
  // Voice settings
  voiceSpeed: 50,
  voiceVolume: 80,
  voiceLanguage: 'en',
  autoTranslate: true,
  lowPowerMode: false,
  
  // Notification settings
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  notifyOnNewMessages: true,
  notifyOnJobsiteUpdates: true,
  notifyOnWeatherAlerts: true,
  notifyOnSafetyIncidents: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  
  // Privacy & Security
  locationSharing: true,
  dataCollection: true,
  biometricLogin: true,
  autoLogout: 30
};

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsState>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const loadSettings = useCallback(async () => {
    try {
      const response = await apiRequest('GET', '/api/user/settings');
      if (response.ok) {
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          const loadedSettings = { ...defaultSettings, ...data };
          setSettings(loadedSettings);
          setOriginalSettings(loadedSettings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings. Using defaults.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const saveSettings = useCallback(async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      // Use setTimeout to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, this would be an actual API call:
      // const response = await apiRequest('POST', '/api/user/settings', settings);
      
      setOriginalSettings(settings);
      
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated.',
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [settings, hasChanges, toast]);
  
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    setOriginalSettings(defaultSettings);
    toast({
      title: 'Settings Reset',
      description: 'Your preferences have been reset to default values.',
      duration: 2000
    });
  }, [toast]);
  
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  // Apply theme setting to the document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    if (settings.theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemPrefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);
  
  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      saveSettings,
      loadSettings,
      resetSettings,
      isSaving,
      hasChanges
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};