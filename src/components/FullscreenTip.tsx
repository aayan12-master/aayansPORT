'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Use a unified session key tracking if the tip was shown, handled, or dismissed in this tab session
const SESSION_STORAGE_KEY = 'aayan_f11_tip_session_handled';

export default function FullscreenTip() {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {
      // Safe fallback if sessionStorage is restricted (e.g., privacy sandbox)
    }
    setTimeout(() => {
      setShouldRender(false);
    }, 320);
  }, []);

  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') return;

    // 1. Session check: if already shown, dismissed, or handled in this tab session, NEVER show again
    try {
      if (sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true') {
        return;
      }
    } catch {
      // Continue safely
    }

    // 2. Viewport & hardware check: Desktop viewports only (>= 1024px with fine pointer/mouse input)
    const isDesktopDevice = () => {
      const isWideEnough = window.innerWidth >= 1024;
      const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
      return isWideEnough && hasFinePointer;
    };

    if (!isDesktopDevice()) return;

    // 3. Reliable full-screen detection via standardized Fullscreen API
    const isFullscreenActive = () => {
      const doc = document as any;
      return Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
    };

    // If browser is already in full-screen mode, do not show
    if (isFullscreenActive()) return;

    // 4. Polite 3.8s delay after load to allow visitor to explore first
    const timer = setTimeout(() => {
      // Re-verify conditions right before presenting
      if (!isFullscreenActive() && isDesktopDevice()) {
        // Mark as handled immediately in sessionStorage so reload / route change never duplicates it
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        } catch {
          // ignore
        }

        setShouldRender(true);
        requestAnimationFrame(() => {
          setIsVisible(true);
        });

        // 5. Automatic polite dismiss after 9 seconds so the tip never lingers indefinitely
        autoDismissTimerRef.current = setTimeout(() => {
          handleDismiss();
        }, 9000);
      }
    }, 3800);

    // 6. Event listeners to dismiss if user enters full-screen or resizes out of desktop
    const handleFullscreenChange = () => {
      if (isFullscreenActive()) {
        handleDismiss();
      }
    };

    const handleResize = () => {
      if (isFullscreenActive() || !isDesktopDevice()) {
        handleDismiss();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleDismiss]);

  // Prevent any SSR/CSR hydration mismatch
  if (!mounted || !shouldRender) return null;

  return (
    <div
      id="fullscreen-experience-tip"
      role="status"
      aria-live="polite"
      className={`hidden lg:flex fixed bottom-5 z-40 items-center gap-3.5 px-4 py-2.5 bg-[#ECE8DF] border border-[#171514] shadow-[3px_3px_0px_#171514] select-none transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        left: 'calc(50vw - 145px)',
        transform: isVisible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(12px)',
      }}
    >
      {/* Corner Technical Blueprint Marker */}
      <span className="font-mono text-xs text-[#DF491E] font-bold select-none leading-none">+</span>

      <div className="flex flex-col min-w-0 pr-1">
        <div className="font-mono text-[9px] font-bold text-[#DF491E] tracking-wider uppercase leading-none mb-1">
          // EXPERIENCE TIP
        </div>
        <div className="font-condensed text-sm font-bold tracking-wide text-[#171514] uppercase leading-tight">
          Get the full dossier experience.
        </div>
        <div className="font-mono text-[11px] text-[#5A5650] tracking-tight flex items-center gap-1.5 mt-0.5">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-bold bg-[#F2EFE7] border border-[#171514] shadow-[1px_1px_0px_#171514] rounded-xs text-[#171514] leading-none">
            F11
          </kbd>
          <span>for browser full screen.</span>
        </div>
      </div>

      <div className="h-8 w-px bg-[#171514]/20 mx-0.5" />

      {/* Subtle Close Button */}
      <button
        type="button"
        id="fullscreen-tip-dismiss-btn"
        onClick={handleDismiss}
        aria-label="Dismiss full-screen experience tip"
        className="w-5 h-5 flex items-center justify-center text-[#5A5650] hover:text-[#DF491E] hover:bg-[#171514]/10 border border-transparent hover:border-[#171514]/30 rounded-xs transition-colors cursor-pointer text-base leading-none font-bold"
      >
        ×
      </button>
    </div>
  );
}
