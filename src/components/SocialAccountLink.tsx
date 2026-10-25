'use client';

import React from 'react';
import type { SocialAccount } from '@/lib/socials';
import { SocialIcon, formatSocialIdentity } from '@/lib/socials';
import InlineEditable from './admin/InlineEditable';

export interface SocialAccountLinkProps {
  account: SocialAccount;
  variant: 'rail' | 'collaborate' | 'mobile';
  isLast?: boolean;
  iconRef?: (el: HTMLElement | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isEditingMode?: boolean;
  onUrlChange?: (newUrl: string) => void;
}

export default function SocialAccountLink({
  account,
  variant,
  isLast = false,
  iconRef,
  onFocus,
  onBlur,
  isEditingMode = false,
  onUrlChange,
}: SocialAccountLinkProps) {
  const identity = formatSocialIdentity(account);

  // ---------------------------------------------------------------------------
  // 1. MOBILE DRAWER VARIANT
  // ---------------------------------------------------------------------------
  if (variant === 'mobile') {
    return (
      <a
        href={account.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${account.label}: ${identity}`}
        className="hover:text-[#DF491E] flex items-center justify-between gap-2 p-2 border border-[#171514]/25 bg-[#F2EFE7] min-w-0 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 overflow-visible select-none">
            <SocialIcon platform={account.platform} className="w-3.5 h-3.5 flex-shrink-0" />
          </div>
          <span className="truncate font-mono text-xs">{identity}</span>
        </div>
        <span className="text-[10px] flex-shrink-0 opacity-70 group-hover:opacity-100">↗</span>
      </a>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. DESKTOP NAVIGATION RAIL VARIANT
  // ---------------------------------------------------------------------------
  if (variant === 'rail') {
    return (
      <div className="relative group/rail min-w-0">
        <a
          href={account.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${account.label}: ${identity}`}
          onFocus={onFocus}
          onBlur={onBlur}
          className="flex items-center justify-between hover:text-[#DF491E] transition-colors py-1 px-1 rounded-xs min-w-0 focus:outline-none focus:text-[#DF491E] focus-visible:ring-1 focus-visible:ring-[#DF491E]"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Magnifiable Dock Icon: overflow-visible ensures no clipping on 1.35x zoom */}
            <div
              ref={iconRef}
              className="w-5 h-5 flex items-center justify-center flex-shrink-0 overflow-visible dock-social-icon select-none"
            >
              <SocialIcon
                platform={account.platform}
                className="w-3.5 h-3.5 flex-shrink-0 opacity-80 group-hover/rail:opacity-100 group-hover/rail:text-[#DF491E] transition-all pointer-events-none"
              />
            </div>
            {/* Handle/Identity: Truncates if needed without touching icon */}
            <span className="truncate font-mono text-[11px] font-medium tracking-tight min-w-0 text-[#171514] group-hover/rail:text-[#DF491E] transition-colors">
              {identity}
            </span>
          </div>
          <span className="ml-1 text-[10px] flex-shrink-0 opacity-60 group-hover/rail:opacity-100 group-hover/rail:text-[#DF491E] transition-opacity">
            ↗
          </span>
        </a>

        {/* Non-obstructive Tooltip: Floats to the LEFT of the rail into the content stream, NEVER covering row or icon */}
        <div
          role="tooltip"
          className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100 transition-opacity duration-150 hidden lg:flex items-center shadow-lg"
        >
          <div className="bg-[#171514] text-[#ECE8DF] border border-[#DF491E] px-2 py-0.5 font-mono text-[9px] whitespace-nowrap flex items-center gap-1.5">
            <span className="text-[#DF491E] font-bold">{account.label}:</span>
            <span className="text-[#BCB8B1] max-w-[220px] truncate">{account.url}</span>
            <span className="text-[#DF491E]">↗</span>
          </div>
          <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[4px] border-l-[#DF491E] flex-shrink-0" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. COLLABORATE SECTION (SECTION 06) VARIANT
  // ---------------------------------------------------------------------------
  return (
    <div
      className={`flex items-center justify-between gap-3 min-w-0 py-1 px-1 relative group/collab ${
        !isLast ? 'border-b border-[#171514]/15 pb-2.5' : ''
      }`}
    >
      <span className="text-[#5A5650] flex items-center gap-2 uppercase font-mono flex-shrink-0">
        <div
          ref={iconRef}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 overflow-visible dock-social-icon select-none"
        >
          <SocialIcon
            platform={account.platform}
            className="w-3.5 h-3.5 text-[#171514] flex-shrink-0 pointer-events-none"
          />
        </div>
        <span className="font-bold tracking-wide text-xs">{account.label}:</span>
      </span>

      <div className="font-bold text-[#171514] text-right min-w-0 flex-1 flex justify-end">
        {isEditingMode ? (
          <div className="flex flex-col items-end min-w-0 max-w-full">
            <InlineEditable
              value={account.url}
              onChange={(newUrl) => onUrlChange?.(newUrl)}
              isEditingMode={isEditingMode}
              label={`${account.label} URL`}
            />
            <span className="text-[10px] text-[#5A5650] font-normal truncate mt-0.5">
              ↳ {identity}
            </span>
          </div>
        ) : (
          <div className="relative inline-flex items-center justify-end max-w-full">
            <a
              href={account.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${account.label}: ${identity}`}
              onFocus={onFocus}
              onBlur={onBlur}
              className="hover:text-[#DF491E] transition-colors truncate inline-flex items-center gap-1.5 group/link max-w-full font-mono text-xs focus:outline-none focus:text-[#DF491E] focus-visible:ring-1 focus-visible:ring-[#DF491E] py-0.5 px-1 rounded-xs"
            >
              <span className="truncate">{identity}</span>
              <span className="text-[10px] flex-shrink-0 opacity-70 group-hover/link:opacity-100 group-hover/link:text-[#DF491E] transition-opacity">
                ↗
              </span>
            </a>

            {/* Non-obstructive Tooltip: Floats above link on the right, NEVER covering icon or row */}
            <div
              role="tooltip"
              className="absolute bottom-full right-0 mb-1 z-40 pointer-events-none opacity-0 group-hover/link:opacity-100 group-focus-within/link:opacity-100 transition-opacity duration-150 hidden sm:flex flex-col items-end shadow-md"
            >
              <div className="bg-[#171514] text-[#ECE8DF] border border-[#DF491E] px-2 py-0.5 font-mono text-[9px] whitespace-nowrap flex items-center gap-1.5 max-w-[280px]">
                <span className="text-[#DF491E] font-bold">URL:</span>
                <span className="text-[#BCB8B1] truncate">{account.url}</span>
                <span className="text-[#DF491E]">↗</span>
              </div>
              <div className="w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-[#DF491E] mr-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
