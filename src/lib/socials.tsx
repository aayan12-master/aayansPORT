'use client';

import React, { useRef, useEffect, useCallback } from 'react';

export interface SocialAccount {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon?: string;
  display_order: number;
  enabled: boolean;
  display_name?: string; // Optional custom display identity/handle entered by admin
}

export interface PlatformPreset {
  platform: string;
  name: string;
  defaultLabel: string;
  urlPlaceholder: string;
  urlPrefix?: string;
  icon: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    platform: 'github',
    name: 'GitHub',
    defaultLabel: 'GITHUB',
    urlPlaceholder: 'https://github.com/username',
    urlPrefix: 'https://github.com/',
    icon: 'github',
  },
  {
    platform: 'linkedin',
    name: 'LinkedIn',
    defaultLabel: 'LINKEDIN',
    urlPlaceholder: 'https://linkedin.com/in/username',
    urlPrefix: 'https://linkedin.com/in/',
    icon: 'linkedin',
  },
  {
    platform: 'twitter',
    name: 'X / Twitter',
    defaultLabel: 'TWITTER (X)',
    urlPlaceholder: 'https://x.com/username',
    urlPrefix: 'https://x.com/',
    icon: 'twitter',
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    defaultLabel: 'INSTAGRAM',
    urlPlaceholder: 'https://instagram.com/username',
    urlPrefix: 'https://instagram.com/',
    icon: 'instagram',
  },
  {
    platform: 'tryhackme',
    name: 'TryHackMe',
    defaultLabel: 'TRYHACKME',
    urlPlaceholder: 'https://tryhackme.com/p/username',
    urlPrefix: 'https://tryhackme.com/p/',
    icon: 'tryhackme',
  },
  {
    platform: 'hackthebox',
    name: 'Hack The Box (HTB)',
    defaultLabel: 'HACK THE BOX',
    urlPlaceholder: 'https://app.hackthebox.com/profile/id',
    urlPrefix: 'https://app.hackthebox.com/profile/',
    icon: 'hackthebox',
  },
  {
    platform: 'custom',
    name: 'Custom Platform',
    defaultLabel: 'CUSTOM LINK',
    urlPlaceholder: 'https://...',
    icon: 'globe',
  },
];

export function getPlatformPreset(platform: string): PlatformPreset {
  const match = PLATFORM_PRESETS.find(
    (p) => p.platform.toLowerCase() === (platform || '').toLowerCase()
  );
  return (
    match || {
      platform: 'custom',
      name: platform || 'Custom',
      defaultLabel: (platform || 'CUSTOM').toUpperCase(),
      urlPlaceholder: 'https://...',
      icon: 'globe',
    }
  );
}

/**
 * Validate that a URL is a legitimate HTTPS or local dev URL
 */
export function isValidSocialUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://localhost') && !trimmed.startsWith('http://127.0.0.1')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Formats a clean, readable social identity for public display.
 * Strips protocol, query parameters, tracking tags, and www.
 * Never alters the original saved destination URL.
 *
 * Examples:
 * - LinkedIn: linkedin.com/in/aayan-sec
 * - GitHub: github.com/aayan-sec
 * - X / Twitter: @aayan_sec
 * - Instagram: @aayan-sec
 * - TryHackMe: tryhackme.com/p/aayan-sec
 * - Hack The Box: HTB · aayan-sec
 * - Custom: clean hostname/path or configured display_name
 */
export function formatSocialIdentity(account: SocialAccount): string {
  if (!account) return '';

  // 1. If explicit custom display name is configured, use it directly
  if (account.display_name && account.display_name.trim()) {
    return account.display_name.trim();
  }

  const url = (account.url || '').trim();
  if (!url) return account.label || 'Link';

  try {
    // If not starting with protocol, add https:// for safe URL parsing
    const parseableUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(parseableUrl);

    // Clean hostname: strip leading www.
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    // Clean pathname: strip leading/trailing slashes
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, '');
    const pathSegments = pathname ? pathname.split('/').filter(Boolean) : [];

    const platform = (account.platform || '').toLowerCase();

    // Twitter / X: @username
    if (platform === 'twitter' || platform === 'x' || hostname === 'twitter.com' || hostname === 'x.com') {
      const username = pathSegments[0];
      if (username && username.toLowerCase() !== 'home' && username.toLowerCase() !== 'explore') {
        return `@${username.replace(/^@/, '')}`;
      }
      return 'x.com';
    }

    // Instagram: @username
    if (platform === 'instagram' || hostname === 'instagram.com') {
      const username = pathSegments[0];
      if (username) {
        return `@${username.replace(/^@/, '')}`;
      }
      return 'instagram.com';
    }

    // GitHub: github.com/username
    if (platform === 'github' || hostname === 'github.com') {
      if (pathname) {
        return `github.com/${pathname}`;
      }
      return 'github.com';
    }

    // LinkedIn: linkedin.com/in/username
    if (platform === 'linkedin' || hostname.includes('linkedin.com')) {
      if (pathname) {
        return `linkedin.com/${pathname}`;
      }
      return 'linkedin.com';
    }

    // TryHackMe: tryhackme.com/p/username
    if (platform === 'tryhackme' || hostname === 'tryhackme.com') {
      if (pathname) {
        return `tryhackme.com/${pathname}`;
      }
      return 'tryhackme.com';
    }

    // Hack The Box: HTB · username
    if (platform === 'hackthebox' || platform === 'htb' || hostname.includes('hackthebox.')) {
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && lastSegment !== 'profile' && lastSegment !== 'users') {
          return `HTB · ${lastSegment}`;
        }
      }
      return 'HTB · Profile';
    }

    // Custom or unknown platforms: clean hostname/path
    if (pathname) {
      return `${hostname}/${pathname}`;
    }
    return hostname;
  } catch {
    // Robust fallback regex if URL parsing fails
    const cleaned = url
      .replace(/^https?:\/\/(www\.)?/i, '')
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '');

    return cleaned || account.label || 'Link';
  }
}

/**
 * Formats full display metadata for consistent accessibility and title attributes
 */
export function getSocialDisplayData(account: SocialAccount) {
  const identity = formatSocialIdentity(account);
  return {
    identity,
    label: account.label || account.platform.toUpperCase(),
    url: account.url,
    title: `${account.label}: ${identity}\nDestination: ${account.url}`,
    ariaLabel: `${account.label}: ${identity}`,
  };
}

/**
 * Normalizes and extracts social accounts from site settings,
 * falling back gracefully to legacy columns if social_links is not populated.
 */
export function normalizeSocialAccounts(settings?: any): SocialAccount[] {
  if (!settings) return [];

  let rawLinks = settings.social_links;
  if (typeof rawLinks === 'string') {
    try {
      rawLinks = JSON.parse(rawLinks);
    } catch {
      rawLinks = null;
    }
  }

  if (Array.isArray(rawLinks) && rawLinks.length > 0) {
    return [...rawLinks]
      .filter((a) => a && typeof a === 'object')
      .map((a, idx) => ({
        id: a.id || `account-${idx}-${Date.now()}`,
        platform: a.platform || 'custom',
        label: a.label || a.platform?.toUpperCase() || 'LINK',
        url: a.url || '',
        icon: a.icon || a.platform || 'globe',
        display_order: typeof a.display_order === 'number' ? a.display_order : idx + 1,
        enabled: a.enabled !== false,
        display_name: a.display_name && typeof a.display_name === 'string' && a.display_name.trim() ? a.display_name.trim() : undefined,
      }))
      .sort((a, b) => a.display_order - b.display_order);
  }

  // Graceful fallback to legacy columns
  const legacy: SocialAccount[] = [];
  if (settings.github_url) {
    legacy.push({
      id: 'github',
      platform: 'github',
      label: 'GITHUB',
      url: settings.github_url,
      icon: 'github',
      display_order: 1,
      enabled: true,
    });
  }
  if (settings.linkedin_url) {
    legacy.push({
      id: 'linkedin',
      platform: 'linkedin',
      label: 'LINKEDIN',
      url: settings.linkedin_url,
      icon: 'linkedin',
      display_order: 2,
      enabled: true,
    });
  }
  if (settings.twitter_url) {
    legacy.push({
      id: 'twitter',
      platform: 'twitter',
      label: 'TWITTER (X)',
      url: settings.twitter_url,
      icon: 'twitter',
      display_order: 3,
      enabled: true,
    });
  }

  return legacy;
}

/**
 * Recognizable vector icon component for social platforms
 */
export function SocialIcon({
  platform,
  className = 'w-3.5 h-3.5',
}: {
  platform: string;
  className?: string;
}) {
  const p = (platform || '').toLowerCase();

  if (p === 'github') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    );
  }

  if (p === 'linkedin') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    );
  }

  if (p === 'twitter' || p === 'x') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (p === 'instagram') {
    return (
      <svg className={className} viewBox="-1.5 -1.5 27 27" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }

  if (p === 'tryhackme') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2zm-8.5 7.73l7.5 3.41 7.5-3.41L12 13.14 3.5 9.73zM12 15.5l-8.5-3.86V17l8.5 4.5 8.5-4.5v-5.36L12 15.5z" />
      </svg>
    );
  }

  if (p === 'hackthebox' || p === 'htb') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.996 0a1.134 1.134 0 0 0-.57.154l-9.86 5.694a1.139 1.139 0 0 0-.566.985v10.334c0 .408.218.784.566.985l9.86 5.694c.355.205.787.205 1.14 0l9.86-5.694c.35-.201.568-.577.568-.985V6.833c0-.408-.218-.784-.568-.985L12.566.154A1.139 1.139 0 0 0 11.996 0zm0 2.298l8.36 4.827-8.36 4.827-8.36-4.827zm-9.355 6.02l7.857 4.537v9.073L2.64 17.39zm18.71 0v9.073l-7.857 4.537v-9.073z" />
      </svg>
    );
  }

  // Fallback: clean modern globe icon
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export interface DockHoverZoomOptions {
  maxScale?: number;
  radius?: number;
}

/**
 * Lightweight, high-performance macOS Dock-style hover magnification hook.
 * Directly animates CSS transform on icon elements via requestAnimationFrame.
 * Bypasses re-rendering the parent component on pointermove for 60-120fps performance.
 * Respects touchscreens (disabled) and prefers-reduced-motion.
 */
export function useDockHoverZoom(options?: DockHoverZoomOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iconRefs = useRef<(HTMLElement | null)[]>([]);
  const isTouchRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const maxScale = options?.maxScale ?? 1.35;
  const radius = options?.radius ?? 52;

  const updateIcons = useCallback(
    (mouseX: number, mouseY: number) => {
      iconRefs.current.forEach((iconEl) => {
        if (!iconEl) return;
        const rect = iconEl.getBoundingClientRect();
        const iconCenterX = rect.left + rect.width / 2;
        const iconCenterY = rect.top + rect.height / 2;

        const dist = Math.hypot(mouseX - iconCenterX, mouseY - iconCenterY);

        if (dist < radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2));
          const scale = 1 + (maxScale - 1) * factor;
          iconEl.style.transform = `scale(${scale.toFixed(3)})`;
          iconEl.style.zIndex = '20';
        } else {
          iconEl.style.transform = 'scale(1)';
          iconEl.style.zIndex = '1';
        }
      });
    },
    [maxScale, radius]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'touch' || isTouchRef.current) return;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        updateIcons(mouseX, mouseY);
      });
    },
    [updateIcons]
  );

  const handlePointerLeave = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    iconRefs.current.forEach((iconEl) => {
      if (!iconEl) return;
      iconEl.style.transform = 'scale(1)';
      iconEl.style.zIndex = '1';
    });
  }, []);

  const handleFocusIcon = useCallback(
    (index: number) => {
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const iconEl = iconRefs.current[index];
      if (iconEl) {
        iconEl.style.transform = `scale(${maxScale.toFixed(3)})`;
        iconEl.style.zIndex = '20';
      }
    },
    [maxScale]
  );

  const handleBlurIcon = useCallback((index: number) => {
    const iconEl = iconRefs.current[index];
    if (iconEl) {
      iconEl.style.transform = 'scale(1)';
      iconEl.style.zIndex = '1';
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      isTouchRef.current = window.matchMedia('(hover: none)').matches;
    }
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    iconRefs,
    handlePointerMove,
    handlePointerLeave,
    handleFocusIcon,
    handleBlurIcon,
  };
}
