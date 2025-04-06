import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Settings types and interfaces
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

// Default settings
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

// Context type
interface SettingsContextType {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsState>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
  
  // Initialize settings
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load settings from localStorage and eventually from server
  const loadSettings = async () => {
    try {
      // First load from localStorage
      const savedSettings = localStorage.getItem('userSettings');
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setOriginalSettings(parsedSettings);
      } else {
        // If not in localStorage, try to load from server
        try {
          const response = await apiRequest('GET', '/api/user-settings');
          const data = await response.json();
          
          if (data) {
            setSettings(data);
            setOriginalSettings(data);
            // Also save to localStorage
            localStorage.setItem('userSettings', JSON.stringify(data));
          }
        } catch (error) {
          // If API fails, use default settings
          console.warn('Failed to load settings from server, using defaults');
          setSettings(defaultSettings);
          setOriginalSettings(defaultSettings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error loading settings',
        description: 'Your preferences could not be loaded.',
        variant: 'destructive'
      });
    }
  };
  
  // Update a single setting
  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Update localStorage immediately for a better UX
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };
  
  // Save all settings to server
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      // First update localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Then update server
      try {
        await apiRequest('POST', '/api/user-settings', settings);
        setOriginalSettings(settings); // Update original settings
        
        toast({
          title: 'Settings saved',
          description: 'Your preferences have been updated.',
        });
      } catch (error) {
        console.error('Failed to save settings to server:', error);
        // Even if server save fails, we've updated localStorage
        toast({
          title: 'Settings saved locally',
          description: 'Your preferences were saved to this device only.',
          variant: 'default'
        });
      }
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'Your preferences could not be saved.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset to default settings
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
    setOriginalSettings(defaultSettings);
    
    toast({
      title: 'Settings reset',
      description: 'All preferences have been reset to defaults.',
    });
  };
  
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

// Custom hook for using settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};