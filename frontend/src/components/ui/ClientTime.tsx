"use client";

import React, { useEffect, useState } from 'react';

export interface ClientTimeProps {
  value: number | string | Date;
  mode?: 'time' | 'date' | 'datetime';
  locale?: string;
  placeholder?: React.ReactNode;
  formatter?: (date: Date) => string;
  className?: string;
}

// Hydration-safe time renderer.
export function ClientTime({
  value,
  mode = 'time',
  locale,
  placeholder = '',
  formatter,
  className
}: ClientTimeProps) {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    try {
      const date = value instanceof Date ? value : new Date(value);
      let output: string;
      if (formatter) output = formatter(date);
      else if (mode === 'time') output = date.toLocaleTimeString(locale);
      else if (mode === 'date') output = date.toLocaleDateString(locale);
      else output = date.toLocaleString(locale);
      setText(output);
    } catch {
      setText('');
    }
  }, [value, mode, locale, formatter]);

  return <span className={className} suppressHydrationWarning>{text || placeholder}</span>;
}

export default ClientTime;
