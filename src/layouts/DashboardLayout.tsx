import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Button, GlassCard } from '../components/ui';
import { 
  Activity, 
  MessageSquare, 
  BookOpen, 
  Award, 
  BarChart3, 
  Settings as SettingsIcon, 
  HelpCircle,
  Bell, 
  Sparkles,
  Shield, 
  Compass,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { 
    currentPage, 
    setCurrentPage, 
    performance, 
    notifications, 
    clearNotifications,
    userLevel, 
    userXp,
    accessibility 
  } = useAppStore();

  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const xpNeeded = userLevel * 500;
  const xpPercentage = (userXp / xpNeeded) * 100;

  const navItems = [
    { id: 'dashboard', label: 'Realtime Detection', icon: Activity },
    { id: 'conversation', label: 'Conversation Mode', icon: MessageSquare },
    { id: 'dictionary', label: 'Dictionary Mode', icon: BookOpen },
    { id: 'training', label: 'Training Mode', icon: Award },
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
    { id: 'help', label: 'Help & Docs', icon: HelpCircle },
  ];

  // Map accessibility color blind class
  const getColorBlindClass = () => {
    switch (accessibility.colorBlindMode) {
      case 'protanopia': return 'colorblind-protanopia';
      case 'deuteranopia': return 'colorblind-deuteranopia';
      case 'tritanopia': return 'colorblind-tritanopia';
      default: return '';
    }
  };

  return (
    <div className={`min-h-screen bg-bg-dark text-white flex flex-col selection:bg-primary-purple/30 ${accessibility.highContrast ? 'high-contrast' : ''} ${accessibility.largeText ? 'large-text' : ''} ${getColorBlindClass()}`}>
      
      {/* SVG Filters for Color Blind Modes */}
      <svg className="hidden">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05,  0, 0, 0, 0,  0.433, 0.567, 0, 0, 0,  0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-bg-dark/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        
        {/* Left: Logo & Animated Pulse */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-purple rounded-full blur-md opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-tr from-primary-purple to-secondary-cyan p-2.5 rounded-xl border border-white/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white animate-spin-slow" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-white via-white to-secondary-cyan bg-clip-text text-transparent m-0 select-none">
              DEAF LISTENER AI
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger-red"></span>
              </span>
              <span className="text-[10px] font-bold text-danger-red tracking-widest select-none">LIVE TRANSLATION</span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Nodes */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary-purple/20 to-secondary-cyan/20 border border-secondary-cyan/30 text-secondary-cyan' 
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-secondary-cyan' : 'text-white/60'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Telemetry & Profile Info */}
        <div className="flex items-center gap-4">
          
          {/* Diagnostic HUD */}
          <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-[10px] font-mono text-white/50 select-none">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-success-green animate-pulse" />
              <span>GPU: <span className="text-success-green font-bold uppercase">{performance.gpuStatus}</span></span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div>FPS: <span className="text-secondary-cyan font-bold">{performance.fps}</span></div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div>LATENCY: <span className="text-primary-purple font-bold">{performance.latency}ms</span></div>
          </div>

          {/* Level Badges */}
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-primary-purple/10 to-card-dark border border-white/5 px-3.5 py-1.5 rounded-xl">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-white/40 tracking-wider">LEVEL</span>
              <span className="text-sm font-extrabold text-white mt-[-2px]">{userLevel}</span>
            </div>
            <div className="w-12 flex flex-col justify-center">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary-purple" style={{ width: `${xpPercentage}%` }} />
              </div>
              <span className="text-[8px] font-mono text-white/40 mt-1 select-none">{userXp}/{xpNeeded}XP</span>
            </div>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <Button 
              variant="secondary" 
              size="icon" 
              className="relative h-10 w-10 border border-white/5 rounded-xl bg-card-dark text-white/70 hover:text-white"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-red text-[8px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div 
                    className="absolute right-0 mt-2.5 w-80 glass-panel-heavy border border-white/10 rounded-2xl p-4 shadow-2xl z-50 overflow-hidden"
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5">
                      <h4 className="text-xs font-bold text-white tracking-wider uppercase">Notifications</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => { clearNotifications(); setShowNotifications(false); }} 
                          className="text-[10px] text-secondary-cyan hover:underline font-semibold cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-xs text-white/40 font-medium">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-2 bg-white/5 border border-white/5 rounded-xl">
                            <div className="text-[11px] font-bold text-white">{notif.title}</div>
                            <div className="text-[10px] text-white/60 mt-0.5 leading-relaxed">{notif.message}</div>
                            <div className="text-[8px] font-mono text-white/30 text-right mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

        </div>
      </header>

      {/* Main Grid Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
        {/* Mobile Navigation bar */}
        <div className="lg:hidden w-full flex items-center justify-around bg-card-dark/80 backdrop-blur-md border border-white/5 p-2 rounded-2xl">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`p-2.5 rounded-xl cursor-pointer ${isActive ? 'bg-primary-purple/20 text-secondary-cyan border border-secondary-cyan/20' : 'text-white/40'}`}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
          {/* Settings node */}
          <button
            onClick={() => setCurrentPage('settings')}
            className={`p-2.5 rounded-xl cursor-pointer ${currentPage === 'settings' ? 'bg-primary-purple/20 text-secondary-cyan border border-secondary-cyan/20' : 'text-white/40'}`}
            title="Settings"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              className="flex-1 flex flex-col min-h-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      {/* Footer Branding */}
      <footer className="w-full text-center py-4 border-t border-white/5 text-[10px] text-white/30 font-mono select-none">
        Deaf Listener AI v1.0.0 // Advanced Realtime Sign Translation Core // Powered by MediaPipe Tasks Vision WASM
      </footer>
    </div>
  );
};
