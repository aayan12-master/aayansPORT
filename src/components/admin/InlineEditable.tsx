'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface InlineEditableProps {
  value: string;
  onChange: (newValue: string) => void | Promise<void>;
  isEditingMode?: boolean;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span';
  block?: boolean;
  children?: React.ReactNode;
}

export default function InlineEditable({
  value,
  onChange,
  isEditingMode = false,
  multiline = false,
  className = '',
  placeholder = 'Click to edit...',
  label,
  as: Component = 'span',
  block = false,
  children,
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const initialValueRef = useRef(value || '');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentValue(value || '');
    initialValueRef.current = value || '';
  }, [value]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(76, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
        textareaRef.current.select();
      } else if (!multiline && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  // Clean public / preview mode: absolutely no editing artifacts or layout shifts
  if (!isEditingMode) {
    return <Component className={className}>{children || value || placeholder}</Component>;
  }

  const handleCommit = async () => {
    if (saveStatus === 'saving') return;

    if (currentValue === initialValueRef.current) {
      setIsEditing(false);
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');
    try {
      const res = onChange(currentValue);
      if (res && typeof (res as any).then === 'function') {
        await res;
      }
      initialValueRef.current = currentValue;
      setSaveStatus('saved');
      setIsEditing(false);

      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
    } catch (err: any) {
      console.error('InlineEditable save error:', err);
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Save failed');
      // Keep isEditing true so user draft is preserved and can retry
    }
  };

  const handleCancel = () => {
    setCurrentValue(initialValueRef.current);
    setSaveStatus('idle');
    setErrorMessage('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Enter' && multiline && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCommit();
    }
  };

  const isBlock = block || Component === 'div' || Component === 'p' || Component === 'h1' || Component === 'h2' || Component === 'h3' || multiline;

  // Active editing state
  if (isEditing) {
    if (multiline) {
      return (
        <div
          className={`relative block w-full z-40 my-1 ${className}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <textarea
            ref={textareaRef}
            value={currentValue}
            disabled={saveStatus === 'saving'}
            onChange={(e) => {
              setCurrentValue(e.target.value);
              setSaveStatus(e.target.value !== initialValueRef.current ? 'unsaved' : 'idle');
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            aria-label={label || 'Editable multiline field'}
            className="w-full bg-[#FAF8F5] text-[#171514] border-2 border-[#DF491E] p-2.5 rounded-xs outline-none shadow-xl font-inherit text-inherit resize-y min-h-[84px] leading-relaxed block text-[max(13px,inherit)]"
            style={{
              fontFamily: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
            }}
          />
          {/* Compact toolbar strictly below textarea — NEVER covering text */}
          <div className="flex items-center justify-between font-mono text-[11px] text-[#5A5650] px-2.5 py-1 bg-[#ECE8DF] border border-[#171514]/20 rounded-b-xs mt-[-2px] select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#171514]/70">
                <kbd className="font-bold text-[#171514] bg-white/70 px-1 py-0.5 rounded border border-[#171514]/20">Ctrl+Enter</kbd> save • <kbd className="font-bold text-[#171514] bg-white/70 px-1 py-0.5 rounded border border-[#171514]/20">Esc</kbd> cancel
              </span>
              {saveStatus === 'error' && (
                <span className="text-red-600 font-bold text-[10px]">✕ {errorMessage || 'Save failed. Draft preserved.'}</span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-[#DF491E] font-bold text-[10px]">● Draft unsaved</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={saveStatus === 'saving'}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCommit();
                }}
                className="px-2 py-0.5 bg-[#DF491E] text-white hover:bg-[#b83812] active:scale-95 disabled:opacity-50 rounded-xs shadow-xs cursor-pointer transition-all text-xs font-bold flex items-center gap-1"
                title="Save changes (Ctrl+Enter)"
              >
                {saveStatus === 'saving' ? (
                  <span className="animate-spin text-[10px]">⟳</span>
                ) : (
                  <span>✓</span>
                )}
                <span>Save</span>
              </button>
              <button
                type="button"
                disabled={saveStatus === 'saving'}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="px-2 py-0.5 bg-[#ECE8DF] border border-[#171514]/30 text-[#171514] hover:bg-[#171514] hover:text-[#ECE8DF] active:scale-95 disabled:opacity-50 rounded-xs shadow-xs cursor-pointer transition-all text-xs font-bold flex items-center gap-1"
                title="Cancel changes (Esc)"
              >
                <span>✕</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <span
        className={`relative inline-flex items-center gap-1.5 z-40 my-0.5 ${isBlock ? 'w-full' : 'max-w-full'}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          disabled={saveStatus === 'saving'}
          onChange={(e) => {
            setCurrentValue(e.target.value);
            setSaveStatus(e.target.value !== initialValueRef.current ? 'unsaved' : 'idle');
          }}
          onKeyDown={handleKeyDown}
          aria-label={label || 'Editable field'}
          className="bg-[#FAF8F5] text-[#171514] border-2 border-[#DF491E] px-2 py-0.5 rounded-xs outline-none shadow-md font-inherit text-inherit min-w-[70px] min-h-[26px] flex-1 text-[max(12px,inherit)]"
          style={{
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            letterSpacing: 'inherit',
            lineHeight: 'inherit',
          }}
        />
        {/* Compact, unobtrusive action buttons positioned beside input — never covering text */}
        <span className="inline-flex items-center gap-1 flex-shrink-0 select-none">
          <button
            type="button"
            disabled={saveStatus === 'saving'}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              handleCommit();
            }}
            title="Save (Enter)"
            className="w-6 h-6 flex items-center justify-center bg-[#DF491E] text-white hover:bg-[#b83812] active:scale-95 disabled:opacity-50 rounded-xs shadow-xs cursor-pointer transition-all text-xs font-bold"
          >
            {saveStatus === 'saving' ? (
              <span className="animate-spin text-[10px]">⟳</span>
            ) : (
              '✓'
            )}
          </button>
          <button
            type="button"
            disabled={saveStatus === 'saving'}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            title="Cancel (Esc)"
            className="w-6 h-6 flex items-center justify-center bg-[#ECE8DF] border border-[#171514]/30 text-[#171514] hover:bg-[#171514] hover:text-[#ECE8DF] active:scale-95 disabled:opacity-50 rounded-xs shadow-xs cursor-pointer transition-all text-xs font-bold"
          >
            ✕
          </button>
        </span>

        {/* Compact error tooltip underneath if save failed */}
        {saveStatus === 'error' && (
          <span className="absolute -bottom-5 left-0 font-mono text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded-xs shadow-sm whitespace-nowrap z-50">
            ✕ {errorMessage || 'Save failed. Click ✓ to retry.'}
          </span>
        )}
      </span>
    );
  }

  // Active Editing Mode (Not currently editing this specific element)
  return (
    <Component
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title={label ? `Click to edit ${label}` : 'Click to edit in place'}
      tabIndex={0}
      role="button"
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      className={`group relative transition-all duration-150 cursor-pointer outline-1 outline-dashed outline-[#DF491E]/40 hover:outline-[#DF491E] hover:bg-[#DF491E]/5 rounded-xs ${
        isBlock ? 'block w-full' : 'inline-block max-w-full'
      } ${className}`}
    >
      {children || value || <span className="italic opacity-50">{placeholder}</span>}

      {/* Temporary Saved Flash Badge */}
      {saveStatus === 'saved' && (
        <span className="absolute -top-3.5 right-0 font-mono text-[9px] font-bold bg-[#2A7B4C] text-white px-1.5 py-0.2 rounded-xs shadow-sm z-30 whitespace-nowrap">
          ✓ Saved
        </span>
      )}

      {/* Hover Pencil Badge */}
      {saveStatus !== 'saved' && (
        <span className="absolute -top-3.5 right-0 font-mono text-[9px] font-bold bg-[#DF491E] text-[#171514] px-1.5 py-0.2 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tracking-wider shadow-sm z-30 whitespace-nowrap">
          ✎ {label || 'Edit'}
        </span>
      )}
    </Component>
  );
}
