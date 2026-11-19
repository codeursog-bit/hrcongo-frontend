'use client';
import React from 'react';
import { FancySelect } from '@/components/ui/FancySelect';

/** Value-only filters share the app selector. Native form constraints remain native. */
export function ModuleSelect({ children, value, onChange, className, disabled, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const options: Array<{ value: string; label: string }> = [];
  let unsupported = false;
  function collect(nodes: React.ReactNode) {
    React.Children.forEach(nodes, child => {
      if (!React.isValidElement<{ value?: string | number; children?: React.ReactNode; disabled?: boolean }>(child)) return;
      if (child.type === React.Fragment) collect(child.props.children);
      else if (child.type === 'option' && !child.props.disabled) options.push({ value: String(child.props.value ?? child.props.children ?? ''), label: React.Children.toArray(child.props.children).join('') });
      else unsupported = true;
    });
  }
  collect(children);
  const nativeEvents = Object.keys(props).some(key => key.startsWith('on'));
  if (value === undefined || props.defaultValue !== undefined || props.required || props.name || props.id || props.multiple || nativeEvents || unsupported) return <select {...props} value={value} onChange={onChange} disabled={disabled} className={className}>{children}</select>;
  return <fieldset disabled={disabled} className={`k-module-select attendance-select ${className || ''}`}><FancySelect label={props['aria-label']} value={String(value ?? '')} options={options} onChange={next => { if (!disabled) onChange?.({ target: { value: next }, currentTarget: { value: next } } as React.ChangeEvent<HTMLSelectElement>); }} /></fieldset>;
}
