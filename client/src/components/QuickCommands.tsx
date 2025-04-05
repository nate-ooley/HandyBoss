import React from 'react';
import { Button } from '@/components/ui/button';
import { Truck, Drill, CloudRain, AlertTriangle } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';
import { useWebSocket } from '../contexts/WebSocketContext';

export const QuickCommands: React.FC = () => {
  const { synthesizeSpeech } = useVoice();
  const { sendMessage } = useWebSocket();

  const commands = [
    { 
      text: 'Material Delivery', 
      icon: <Truck className="mr-2 h-5 w-5" />, 
      action: 'material-delivery', 
      color: 'bg-success text-white' 
    },
    { 
      text: 'Equipment Issue', 
      icon: <Drill className="mr-2 h-5 w-5" />, 
      action: 'equipment-issue', 
      color: 'bg-warning text-white' 
    },
    { 
      text: 'Weather Update', 
      icon: <CloudRain className="mr-2 h-5 w-5" />, 
      action: 'weather-update', 
      color: 'bg-secondary text-white' 
    },
    { 
      text: 'Safety Incident', 
      icon: <AlertTriangle className="mr-2 h-5 w-5" />, 
      action: 'safety-incident', 
      color: 'bg-danger text-white' 
    }
  ];

  const handleCommand = (command: string) => {
    sendMessage({
      type: 'command',
      command: command,
      timestamp: new Date().toISOString()
    });

    // Provide voice confirmation
    synthesizeSpeech(`Command received: ${command}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-dark mb-3">QUICK COMMANDS</h2>
      <div className="grid grid-cols-2 gap-3">
        {commands.map((cmd) => (
          <Button 
            key={cmd.action}
            className={`py-3 px-4 rounded-xl flex items-center justify-center ${cmd.color}`}
            onClick={() => handleCommand(cmd.text)}
          >
            {cmd.icon}
            {cmd.text}
          </Button>
        ))}
      </div>
    </div>
  );
};
