import React from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Calendar, 
  Home, 
  Users, 
  HardHat,  
  MessageSquare,
  Mic,
  Settings
} from 'lucide-react';

export function MobileNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/projects', label: 'Projects', icon: HardHat },
    { href: '/crew', label: 'Crew', icon: Users },
    { href: '/voice-commands', label: 'Voice', icon: Mic },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}