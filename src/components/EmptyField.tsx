import React from 'react';

interface EmptyFieldProps {
  value: React.ReactNode | null | undefined;
  fallbackText?: string;
  className?: string;
}

/**
 * Ensures any null, undefined, or empty field is displayed as
 * "Pending submission" in gray, never as a blank.
 */
export const EmptyField: React.FC<EmptyFieldProps> = ({
  value,
  fallbackText = 'Pending submission',
  className = ''
}) => {
  if (value === null || value === undefined || value === '') {
    return (
      <span className={`inline-flex items-center text-xs text-slate-500 italic ${className}`}>
        {fallbackText}
      </span>
    );
  }

  return <span className={className}>{value}</span>;
};
