import React from 'react';

export const HardHatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
    <path d="M10 4v7.5" />
    <path d="M14 4v7.5" />
    <path d="M8 4h8" />
    <path d="M7 17v-2.83A6 6 0 0 1 12 9v0a6 6 0 0 1 5 5.17V17" />
  </svg>
);

export const WeatherIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 12h1" />
    <path d="M12 2v2" />
    <path d="M6.6 4.6l1.4 1.4" />
    <path d="M20 12h2" />
    <path d="M18 17.66l1.6 1.6" />
    <path d="M6.6 19.4l1.4-1.4" />
    <path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" />
  </svg>
);

export const ConstructionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M17 14h.01" />
    <path d="M13 14h.01" />
    <path d="M9 14h.01" />
    <path d="M22 6l-10-4L2 6" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
  </svg>
);

export const VoiceCommandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);
