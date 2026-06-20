import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, suffix: Suffix, className = '', ...props }, ref) => {
    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            {label && (
                <label className="text-sm font-semibold text-muted pl-1 uppercase tracking-wider text-[10px]">
                    {label}
                </label>
            )}
            <div className="relative group flex items-center">
                {Icon && (
                    <div className="absolute left-3 text-muted group-focus-within:text-accent transition-colors z-10 pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    ref={ref}
                    className={`input-field ${Icon ? 'pl-10' : ''} ${Suffix ? 'pr-12' : ''} ${error ? 'border-danger focus:ring-danger' : ''}`}
                    {...props}
                />
                {Suffix && (
                    <div className="absolute right-3 z-10 flex items-center pointer-events-auto">
                        {Suffix}
                    </div>
                )}
            </div>
            {error && (
                <span className="text-xs text-danger font-medium pl-1 animate-fade-in">
                    {error}
                </span>
            )}
        </div>
    );
});

export default Input;
