import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Activity, Play, Radio, AlertTriangle } from 'lucide-react';
import BossManCharacter from './BossManCharacter';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// Types for voice recording states
type RecordingState = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

interface VoiceCommand {
  id: string;
  text: string;
  intent: string;
  timestamp: Date;
  processed: boolean;
  response?: string;
}

export interface VoiceCommandInterfaceProps {
  language?: 'en' | 'es';
  onCommandProcessed?: (command: string) => void;
  className?: string;
  compact?: boolean;
  jobsiteId?: number;
  demoMode?: boolean;
}

export function VoiceCommandInterface({ 
  language = 'en',
  onCommandProcessed,
  className,
  compact = false,
  jobsiteId,
  demoMode = true
}: VoiceCommandInterfaceProps) {
  // State for recording and processing
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recognizedIntent, setRecognizedIntent] = useState<string | null>(null);
  const [recentCommands, setRecentCommands] = useState<VoiceCommand[]>([]);
  
  // Animation state
  const [isRecordingPulsing, setIsRecordingPulsing] = useState(false);
  
  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Get label text based on language and state
  const getButtonLabel = () => {
    if (language === 'en') {
      return recordingState === 'idle' ? 'Hold to Speak' : 
        recordingState === 'recording' ? 'Release to Process' :
        recordingState === 'processing' ? 'Processing...' :
        recordingState === 'playing' ? 'Playing...' : 'Error';
    } else {
      return recordingState === 'idle' ? 'Mantén Presionado' : 
        recordingState === 'recording' ? 'Suelta para Procesar' :
        recordingState === 'processing' ? 'Procesando...' :
        recordingState === 'playing' ? 'Reproduciendo...' : 'Error';
    }
  };
  
  // Intent labels in both languages
  const getIntentLabel = (intent: string) => {
    const intentLabels: Record<string, { en: string, es: string, color: string }> = {
      'schedule': { en: 'Schedule', es: 'Programar', color: 'bg-blue-500' },
      'report': { en: 'Report', es: 'Informe', color: 'bg-amber-500' },
      'alert': { en: 'Alert', es: 'Alerta', color: 'bg-red-500' },
      'request': { en: 'Request', es: 'Solicitud', color: 'bg-purple-500' },
      'information': { en: 'Info', es: 'Info', color: 'bg-green-500' },
      'team_message': { en: 'Message', es: 'Mensaje', color: 'bg-sky-500' },
      'safety_alert': { en: 'Safety', es: 'Seguridad', color: 'bg-red-600' },
      'status_update': { en: 'Status', es: 'Estado', color: 'bg-teal-500' },
      'weather_update': { en: 'Weather', es: 'Clima', color: 'bg-indigo-500' },
    };
    
    const label = intentLabels[intent] || { en: 'Command', es: 'Comando', color: 'bg-gray-500' };
    return { 
      text: language === 'en' ? label.en : label.es,
      color: label.color 
    };
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      setRecordingState('recording');
      setIsRecordingPulsing(true);
      setErrorMessage('');
      
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      // Start recording
      mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage('Microphone access denied');
      setRecordingState('error');
    }
  };
  
  // Stop recording and process audio
  const stopRecording = async () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      setRecordingState('processing');
      setIsRecordingPulsing(false);
      
      // Stop media recorder
      mediaRecorderRef.current.stop();
      
      // Process when recording stops
      mediaRecorderRef.current.onstop = async () => {
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // For demo, we'll simulate transcription and processing
        try {
          await simulateTranscribeAudio(audioBlob);
        } catch (error) {
          console.error('Failed to process audio:', error);
          setErrorMessage('Failed to process voice command');
          setRecordingState('error');
        }
      };
    }
  };
  
  // Process speech to text (in a real app, this would use a dedicated STT service)
  const simulateTranscribeAudio = async (audioBlob: Blob) => {
    try {
      // Create form data with audio
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);
      if (jobsiteId) {
        formData.append('jobsiteId', jobsiteId.toString());
      }
      
      // In a production implementation, this would integrate with a speech-to-text service
      // like Deepgram or Google Speech-to-Text. For this demo, we'll simulate it.
      
      // For demo purposes - in a full implementation, we'd send the audio to a speech-to-text API
      setTimeout(async () => {
        // Demo mode - choose a random sample text or use demo text based on environment
        let transcribedText = "";
        
        // Option 1: In production this would call a speech API
        // const response = await fetch('/api/speech-to-text', {
        //   method: 'POST',
        //   body: formData
        // });
        // const data = await response.json();
        // transcribedText = data.text;
        
        // Option 2: In demo mode, use some construction-related examples
        const demoTexts = {
          en: [
            "Schedule material delivery for tomorrow at 9 AM",
            "Inspect foundation work on Building B by Friday",
            "Report safety issue: missing guardrail on east scaffold",
            "Request additional workers for concrete pour on Thursday",
            "Send weather alert to all teams on Riverside project",
            "Update timeline for electrical work completion",
            "Check inventory of drywall materials",
            "Postpone roof inspection due to rain forecast"
          ],
          es: [
            "Programar entrega de materiales para mañana a las 9 AM",
            "Inspeccionar trabajo de cimientos en Edificio B para el viernes",
            "Reportar problema de seguridad: baranda faltante en andamio este",
            "Solicitar trabajadores adicionales para vertido de concreto el jueves",
            "Enviar alerta de clima a todos los equipos en proyecto Riverside",
            "Actualizar cronograma para finalización de trabajo eléctrico",
            "Verificar inventario de materiales de paneles de yeso",
            "Posponer inspección del techo debido al pronóstico de lluvia"
          ]
        };
        
        // For demo, use a random example
        transcribedText = demoTexts[language][Math.floor(Math.random() * demoTexts[language].length)];
        
        // Set the transcribed text in state
        setTranscribedText(transcribedText);
        
        // Now process the command using our NLP API
        await processVoiceCommand(transcribedText);
      }, 1500);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setErrorMessage('Failed to transcribe audio');
      setRecordingState('error');
      throw error;
    }
  };
  
  // Process the voice command through the API
  const processVoiceCommand = async (text: string) => {
    try {
      // Call API to process the command
      const response = await apiRequest('POST', '/api/voice/process-command', {
        text,
        language,
        jobsiteId
      });
      
      if (!response.ok) {
        throw new Error('Failed to process command');
      }
      
      const data = await response.json();
      setRecognizedIntent(data.intent);
      
      // Add to recent commands
      const newCommand: VoiceCommand = {
        id: Date.now().toString(),
        text,
        intent: data.intent,
        timestamp: new Date(),
        processed: true,
        response: data.response
      };
      
      setRecentCommands(prev => [newCommand, ...prev].slice(0, 5));
      
      // Play audio response if provided
      if (data.audioResponse) {
        setRecordingState('playing');
        // In a real app, this would play the audio response
        setTimeout(() => {
          setRecordingState('idle');
        }, 2000);
      } else {
        setRecordingState('idle');
      }
      
      // Notify parent component
      if (onCommandProcessed) {
        onCommandProcessed(text);
      }
      
    } catch (error) {
      console.error('Error processing voice command:', error);
      setErrorMessage('Failed to process command');
      setRecordingState('error');
    }
  };
  
  // Load recent commands on mount
  useEffect(() => {
    const loadRecentCommands = async () => {
      try {
        const response = await apiRequest('GET', '/api/commands/recent?limit=5');
        if (response.ok) {
          const data = await response.json();
          setRecentCommands(data.map((cmd: any) => ({
            id: cmd.id.toString(),
            text: cmd.text,
            intent: cmd.intent || 'command',
            timestamp: new Date(cmd.timestamp),
            processed: true
          })));
        }
      } catch (error) {
        console.error('Failed to load recent commands:', error);
      }
    };
    
    loadRecentCommands();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  // Determine button appearance based on state
  const getButtonAppearance = () => {
    switch (recordingState) {
      case 'recording':
        return {
          icon: <Mic className="h-10 w-10" />,
          color: 'bg-red-500 hover:bg-red-600 text-white'
        };
      case 'processing':
        return {
          icon: <Activity className="h-10 w-10 animate-pulse" />,
          color: 'bg-amber-500 hover:bg-amber-500 text-white'
        };
      case 'playing':
        return {
          icon: <Volume2 className="h-10 w-10" />,
          color: 'bg-green-500 hover:bg-green-500 text-white'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-10 w-10" />,
          color: 'bg-red-600 hover:bg-red-700 text-white'
        };
      default:
        return {
          icon: <Mic className="h-10 w-10" />,
          color: 'bg-primary hover:bg-primary/90 text-white'
        };
    }
  };
  
  const buttonAppearance = getButtonAppearance();
  
  // Compact version for inline use
  if (compact) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <Button
          className={cn(
            "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all p-0",
            buttonAppearance.color,
            isRecordingPulsing && "animate-pulse shadow-lg shadow-primary/50"
          )}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
        >
          {buttonAppearance.icon}
        </Button>
        <p className="text-xs sm:text-sm mt-2">{getButtonLabel()}</p>
        {errorMessage && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
  
  // Full version with recent commands
  return (
    <Card className={cn("w-full mx-auto", className)}>
      <CardHeader className="pb-3 px-4 pt-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">
              {language === 'en' ? 'Voice Commands' : 'Comandos de Voz'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {language === 'en' 
                ? 'Speak commands to control BossMan' 
                : 'Habla para controlar BossMan'}
            </CardDescription>
          </div>
          <BossManCharacter 
            mood={recordingState === 'recording' ? 'happy' : 
                 recordingState === 'error' ? 'concerned' : 'neutral'} 
            size="xs" 
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col items-center justify-center py-2 sm:py-4">
          <Button
            className={cn(
              "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all p-0",
              buttonAppearance.color,
              isRecordingPulsing && "animate-pulse shadow-lg shadow-primary/50"
            )}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          >
            {buttonAppearance.icon}
          </Button>
          <p className="text-sm sm:text-base font-medium mt-2 sm:mt-3">{getButtonLabel()}</p>
          
          {transcribedText && recordingState !== 'idle' && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted rounded-md w-full">
              <p className="text-xs sm:text-sm font-medium">{language === 'en' ? 'Recognized:' : 'Reconocido:'}</p>
              <p className="text-sm sm:text-base">{transcribedText}</p>
              {recognizedIntent && (
                <Badge className={cn("mt-2 text-xs", getIntentLabel(recognizedIntent).color)}>
                  {getIntentLabel(recognizedIntent).text}
                </Badge>
              )}
            </div>
          )}
          
          {errorMessage && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 text-red-600 rounded-md w-full">
              <p className="text-xs sm:text-sm">{errorMessage}</p>
            </div>
          )}
        </div>
        
        {recentCommands.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-xs sm:text-sm font-medium mb-2">
                {language === 'en' ? 'Recent Commands' : 'Comandos Recientes'}
              </h3>
              <ul className="space-y-2">
                {recentCommands.map((command) => (
                  <li key={command.id} className="p-2 bg-muted/50 rounded-md">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs sm:text-sm line-clamp-2">{command.text}</p>
                      <Badge className={cn("ml-1 shrink-0 text-xs", getIntentLabel(command.intent).color)}>
                        {getIntentLabel(command.intent).text}
                      </Badge>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      {new Date(command.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        
        {/* Hidden audio player for playback */}
        <audio ref={audioPlayerRef} style={{ display: 'none' }} controls />
      </CardContent>
      <CardFooter className="flex justify-center sm:justify-between px-4 pt-0 pb-4 sm:px-6 sm:pb-6">
        <p className="text-[10px] sm:text-xs text-center sm:text-left text-muted-foreground">
          {language === 'en' 
            ? 'Press and hold the button, then speak your command' 
            : 'Mantén presionado el botón y habla tu comando'}
        </p>
      </CardFooter>
    </Card>
  );
}