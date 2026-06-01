/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Get stored theme or default to dark (calm twilight theme is the signature SyncUp aesthetic)
    const stored = localStorage.getItem('syncup-theme');
    if (stored === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      localStorage.setItem('syncup-theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      localStorage.setItem('syncup-theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      className="p-2.5 rounded-full border border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 backdrop-blur-md hover:bg-purple-500/10 hover:border-purple-500/20 dark:hover:bg-purple-500/10 dark:hover:border-purple-500/25 transition-all duration-300 outline-none flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
      aria-label="Toggle visual theme"
      title={theme === 'dark' ? 'Switch to Calm Light' : 'Switch to Midnight Calm'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400 rotate-0 transition-transform duration-500 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 rotate-0 transition-transform duration-500 hover:-rotate-12" />
      )}
    </button>
  );
}
