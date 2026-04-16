import { classNames } from '../utils/helpers';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
};

const Button = ({ children, variant = 'primary', className = '', disabled = false, loading = false, ...props }) => {
  return (
    <button
      disabled={disabled || loading}
      className={classNames(VARIANTS[variant], 'disabled:opacity-50 disabled:cursor-not-allowed', className)}
      {...props}
    >
      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />}
      {children}
    </button>
  );
};

export default Button;
