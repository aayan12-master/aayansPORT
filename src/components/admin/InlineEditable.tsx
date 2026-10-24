'use client';

import React, { useState, useEffect, useRef } from 'react';

interface InlineEditableProps {
  value: string;
  onChange: (newValue: string) => void;
  isEditingMode?: boolean;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span';
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

  if (!isEditingMode) {
    return <Component className={className}>{value || placeholder}</Component>;
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

  if (isEditing) {
    if (multiline) {
      return (
        <div className="relative inline-block w-full z-40 my-1">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            rows={Math.max(2, currentValue.split('\n').length)}
            className={`w-full bg-[#ECE8DF] text-[#171514] border-2 border-[#DF491E] p-2 outline-none shadow-lg resize-y ${className}`}
          />
          <div className="flex items-center justify-between font-mono text-[10px] text-[#5A5650] px-1 mt-0.5">
            <span>Press Ctrl+Enter to save, Esc to cancel</span>
            <span className="text-[#DF491E] font-bold">EDITING: {label || 'TEXT'}</span>
          </div>
        </div>
      );
    }

    return (
      <span className="relative inline-block w-full z-40 my-0.5">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className={`w-full bg-[#ECE8DF] text-[#171514] border-2 border-[#DF491E] px-2 py-0.5 outline-none shadow-lg ${className}`}
        />
        <span className="absolute -top-4 right-0 font-mono text-[9px] bg-[#DF491E] text-[#171514] font-bold px-1.5 py-0.5 pointer-events-none uppercase tracking-wider z-50">
          Enter to save • Esc to cancel
        </span>
      </span>
    );
  }

  return (
    <Component
      onClick={() => setIsEditing(true)}
      title={label ? `Click to edit ${label}` : 'Click to edit in place'}
      className={`group relative transition-all duration-150 cursor-pointer border border-dashed border-[#DF491E]/40 hover:border-[#DF491E] hover:bg-[#DF491E]/10 px-1 py-0.5 -mx-1 rounded-xs inline-block max-w-full ${className}`}
    >
      {value || <span className="italic opacity-50">{placeholder}</span>}
      <span className="absolute -top-3.5 right-0 font-mono text-[9px] font-bold bg-[#DF491E] text-[#171514] px-1 py-0.2 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider shadow-sm z-30 whitespace-nowrap">
        ✎ {label || 'EDIT'}
      </span>
    </Component>
  );
}
