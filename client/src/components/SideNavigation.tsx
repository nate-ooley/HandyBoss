import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Home, 
  Briefcase, 
  Users, 
  Calendar, 
  MessageSquare,
  Mic,
  Settings,
  HardHat,
  LogOut,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const SideNavigation = () => {
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Handle navigation
  const navigate = (to: string) => {
    // Ensure all paths are relative (remove leading slash if it exists)
    const relativePath = to.startsWith('/') ? to.substring(1) : to;
    setLocation(relativePath);
  };

  // Check if route is active
  const isActive = (path: string) => {
    if (path === "/dashboard" && location === "/") return true;
    return location.startsWith(path);
  };

  const navItems = [
    { 
      label: "Dashboard", 
      icon: <Home className="h-5 w-5" />, 
      path: "/dashboard" 
    },
    { 
      label: "Projects", 
      icon: <Briefcase className="h-5 w-5" />, 
      path: "/projects" 
    },
    { 
      label: "Crew", 
      icon: <Users className="h-5 w-5" />, 
      path: "/crew" 
    },
    { 
      label: "Calendar", 
      icon: <Calendar className="h-5 w-5" />, 
      path: "/calendar" 
    },
    { 
      label: "Chat", 
      icon: <MessageSquare className="h-5 w-5" />, 
      path: "/translate" 
    },
    { 
      label: "Voice Commands", 
      icon: <Mic className="h-5 w-5" />, 
      path: "/voice-commands" 
    },
    { 
      label: "Settings", 
      icon: <Settings className="h-5 w-5" />, 
      path: "/settings" 
    }
  ];

  return (
    <div 
      className={cn(
        "h-screen bg-white border-r text-gray-700 transition-all duration-300 flex flex-col", 
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <HardHat className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">BossMan</h1>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-1", 
            collapsed && "mx-auto"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      
      <div className="flex-1 py-6 flex flex-col gap-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            size="lg"
            className={cn(
              "w-full justify-start px-4 gap-3 rounded-none hover:bg-gray-100 relative h-12",
              isActive(item.path) && "bg-gray-100 text-primary font-medium"
            )}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.label : undefined}
          >
            {isActive(item.path) && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            )}
            <span className={isActive(item.path) ? "text-primary" : "text-gray-600"}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Button>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          size="lg"
          className="w-full justify-start px-4 gap-3 rounded-none hover:bg-gray-100"
          onClick={() => {
            // Handle logout logic
            console.log("Logging out...");
          }}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 text-gray-600" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};