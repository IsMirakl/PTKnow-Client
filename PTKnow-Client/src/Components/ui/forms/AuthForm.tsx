import { memo } from 'react';

interface AuthInputProps {
  type: string;
  name?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  className?: string;
}

const AuthInputComponent = ({
  type,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  required = false,
  minLength,
  maxLength,
  className = '',
}: AuthInputProps) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
    />
  );
};

export const AuthInput = memo(AuthInputComponent);
