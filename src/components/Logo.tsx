/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export default function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const sizeClasses = {
    sm: { svg: 'w-7 h-7 text-base rounded-md', text: 'text-xl', subtitle: 'text-[6px]' },
    md: { svg: 'w-11 h-11 text-2xl rounded-lg', text: 'text-3xl', subtitle: 'text-[9px]' },
    lg: { svg: 'w-18 h-18 text-4xl rounded-xl', text: 'text-5xl', subtitle: 'text-[13px]' },
    xl: { svg: 'w-28 h-28 text-6xl rounded-2xl', text: 'text-7xl', subtitle: 'text-[15px]' },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center select-none font-sans">
      <div className="flex items-center gap-3.5">
        {/* Crisp, modern geometric tile containing exactly the letter S */}
        <div className={`relative ${currentSize.svg} flex items-center justify-center shrink-0 font-display font-black text-white bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md ring-1 ring-white/10 dark:ring-white/20`}>
          <span className="leading-none select-none">
            S
          </span>
        </div>

        {/* SyncUp Typography */}
        <div className="flex flex-col items-start leading-none">
          <span className={`font-extrabold ${currentSize.text} tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent`}>
            SyncUp
          </span>
          <span className={`font-mono uppercase tracking-[0.25em] text-gray-400 font-semibold mt-1 ${currentSize.subtitle}`}>
            STAY IN SYNC
          </span>
        </div>
      </div>

      {showTagline && (
        <p className="mt-4 text-sm text-gray-400 font-medium italic select-text">
          “Stay In Sync.”
        </p>
      )}
    </div>
  );
}
