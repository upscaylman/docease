import React, { useState, useCallback } from 'react';
import { validateField } from '../utils/validation';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  type?: 'text' | 'email' | 'textarea' | 'date' | 'select';
  options?: string[];
  icon?: string;
  error?: string;
  onValidate?: (isValid: boolean, error?: string) => void;
  fieldId?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  options,
  icon,
  className = '',
  required,
  error: externalError,
  onValidate,
  fieldId,
  ...props
}) => {
  const [internalError, setInternalError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const error = externalError || internalError;
  const showError = touched && error;

  const wrapperClass = "relative group";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1 ml-1";
  const baseInputClass = "w-full bg-[#fdfbff] border-2 text-[#1c1b1f] text-base rounded-2xl px-4 py-3 outline-none transition-all duration-200 placeholder:text-gray-400";
  const inputClass = `${baseInputClass} ${
    showError
      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
      : 'border-[#e7e0ec] focus:border-[#a84383] focus:ring-4 focus:ring-[#a84383]/10'
  }`;

  // Validation en temps réel
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched(true);

    if (fieldId && (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value) {
      const result = validateField(
        (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value,
        fieldId,
        label,
        required
      );

      setInternalError(result.error);
      onValidate?.(result.isValid, result.error);
    }

    // Appeler le onBlur original si fourni
    if (props.onBlur) {
      props.onBlur(e as any);
    }
  }, [fieldId, label, required, onValidate, props]);

  if (type === 'textarea') {
    return (
      <div className={`${wrapperClass} ${className}`}>
        <label className={labelClass}>
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        <textarea
          className={`${inputClass} min-h-[120px] resize-y`}
          placeholder={props.placeholder || " "}
          required={required}
          onBlur={handleBlur}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
        {icon && <span className="material-icons absolute right-4 top-10 text-gray-400">{icon}</span>}
        {showError && (
          <div id={`${fieldId}-error`} className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className={`${wrapperClass} ${className}`}>
        <label className={labelClass}>
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        <div className="relative">
          <select
            className={`${inputClass} appearance-none cursor-pointer`}
            required={required}
            onBlur={handleBlur}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            <option value="" disabled>Sélectionner...</option>
            {options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
        </div>
        {showError && (
          <div id={`${fieldId}-error`} className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${wrapperClass} ${className}`}>
      <label className={labelClass}>
        {label}
        {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          className={`${inputClass} pl-4`}
          placeholder={props.placeholder || " "}
          required={required}
          onBlur={handleBlur}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        {icon && <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      </div>
      {showError && (
        <div id={`${fieldId}-error`} className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
          <span className="material-icons text-sm">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
