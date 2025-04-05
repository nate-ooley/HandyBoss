import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Building, HardHat, Package, Drill, Calendar, Mic, Globe, Languages } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  featured?: boolean;
}

export const SideNavigation: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [location] = useLocation();

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Dashboard'
    },
    {
      href: '/translate',
      icon: <Languages className="h-5 w-5" />,
      label: 'Translator',
      featured: true
    },
    {
      href: '/calendar',
      icon: <Calendar className="h-5 w-5" />,
      label: 'Calendar'
    },
    {
      href: '/jobsites',
      icon: <Building className="h-5 w-5" />,
      label: 'Jobsites'
    },
    {
      href: '/crew',
      icon: <HardHat className="h-5 w-5" />,
      label: 'Crew'
    },
    {
      href: '/materials',
      icon: <Package className="h-5 w-5" />,
      label: 'Materials'
    },
    {
      href: '/equipment',
      icon: <Drill className="h-5 w-5" />,
      label: 'Equipment'
    }
  ];

  return (
    <div className="w-64 border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} 
                className={`
                  flex items-center space-x-3 p-3 rounded-xl 
                  ${location === item.href ? 'bg-primary text-white' : item.featured ? 'bg-primary/10 text-primary border border-primary/20' : 'text-dark hover:bg-gray-100'}
                  ${item.featured ? 'relative overflow-hidden' : ''}
                `}>
                  {item.icon}
                  <span>{item.label}</span>
                  
                  {item.featured && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary text-white rounded-full font-bold uppercase">
                      New
                    </span>
                  )}
                  
                  {item.featured && (
                    <span className="absolute -right-6 -bottom-6 opacity-10">
                      <Globe className="h-12 w-12" />
                    </span>
                  )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
};
