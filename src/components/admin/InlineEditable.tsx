'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface InlineEditableProps {
  value: string;
  onChange: (newValue: string) => void;
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
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setCurrentValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Clean public / preview mode: absolutely no editing artifacts or layout shifts
  if (!isEditingMode) {
    return <Component className={className}>{children || value || placeholder}</Component>;
  }

  const handleCommit = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onChange(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCurrentValue(value || '');
      setIsEditing(false);
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Enter' && multiline && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCommit();
    }
  };

  const isBlock = block || Component === 'div' || Component === 'p' || Component === 'h1' || Component === 'h2' || Component === 'h3' || multiline;

  if (isEditing) {
    if (multiline) {
      return (
        <div className={`relative ${isBlock ? 'block w-full' : 'inline-block max-w-full'} z-40 my-1`}>
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            rows={Math.max(2, currentValue.split('\n').length)}
            className={`w-full bg-[#ECE8DF] text-[#171514] border-2 border-[#DF491E] p-2 outline-none shadow-xl resize-y font-inherit text-inherit ${className}`}
            aria-label={label || 'Editable field'}
          />
          <div className="flex items-center justify-between font-mono text-[10px] text-[#5A5650] px-1 mt-0.5 bg-[#F2EFE7] border border-[#171514]/20 py-0.5">
            <span>Press <kbd className="font-bold text-[#171514]">Ctrl+Enter</kbd> to save, <kbd className="font-bold text-[#171514]">Esc</kbd> to cancel</span>
            <span className="text-[#DF491E] font-bold uppercase tracking-wider">{label || 'EDITING'}</span>
          </div>
        </div>
      );
    }

    return (
      <span className={`relative ${isBlock ? 'block w-full' : 'inline-block max-w-full'} z-40 my-0.5`}>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className={`w-full bg-[#ECE8DF] text-[#171514] border-2 border-[#DF491E] px-2 py-0.5 outline-none shadow-xl font-inherit text-inherit ${className}`}
          aria-label={label || 'Editable field'}
        />
        <span className="absolute -top-4 right-0 font-mono text-[9px] bg-[#DF491E] text-[#171514] font-bold px-1.5 py-0.5 pointer-events-none uppercase tracking-wider shadow-sm z-50">
          Enter to save • Esc to cancel
        </span>
      </span>
    );
  }

  // Active Editing Mode: outline rather than border avoids box-model layout shifting
  return (
    <Component
      onClick={() => setIsEditing(true)}
      title={label ? `Click to edit ${label}` : 'Click to edit in place'}
      tabIndex={0}
      role="button"
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      className={`group relative transition-all duration-150 cursor-pointer outline-1 outline-dashed outline-[#DF491E]/40 hover:outline-[#DF491E] hover:bg-[#DF491E]/5 rounded-xs ${
        isBlock ? 'block w-full' : 'inline-block max-w-full'
      } ${className}`}
    >
      {children || value || <span className="italic opacity-50">{placeholder}</span>}
      <span className="absolute -top-3.5 right-0 font-mono text-[9px] font-bold bg-[#DF491E] text-[#171514] px-1.5 py-0.2 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider shadow-sm z-30 whitespace-nowrap">
        ✎ {label || 'EDIT'}
      </span>
    </Component>
  );
}
