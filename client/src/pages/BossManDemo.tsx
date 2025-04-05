import React, { useState } from 'react';
import { BossManImage } from '../components/BossManImage';
import { BossManHeader } from '../components/BossManHeader';
import { Button } from '@/components/ui/button';
import { VoiceCommandButton } from '../components/VoiceCommandButton';
import { VoiceChatbot } from '../components/VoiceChatbot';

export default function BossManDemo() {
  const [bossMode, setBossMode] = useState(true);
  
  // All the possible moods for the character
  const moods = [
    { id: 'angry', label: 'Angry' },
    { id: 'shouting', label: 'Shouting' },
    { id: 'raging', label: 'Raging' },
    { id: 'yelling', label: 'Yelling' },
    { id: 'phoneAngry', label: 'Phone Angry' },
    { id: 'phoneRaging', label: 'Phone Raging' }
  ];
  
  // All the possible sizes
  const sizes = [
    { id: 'xs', label: 'XS' },
    { id: 'sm', label: 'SM' },
    { id: 'md', label: 'MD' },
    { id: 'lg', label: 'LG' },
    { id: 'xl', label: 'XL' },
    { id: '2xl', label: '2XL' }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <BossManHeader 
        title="BossMan Demo" 
        isBossMode={bossMode}
        toggleBossMode={() => setBossMode(!bossMode)}
      />
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Character Gallery</h2>
          
          <div className="grid grid-cols-3 gap-4">
            {moods.map(mood => (
              <div key={mood.id} className="flex flex-col items-center p-4 border rounded-lg">
                <BossManImage 
                  mood={mood.id as any} 
                  size="md" 
                />
                <p className="mt-2 text-sm font-medium">{mood.label}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Character Sizes</h2>
          
          <div className="flex flex-wrap justify-center gap-6">
            {sizes.map(size => (
              <div key={size.id} className="flex flex-col items-center">
                <BossManImage 
                  mood="angry" 
                  size={size.id as any} 
                />
                <p className="mt-2 text-sm font-medium">{size.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Speech Bubbles</h2>
          
          <div className="space-y-12">
            <div className="flex justify-center">
              <BossManImage 
                mood="shouting" 
                size="lg" 
                withSpeechBubble
                speechText="I need those reports by Tuesday!"
              />
            </div>
            
            <div className="flex justify-center">
              <BossManImage 
                mood="phoneAngry" 
                size="lg" 
                withSpeechBubble
                speechText="Tell them I'll call back after the meeting!"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Voice Controls</h2>
          
          <div className="flex flex-col items-center space-y-8">
            <div className="text-center">
              <p className="mb-4 text-gray-600">Voice Command Button</p>
              <VoiceCommandButton showLabel className="mx-auto" />
            </div>
            
            <div className="w-full pt-8 border-t border-gray-200">
              <p className="mb-4 text-gray-600 text-center">Try different expressions</p>
              <div className="flex justify-center gap-4 flex-wrap">
                {moods.map(mood => (
                  <Button 
                    key={mood.id} 
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      // This is just for demo purposes
                      alert(`Mood changed to ${mood.label}`);
                    }}
                  >
                    {mood.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <VoiceChatbot />
      </div>
    </div>
  );
}