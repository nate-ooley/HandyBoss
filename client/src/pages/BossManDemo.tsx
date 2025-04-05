import React, { useState } from 'react';
import { SideNavigation } from '../components/SideNavigation';
import { BossManCharacter } from '../components/BossManCharacter';
import { BossManImage } from '../components/BossManImage';
import { BossManHeader } from '../components/BossManHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function BossManDemo() {
  // State for SVG character
  const [characterMood, setCharacterMood] = useState<'normal' | 'happy' | 'angry' | 'worried' | 'busy'>('normal');
  const [characterSize, setCharacterSize] = useState<'xs' | 'sm' | 'md' | 'lg'>('md');
  
  // State for raster image character
  const [imageMood, setImageMood] = useState<'phoneAngry' | 'phoneRaging' | 'angry' | 'shouting' | 'raging' | 'yelling'>('angry');
  const [imageSize, setImageSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [withSpeechBubble, setWithSpeechBubble] = useState(false);
  const [speechText, setSpeechText] = useState("I need this jobsite finished today!");
  
  // State for header
  const [isBossMode, setIsBossMode] = useState(true);
  
  // Handle mic click
  const handleMicClick = () => {
    alert('Microphone clicked - would start voice recording');
  };
  
  // Toggle boss mode
  const toggleBossMode = () => {
    setIsBossMode(!isBossMode);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SideNavigation />
      
      <div className="flex-1">
        <BossManHeader 
          title="BossMan Component Demo" 
          onMicClick={handleMicClick} 
          isBossMode={isBossMode} 
          toggleBossMode={toggleBossMode}
        />
        
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-8">BossMan UI Components</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>SVG Character (BossManCharacter)</CardTitle>
                <CardDescription>Vector-based character with different moods</CardDescription>
              </CardHeader>
              
              <CardContent className="flex flex-col items-center justify-center p-6">
                <BossManCharacter mood={characterMood} size={characterSize} />
                
                <div className="w-full mt-8 space-y-6">
                  <div className="space-y-2">
                    <Label>Mood</Label>
                    <RadioGroup 
                      value={characterMood} 
                      onValueChange={(value) => setCharacterMood(value as any)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="normal" />
                        <Label htmlFor="normal">Normal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="happy" id="happy" />
                        <Label htmlFor="happy">Happy</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="angry" id="angry" />
                        <Label htmlFor="angry">Angry</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="worried" id="worried" />
                        <Label htmlFor="worried">Worried</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="busy" id="busy" />
                        <Label htmlFor="busy">Busy</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <RadioGroup 
                      value={characterSize} 
                      onValueChange={(value) => setCharacterSize(value as any)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="xs" id="xs" />
                        <Label htmlFor="xs">Extra Small</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sm" id="sm" />
                        <Label htmlFor="sm">Small</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="md" id="md" />
                        <Label htmlFor="md">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lg" id="lg" />
                        <Label htmlFor="lg">Large</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Raster Character (BossManImage)</CardTitle>
                <CardDescription>Image-based character with speech bubbles</CardDescription>
              </CardHeader>
              
              <CardContent className="flex flex-col items-center justify-center p-6">
                <BossManImage 
                  mood={imageMood} 
                  size={imageSize} 
                  withSpeechBubble={withSpeechBubble}
                  speechText={speechText}
                />
                
                <div className="w-full mt-8 space-y-6">
                  <div className="space-y-2">
                    <Label>Mood</Label>
                    <RadioGroup 
                      value={imageMood} 
                      onValueChange={(value) => setImageMood(value as any)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="angry" id="img-angry" />
                        <Label htmlFor="img-angry">Angry</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="shouting" id="shouting" />
                        <Label htmlFor="shouting">Shouting</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="raging" id="raging" />
                        <Label htmlFor="raging">Raging</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phoneAngry" id="phoneAngry" />
                        <Label htmlFor="phoneAngry">Phone Angry</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phoneRaging" id="phoneRaging" />
                        <Label htmlFor="phoneRaging">Phone Raging</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <RadioGroup 
                      value={imageSize} 
                      onValueChange={(value) => setImageSize(value as any)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sm" id="img-sm" />
                        <Label htmlFor="img-sm">Small</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="md" id="img-md" />
                        <Label htmlFor="img-md">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lg" id="img-lg" />
                        <Label htmlFor="img-lg">Large</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="xl" id="img-xl" />
                        <Label htmlFor="img-xl">Extra Large</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="speechBubble">Speech Bubble</Label>
                      <Switch 
                        id="speechBubble"
                        checked={withSpeechBubble}
                        onCheckedChange={setWithSpeechBubble}
                      />
                    </div>
                    
                    {withSpeechBubble && (
                      <div className="pt-2">
                        <Label htmlFor="speechText">Speech Text</Label>
                        <textarea 
                          id="speechText"
                          className="w-full p-2 mt-1 border rounded-md"
                          value={speechText}
                          onChange={(e) => setSpeechText(e.target.value)}
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Header Component (BossManHeader)</CardTitle>
              <CardDescription>Header with boss/worker toggle and microphone button</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <BossManHeader 
                  title="Example Jobsite Header" 
                  onMicClick={handleMicClick}
                  isBossMode={isBossMode}
                  toggleBossMode={toggleBossMode}
                />
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bossModeToggle">Toggle Boss/Worker Mode</Label>
                  <Switch 
                    id="bossModeToggle"
                    checked={isBossMode}
                    onCheckedChange={toggleBossMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}