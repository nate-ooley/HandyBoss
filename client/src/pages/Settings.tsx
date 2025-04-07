import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  ChevronLeft, 
  BellRing, 
  Volume2, 
  Globe, 
  Users, 
  Shield, 
  Smartphone, 
  Moon, 
  Sun, 
  Save,
  RefreshCw 
} from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import BossManCharacter from '@/components/BossManCharacter';
import { useSettings, SettingsState } from '@/contexts/SettingsContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Settings() {
  const [location, setLocation] = useLocation();
  const isMobile = useMobile();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('general');
  
  // Use the settings context instead of local state
  const { 
    settings, 
    updateSetting, 
    saveSettings, 
    resetSettings,
    isSaving,
    hasChanges
  } = useSettings();
  
  // Handle section navigation
  const navigateToSection = (section: string) => {
    setActiveSection(section);
    // This would scroll to the section in a more complex implementation
  };
  
  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-8 px-4 md:px-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLocation('/')} 
            className="flex items-center justify-center h-8 w-8 rounded-full bg-background border"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <BossManCharacter 
              mood="happy" 
              size={isMobile ? "xs" : "sm"} 
              className={isMobile ? "w-12 h-12" : "w-16 h-16"}
            />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Settings</h1>
              <p className="text-sm md:text-base text-muted-foreground">Customize your BossMan experience</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Settings Navigation Sidebar (Desktop) */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Button 
                    variant={activeSection === 'general' ? 'default' : 'ghost'} 
                    onClick={() => navigateToSection('general')}
                    className="w-full justify-start"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    General
                  </Button>
                  <Button 
                    variant={activeSection === 'voice' ? 'default' : 'ghost'} 
                    onClick={() => navigateToSection('voice')}
                    className="w-full justify-start"
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    Voice & Translation
                  </Button>
                  <Button 
                    variant={activeSection === 'notifications' ? 'default' : 'ghost'} 
                    onClick={() => navigateToSection('notifications')}
                    className="w-full justify-start"
                  >
                    <BellRing className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                  <Button 
                    variant={activeSection === 'security' ? 'default' : 'ghost'} 
                    onClick={() => navigateToSection('security')}
                    className="w-full justify-start"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Privacy & Security
                  </Button>
                  <Button 
                    variant={activeSection === 'about' ? 'default' : 'ghost'} 
                    onClick={() => navigateToSection('about')}
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    About
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Settings Navigation Tabs (Mobile) */}
          <div className="md:hidden flex overflow-x-auto pb-3 pt-1 scrollbar-hide">
            <Button 
              variant={activeSection === 'general' ? 'default' : 'outline'} 
              onClick={() => navigateToSection('general')}
              className="flex-shrink-0 rounded-full mr-2"
              size="sm"
            >
              <Globe className="mr-1 h-3.5 w-3.5" />
              General
            </Button>
            <Button 
              variant={activeSection === 'voice' ? 'default' : 'outline'} 
              onClick={() => navigateToSection('voice')}
              className="flex-shrink-0 rounded-full mr-2"
              size="sm"
            >
              <Volume2 className="mr-1 h-3.5 w-3.5" />
              Voice
            </Button>
            <Button 
              variant={activeSection === 'notifications' ? 'default' : 'outline'} 
              onClick={() => navigateToSection('notifications')}
              className="flex-shrink-0 rounded-full mr-2"
              size="sm"
            >
              <BellRing className="mr-1 h-3.5 w-3.5" />
              Alerts
            </Button>
            <Button 
              variant={activeSection === 'security' ? 'default' : 'outline'} 
              onClick={() => navigateToSection('security')}
              className="flex-shrink-0 rounded-full mr-2"
              size="sm"
            >
              <Shield className="mr-1 h-3.5 w-3.5" />
              Privacy
            </Button>
            <Button 
              variant={activeSection === 'about' ? 'default' : 'outline'} 
              onClick={() => navigateToSection('about')}
              className="flex-shrink-0 rounded-full"
              size="sm"
            >
              <Users className="mr-1 h-3.5 w-3.5" />
              About
            </Button>
          </div>
          
          {/* Settings Content */}
          <div className="md:col-span-3">
            {/* General Settings */}
            {activeSection === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure application preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="language">Language</Label>
                        <p className="text-xs text-muted-foreground">
                          Set your preferred app language
                        </p>
                      </div>
                      <Select
                        value={settings.language}
                        onValueChange={(value: 'en' | 'es') => updateSetting('language', value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="theme">Theme</Label>
                        <p className="text-xs text-muted-foreground">
                          Choose between light, dark, or system theme
                        </p>
                      </div>
                      <Select
                        value={settings.theme}
                        onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center">
                              <Sun className="mr-2 h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center">
                              <Moon className="mr-2 h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center">
                              <Smartphone className="mr-2 h-4 w-4" />
                              System
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifications">Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Enable in-app notifications
                          </p>
                        </div>
                        <Switch 
                          id="notifications"
                          checked={settings.notifications}
                          onCheckedChange={(checked) => updateSetting('notifications', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="soundEffects">Sound Effects</Label>
                          <p className="text-xs text-muted-foreground">
                            Play sound effects for interactions
                          </p>
                        </div>
                        <Switch 
                          id="soundEffects"
                          checked={settings.soundEffects}
                          onCheckedChange={(checked) => updateSetting('soundEffects', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="vibration">Haptic Feedback</Label>
                          <p className="text-xs text-muted-foreground">
                            Enable vibration for interactions
                          </p>
                        </div>
                        <Switch 
                          id="vibration"
                          checked={settings.vibration}
                          onCheckedChange={(checked) => updateSetting('vibration', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <RefreshCw size={16} />
                        Reset to Defaults
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all your settings to the factory defaults. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSettings}>Reset</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={saveSettings} 
                          disabled={!hasChanges || isSaving}
                          className="flex gap-2"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {!hasChanges && (
                        <TooltipContent>
                          <p>No changes to save</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            )}
            
            {/* Voice & Translation Settings */}
            {activeSection === 'voice' && (
              <Card>
                <CardHeader>
                  <CardTitle>Voice & Translation Settings</CardTitle>
                  <CardDescription>Configure voice commands and translation preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="voiceSpeed">Voice Speed</Label>
                      <div className="flex flex-col space-y-1">
                        <Slider
                          id="voiceSpeed"
                          value={[settings.voiceSpeed]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(value) => updateSetting('voiceSpeed', value[0])}
                          className="mb-1"
                        />
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Slow</span>
                          <span className="text-xs font-medium">{settings.voiceSpeed}%</span>
                          <span className="text-xs text-muted-foreground">Fast</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="voiceVolume">Voice Volume</Label>
                      <div className="flex flex-col space-y-1">
                        <Slider
                          id="voiceVolume"
                          value={[settings.voiceVolume]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(value) => updateSetting('voiceVolume', value[0])}
                          className="mb-1"
                        />
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Quiet</span>
                          <span className="text-xs font-medium">{settings.voiceVolume}%</span>
                          <span className="text-xs text-muted-foreground">Loud</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="voiceLanguage">Voice Assistant Language</Label>
                        <p className="text-xs text-muted-foreground">
                          Language that BossMan speaks to you
                        </p>
                      </div>
                      <Select
                        value={settings.voiceLanguage}
                        onValueChange={(value: 'en' | 'es') => updateSetting('voiceLanguage', value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoTranslate">Auto-Translate Messages</Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically translate messages to your language
                          </p>
                        </div>
                        <Switch 
                          id="autoTranslate"
                          checked={settings.autoTranslate}
                          onCheckedChange={(checked) => updateSetting('autoTranslate', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="lowPowerMode">Low-Power Mode</Label>
                          <p className="text-xs text-muted-foreground">
                            Use smaller AI models to save battery
                          </p>
                        </div>
                        <Switch 
                          id="lowPowerMode"
                          checked={settings.lowPowerMode}
                          onCheckedChange={(checked) => updateSetting('lowPowerMode', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <RefreshCw size={16} />
                        Reset to Defaults
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all your settings to the factory defaults. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSettings}>Reset</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={saveSettings} 
                          disabled={!hasChanges || isSaving}
                          className="flex gap-2"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {!hasChanges && (
                        <TooltipContent>
                          <p>No changes to save</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            )}
            
            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure how and when you receive alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Notification Channels</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch 
                          id="emailNotifications"
                          checked={settings.emailNotifications}
                          onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="smsNotifications">SMS Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive notifications via text message
                          </p>
                        </div>
                        <Switch 
                          id="smsNotifications"
                          checked={settings.smsNotifications}
                          onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="pushNotifications">Push Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive notifications on your device
                          </p>
                        </div>
                        <Switch 
                          id="pushNotifications"
                          checked={settings.pushNotifications}
                          onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Notification Types</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnNewMessages">New Messages</Label>
                          <p className="text-xs text-muted-foreground">
                            Notify when new messages are received
                          </p>
                        </div>
                        <Switch 
                          id="notifyOnNewMessages"
                          checked={settings.notifyOnNewMessages}
                          onCheckedChange={(checked) => updateSetting('notifyOnNewMessages', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnJobsiteUpdates">Jobsite Updates</Label>
                          <p className="text-xs text-muted-foreground">
                            Notify on project changes or updates
                          </p>
                        </div>
                        <Switch 
                          id="notifyOnJobsiteUpdates"
                          checked={settings.notifyOnJobsiteUpdates}
                          onCheckedChange={(checked) => updateSetting('notifyOnJobsiteUpdates', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnWeatherAlerts">Weather Alerts</Label>
                          <p className="text-xs text-muted-foreground">
                            Notify about severe weather conditions
                          </p>
                        </div>
                        <Switch 
                          id="notifyOnWeatherAlerts"
                          checked={settings.notifyOnWeatherAlerts}
                          onCheckedChange={(checked) => updateSetting('notifyOnWeatherAlerts', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnSafetyIncidents">Safety Incidents</Label>
                          <p className="text-xs text-muted-foreground">
                            Notify about safety issues and incidents
                          </p>
                        </div>
                        <Switch 
                          id="notifyOnSafetyIncidents"
                          checked={settings.notifyOnSafetyIncidents}
                          onCheckedChange={(checked) => updateSetting('notifyOnSafetyIncidents', checked)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="quietHoursEnabled">Quiet Hours</Label>
                          <p className="text-xs text-muted-foreground">
                            Only receive critical notifications during specified hours
                          </p>
                        </div>
                        <Switch 
                          id="quietHoursEnabled"
                          checked={settings.quietHoursEnabled}
                          onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
                        />
                      </div>
                      
                      {settings.quietHoursEnabled && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <Label htmlFor="quietHoursStart" className="text-xs">Start Time</Label>
                            <Input 
                              id="quietHoursStart"
                              type="time"
                              value={settings.quietHoursStart}
                              onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="quietHoursEnd" className="text-xs">End Time</Label>
                            <Input 
                              id="quietHoursEnd"
                              type="time"
                              value={settings.quietHoursEnd}
                              onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <RefreshCw size={16} />
                        Reset to Defaults
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all your settings to the factory defaults. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSettings}>Reset</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={saveSettings} 
                          disabled={!hasChanges || isSaving}
                          className="flex gap-2"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {!hasChanges && (
                        <TooltipContent>
                          <p>No changes to save</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            )}
            
            {/* Privacy & Security Settings */}
            {activeSection === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>Manage your data and security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="locationSharing">Location Sharing</Label>
                          <p className="text-xs text-muted-foreground">
                            Share your location with supervisors and team members
                          </p>
                        </div>
                        <Switch 
                          id="locationSharing"
                          checked={settings.locationSharing}
                          onCheckedChange={(checked) => updateSetting('locationSharing', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="dataCollection">Data Collection</Label>
                          <p className="text-xs text-muted-foreground">
                            Allow collection of usage data to improve the app
                          </p>
                        </div>
                        <Switch 
                          id="dataCollection"
                          checked={settings.dataCollection}
                          onCheckedChange={(checked) => updateSetting('dataCollection', checked)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="biometricLogin">Biometric Login</Label>
                          <p className="text-xs text-muted-foreground">
                            Use Face ID or Touch ID to log in
                          </p>
                        </div>
                        <Switch 
                          id="biometricLogin"
                          checked={settings.biometricLogin}
                          onCheckedChange={(checked) => updateSetting('biometricLogin', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoLogout">Auto-Logout</Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically log out after period of inactivity
                          </p>
                        </div>
                        <Select
                          value={settings.autoLogout.toString()}
                          onValueChange={(value) => updateSetting('autoLogout', parseInt(value))}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="0">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Data Management</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="justify-start">
                          Export My Data
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start text-destructive">
                          Delete Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <RefreshCw size={16} />
                        Reset to Defaults
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all your settings to the factory defaults. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSettings}>Reset</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={saveSettings} 
                          disabled={!hasChanges || isSaving}
                          className="flex gap-2"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {!hasChanges && (
                        <TooltipContent>
                          <p>No changes to save</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            )}
            
            {/* About Section */}
            {activeSection === 'about' && (
              <Card>
                <CardHeader>
                  <CardTitle>About BossMan</CardTitle>
                  <CardDescription>Application information and support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-col items-center justify-center py-6">
                    <BossManCharacter 
                      mood="happy" 
                      size={isMobile ? "sm" : "md"} 
                      className={isMobile ? "w-24 h-24" : "w-32 h-32"}
                    />
                    <h3 className="text-lg font-bold mt-4">BossMan</h3>
                    <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs text-muted-foreground">Developed By</Label>
                      <p className="text-sm">Construction Tech Solutions, Inc.</p>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs text-muted-foreground">Contact Support</Label>
                      <p className="text-sm">support@bossman-construction.com</p>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs text-muted-foreground">Website</Label>
                      <p className="text-sm">www.bossman-construction.com</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Help & Support</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" className="justify-start">
                        User Guide
                      </Button>
                      <Button variant="outline" className="justify-start">
                        FAQ
                      </Button>
                      <Button variant="outline" className="justify-start">
                        Privacy Policy
                      </Button>
                      <Button variant="outline" className="justify-start">
                        Terms of Service
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <RefreshCw size={16} />
                        Reset to Defaults
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all your settings to the factory defaults. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSettings}>Reset</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={saveSettings} 
                          disabled={!hasChanges || isSaving}
                          className="flex gap-2"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {!hasChanges && (
                        <TooltipContent>
                          <p>No changes to save</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}