import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';

// ==================== GLASS CARD ====================
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverGlow?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = false, hoverGlow = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card p-6",
          glow && "border-secondary-cyan/30 shadow-[0_0_20px_rgba(0,229,255,0.15)]",
          hoverGlow && "hover:border-primary-purple/40 hover:shadow-[0_0_30px_rgba(124,77,255,0.15)]",
          className
        )}
        {...props}
      >
        <div className="relative">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

// ==================== BUTTON ====================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";
    
    const variants = {
      primary: "bg-gradient-to-r from-primary-purple to-secondary-cyan hover:from-primary-purple hover:to-primary-purple text-white shadow-[0_4px_20px_rgba(124,77,255,0.3)] hover:shadow-[0_4px_25px_rgba(0,229,255,0.4)]",
      secondary: "bg-card-dark border border-white/5 hover:border-secondary-cyan/40 hover:bg-slate-900 text-secondary-cyan",
      danger: "bg-danger-red hover:bg-red-600 text-white shadow-[0_4px_15px_rgba(255,82,82,0.3)]",
      outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
      ghost: "bg-transparent hover:bg-white/5 text-white/70 hover:text-white",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base",
      icon: "p-2.5 h-10 w-10 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ==================== SWITCH ====================
export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, id, disabled }) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-purple/50 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary-purple" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
};

// ==================== SLIDER ====================
export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  id?: string;
}

export const Slider: React.FC<SliderProps> = ({ min, max, step = 1, value, onChange, id }) => {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary-cyan focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
    />
  );
};

// ==================== SELECT ====================
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({ options, value, onChange, className, ...props }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "bg-card-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple/50 cursor-pointer w-full",
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-bg-dark text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
};

// ==================== PROGRESS ====================
export interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  color?: 'primary' | 'secondary' | 'success';
}

export const Progress: React.FC<ProgressProps> = ({ value, className, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-purple shadow-[0_0_10px_rgba(124,77,255,0.5)]',
    secondary: 'bg-secondary-cyan shadow-[0_0_10px_rgba(0,229,255,0.5)]',
    success: 'bg-success-green shadow-[0_0_10px_rgba(0,200,83,0.5)]',
  };

  return (
    <div className={cn("w-full bg-white/10 rounded-full h-2 overflow-hidden", className)}>
      <motion.div
        className={cn("h-full rounded-full", colors[color])}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
};

// ==================== DIALOG ====================
export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Content */}
          <motion.div
            className="relative glass-panel-heavy rounded-3xl w-full max-w-lg p-6 overflow-hidden border border-white/10 shadow-2xl z-10"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-white/80 max-h-[70vh] overflow-y-auto pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
