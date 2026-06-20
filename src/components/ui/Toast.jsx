import React from 'react';
import useUiStore from '../../store/uiStore';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const ToastItem = ({ toast, removeToast }) => {
    const styles = {
        success: {
            icon: <CheckCircle className="text-teal-600" size={20} />,
            border: 'border-teal-500/30 bg-teal-50/80',
            text: 'text-teal-900',
            button: 'text-teal-600 hover:text-teal-800',
        },
        error: {
            icon: <XCircle className="text-rose-600" size={20} />,
            border: 'border-rose-500/30 bg-rose-50/80',
            text: 'text-rose-900',
            button: 'text-rose-600 hover:text-rose-800',
        },
        warning: {
            icon: <AlertCircle className="text-amber-600" size={20} />,
            border: 'border-amber-500/30 bg-amber-50/80',
            text: 'text-amber-900',
            button: 'text-amber-600 hover:text-amber-800',
        },
        info: {
            icon: <Info className="text-blue-600" size={20} />,
            border: 'border-blue-500/30 bg-blue-50/80',
            text: 'text-blue-900',
            button: 'text-blue-600 hover:text-blue-800',
        },
    };

    const style = styles[toast.type];

    return (
        <div
            className={`
        flex items-center gap-4 px-4 py-3 rounded-xl border backdrop-blur-md 
        shadow-lg animate-slide-in min-w-[300px] transition-all
        ${style.border}
      `}
        >
            {style.icon}
            <p className={`text-sm font-medium flex-1 ${style.text}`}>{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className={`transition-colors ${style.button}`}
            >
                <X size={16} />
            </button>
        </div>
    );
};

const Toast = () => {
    const { toasts, removeToast } = useUiStore();

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
        </div>
    );
};

export default Toast;
