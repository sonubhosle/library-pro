import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Dropdown = ({ options, value, onChange, placeholder = "Select option", icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options.find(opt => opt === value);
    const displayValue = selectedOption?.label || selectedOption || placeholder;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm transition-all focus:border-teal-500 shadow-sm ${isOpen ? 'border-teal-500 ring-4 ring-teal-500/10' : ''}`}
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={18} className="text-slate-400" />}
                    <span className={value ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}>{displayValue}</span>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-teal-500' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-[110] overflow-hidden animate-scale-in">
                    <div className="max-h-60 overflow-y-auto py-2">
                        {options.map((option, index) => {
                            const optValue = option.value || option;
                            const optLabel = option.label || option;
                            const isSelected = optValue === value;

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                        onChange(optValue);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 flex items-center justify-between text-sm text-left transition-colors hover:bg-teal-50/50 ${isSelected ? 'bg-teal-50 text-teal-600 font-bold' : 'text-slate-700 font-medium hover:text-teal-600'}`}
                                >
                                    <span>{optLabel}</span>
                                    {isSelected && <Check size={16} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
