import { forwardRef } from 'react';
import { SelectProps } from '@/types';

/**
 * Reusable Select component with consistent styling
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const selectClassName = `
      mt-1 block w-full px-3 py-2 rounded-md shadow-sm
      border ${error ? 'border-red-300' : 'border-gray-300'}
      bg-white
      focus:outline-none focus:ring-2 focus:ring-offset-0
      ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-primary-500 focus:border-primary-500'}
      sm:text-sm
      disabled:bg-gray-100 disabled:cursor-not-allowed
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select ref={ref} id={selectId} className={selectClassName} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
