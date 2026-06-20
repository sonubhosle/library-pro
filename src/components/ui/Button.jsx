import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    className = '',
    loading = false,
    icon: Icon,
    ...props
}) => {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        ghost: 'p-2 text-muted hover:bg-white/5 rounded-lg transition-all hover:text-white',
    };

    return (
        <button
            className={`${variants[variant]} ${className}`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <>
                    {Icon && <Icon size={20} />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
