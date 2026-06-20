import React from 'react';
import { Loader2, Library } from 'lucide-react';

const Loader = ({ fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[100]">
                <div className="relative">
                    <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center animate-bounce shadow-2xl shadow-accent/50">
                        <Library className="text-white w-8 h-8" />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        <Loader2 className="animate-spin text-accent" size={20} />
                        <span className="text-sm font-bold text-white uppercase tracking-widest">LibraryPro</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );
};

export default Loader;
