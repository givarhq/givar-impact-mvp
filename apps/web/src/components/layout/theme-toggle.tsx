'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
        <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTheme}
        className="rounded-full w-9 h-9 border border-transparent hover:border-border transition-all"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-yellow-400 transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-slate-900 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}