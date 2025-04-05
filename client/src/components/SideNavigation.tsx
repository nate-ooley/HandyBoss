import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Building, HardHat, Package, Drill } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
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
              <Link href={item.href}>
                <a className={`flex items-center space-x-3 p-3 rounded-xl ${
                  location === item.href ? 'bg-primary text-white' : 'text-dark hover:bg-gray-100'
                }`}>
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
};
