import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative group p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 ${className}`}
      data-testid="theme-toggle"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon (visible in dark mode) */}
        <Sun 
          className={`absolute inset-0 w-5 h-5 text-amber-400 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-0'
          }`}
        />
        
        {/* Moon Icon (visible in light mode) */}
        <Moon 
          className={`absolute inset-0 w-5 h-5 text-indigo-600 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>

      {/* Tooltip - English */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </div>
    </button>
  );
};

export default ThemeToggle;
