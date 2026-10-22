'use client';

import React from 'react';

interface HandDrawnButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
  arrow?: boolean;
}

export default function HandDrawnButton({
  children,
  onClick,
  href,
  variant = 'primary',
  className = '',
  arrow = true,
}: HandDrawnButtonProps) {
  const isPrimary = variant === 'primary';
  const bgColor = isPrimary ? '#DF491E' : '#ECE8DF';
  const textColor = '#171514';

  const content = (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none group cursor-pointer transition-all duration-150 whitespace-nowrap ${className}`}
      style={{
        padding: '13px 30px',
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: 'var(--font-condensed)',
        fontWeight: 700,
        fontSize: '1.45rem',
        letterSpacing: '0.08em',
      }}
    >
      {/* Hand-drawn sketchy SVG border overlay with overshooting corners matching ref_button_exact */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* Stroke 1: Primary organic outer stroke with slight wobble and overshoot */}
        <path
          d="M -3,1 Q 48,-1 103,-0.5 L 102.5,103 Q 50,101.5 -2.5,102.5 L -2,0"
          fill="none"
          stroke="#171514"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Stroke 2: Secondary offset sketched stroke with distinctive corner ticks */}
        <path
          d="M -5,3 Q 52,1.5 104,2 L 100.5,104 Q 48,103 -4.5,100 L -3.5,-2"
          fill="none"
          stroke="#171514"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hand-drawn corner overshoots / tick marks */}
        {/* Top-left tick extensions */}
        <line x1="-7" y1="-2" x2="8" y2="-0.5" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="-3" y1="-6" x2="-2" y2="10" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="-5" y1="-4" x2="-4" y2="8" stroke="#171514" strokeWidth="1" opacity="0.7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Top-right tick extensions */}
        <line x1="92" y1="-2" x2="107" y2="-0.5" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="102" y1="-6" x2="103" y2="9" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="104" y1="-4" x2="104.5" y2="7" stroke="#171514" strokeWidth="1" opacity="0.7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Bottom-left tick extensions */}
        <line x1="-7" y1="102" x2="8" y2="101" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="-3" y1="92" x2="-2" y2="107" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Bottom-right tick extensions */}
        <line x1="92" y1="103" x2="107" y2="102.5" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="102" y1="92" x2="102.5" y2="107" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>

      <span className="relative z-10 flex items-center gap-3">
        {children}
        {arrow && (
          <span className="transition-transform duration-200 group-hover:translate-x-1.5 font-mono font-bold text-xl inline-block -mt-0.5">
            →
          </span>
        )}
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block text-decoration-none">
        {content}
      </a>
    );
  }

  return content;
}
