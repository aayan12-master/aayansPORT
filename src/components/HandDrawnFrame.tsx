'use client';

import React from 'react';

interface HandDrawnFrameProps {
  children: React.ReactNode;
  className?: string;
  bgColor?: string;
  padding?: string;
}

export default function HandDrawnFrame({
  children,
  className = '',
  bgColor = 'transparent',
  padding = '10px 18px',
}: HandDrawnFrameProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundColor: bgColor,
        padding: padding,
      }}
    >
      {/* Hand-drawn sketchy SVG border overlay with authentic overshooting lines matching ref_identity */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* Top Horizontal Line (with overshoots on both ends) */}
        <line x1="-5" y1="0.5" x2="105" y2="-0.5" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="-3" y1="1.5" x2="102" y2="1" stroke="#171514" strokeWidth="0.9" opacity="0.65" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Bottom Horizontal Line (with overshoots and subtle sketchy tail) */}
        <line x1="-5" y1="100.5" x2="107" y2="100" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="-2" y1="102" x2="104" y2="101.5" stroke="#171514" strokeWidth="0.9" opacity="0.65" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Left Vertical Line (overshooting top and bottom) */}
        <line x1="-0.5" y1="-6" x2="-0.5" y2="106" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="1" y1="-4" x2="0.5" y2="104" stroke="#171514" strokeWidth="0.9" opacity="0.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Right Vertical Line (overshooting top and bottom) */}
        <line x1="100.5" y1="-6" x2="101" y2="106" stroke="#171514" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1="99" y1="-3" x2="99.5" y2="103" stroke="#171514" strokeWidth="0.9" opacity="0.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
