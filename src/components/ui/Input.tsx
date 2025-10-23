import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  register?: any;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  register,
  className = '',
  style = {},
  ...props 
}) => {
  const inputStyle = {
    ...style,
    '--placeholder-color': '#374151',
    '--placeholder-opacity': '1',
  } as React.CSSProperties & { [key: string]: string };

  const inputClassName = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        {...(register || {})}
        className={inputClassName}
        style={inputStyle}
        {...props}
      />
      <style jsx>{`
        input::placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        input::-webkit-input-placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        input::-moz-placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        input:-ms-input-placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        input:-moz-placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
      `}</style>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  register?: any;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  error, 
  register,
  className = '',
  style = {},
  ...props 
}) => {
  const textareaStyle = {
    ...style,
    '--placeholder-color': '#374151',
    '--placeholder-opacity': '1',
  } as React.CSSProperties & { [key: string]: string };

  const textareaClassName = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        {...(register || {})}
        className={textareaClassName}
        style={textareaStyle}
        {...props}
      />
      <style jsx>{`
        textarea::placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        textarea::-webkit-input-placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        textarea::-moz-placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        textarea:-ms-input-placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        textarea:-moz-placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
      `}</style>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};