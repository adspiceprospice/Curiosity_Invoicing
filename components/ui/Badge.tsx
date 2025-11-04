import { BadgeProps } from '@/types';

/**
 * Reusable Badge component for status indicators and labels
 */
export default function Badge({
  variant = 'gray',
  size = 'md',
  children,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const variantStyles = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    primary: 'bg-primary-100 text-primary-800',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  const className = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;

  return <span className={className}>{children}</span>;
}
