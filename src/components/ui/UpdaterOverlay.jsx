import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, CheckCircle, Info } from 'lucide-react';
import Button from './Button';

const UpdaterOverlay = () => {
    const [status, setStatus] = useState(null); // 'available', 'downloading', 'downloaded', 'error'
    const [progress, setProgress] = useState(0);
    const [info, setInfo] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!window.electron) return;

        const { ipc } = window.electron;

        const removeAvailable = ipc.on('update:available', (data) => {
            setInfo(data);
            setStatus('available');
            setVisible(true);
        });

        const removeProgress = ipc.on('update:progress', (percent) => {
            setStatus('downloading');
            setProgress(Math.round(percent));
            setVisible(true);
        });

        const removeDownloaded = ipc.on('update:downloaded', () => {
            setStatus('downloaded');
            setVisible(true);
        });

        const removeError = ipc.on('update:error', (err) => {
            console.error('Update error:', err);
            setStatus('error');
            setTimeout(() => setVisible(false), 5000);
        });

        return () => {
            removeAvailable();
            removeProgress();
            removeDownloaded();
            removeError();
        };
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slide-in">
            <div className="card !p-0 overflow-hidden shadow-2xl border-accent/20 min-w-[320px] max-w-[400px]">
                <div className="bg-accent p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <RefreshCw size={20} className={status === 'downloading' ? 'animate-spin' : ''} />
                        <span className="font-bold text-sm">Software Update</span>
                    </div>
                    <button onClick={() => setVisible(false)} className="text-white/60 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    {status === 'available' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-accent/10 text-accent rounded-lg">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">New Version Available!</h4>
                                    <p className="text-xs text-muted mt-1">Version {info?.version} is ready to download.</p>
                                </div>
                            </div>
                            <Button variant="primary" className="w-full h-10 text-xs" icon={Download}>
                                Download Update
                            </Button>
                        </div>
                    )}

                    {status === 'downloading' && (
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold text-muted mb-1">
                                <span>Downloading assets...</span>
                                <span className="text-white">{progress}%</span>
                            </div>
                            <div className="h-2 bg-surface rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted italic text-center">Don't close the app during the update.</p>
                        </div>
                    )}

                    {status === 'downloaded' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-success/10 text-success rounded-lg">
                                    <CheckCircle size={20} />
                                </div>
                                <h4 className="text-sm font-bold text-white">Ready to Install!</h4>
                            </div>
                            <p className="text-xs text-muted">Update has been downloaded and is ready to apply.</p>
                            <Button
                                variant="primary"
                                className="w-full h-10 text-xs bg-success hover:bg-success/80"
                                icon={RefreshCw}
                                onClick={() => window.electron.ipc.invoke('update:install')}
                            >
                                Restart & Install Now
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex items-center gap-3 text-danger">
                            <X size={20} />
                            <span className="text-sm font-bold">Update Failed. Try manually.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdaterOverlay;
