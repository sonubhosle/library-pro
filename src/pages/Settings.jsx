import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Database,
    RotateCcw,
    Save,
    Lock,
    Calendar,
    IndianRupee,
    BookOpen,
    Download,
    Check,
    AlertCircle,
    Clock,
    Settings2,
    Trash2,
    HardDrive,
    AlertTriangle,
    RefreshCw,
    Zap
} from 'lucide-react';
import useUiStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

/* Simple HashIcon for Port input */
const HashIcon = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="4" y1="9" x2="20" y2="9"></line>
        <line x1="4" y1="15" x2="20" y2="15"></line>
        <line x1="10" y1="3" x2="8" y2="21"></line>
        <line x1="16" y1="3" x2="14" y2="21"></line>
    </svg>
);

/* Login-style field wrapper */
const Field = ({ label, icon: Icon, children }) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm text-slate-600 pl-1 text-[10px] uppercase font-bold tracking-widest">{label}</label>
        <div className="relative group flex items-center">
            {Icon && (
                <div className="absolute left-3 text-slate-400 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                    <Icon size={18} />
                </div>
            )}
            {children}
        </div>
    </div>
);

const inputCls = "pl-10 w-full h-11 border border-slate-200 outline-none rounded-xl transition ease-in duration-300 text-slate-700 text-sm font-medium placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 bg-slate-50 focus:bg-white";



const Settings = () => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Policy');
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [updateHistory, setUpdateHistory] = useState([]);
    const [checkingUpdates, setCheckingUpdates] = useState(false);
    const [backups, setBackups] = useState([]);
    const [recoveryBackups, setRecoveryBackups] = useState([]);
    const [loadingBackups, setLoadingBackups] = useState(false);

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);



    useEffect(() => {
        const fetchSettings = async () => {
            const result = await window.electron.ipc.invoke('settings:getAll');
            if (result.success) setSettings(result.data);
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'Updates') fetchUpdateHistory();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'Backup') fetchBackupLists();
    }, [activeTab]);



    const fetchUpdateHistory = async () => {
        const result = await window.electron.ipc.invoke('update:history');
        if (result.success) {
            setUpdateHistory(result.history);
        }
    };

    const fetchBackupLists = async () => {
        setLoadingBackups(true);
        const [backupList, recoveryList] = await Promise.all([
            window.electron.ipc.invoke('backup:list'),
            window.electron.ipc.invoke('backup:listRecovery')
        ]);
        if (backupList.success) setBackups(backupList.backups);
        if (recoveryList.success) setRecoveryBackups(recoveryList.backups);
        setLoadingBackups(false);
    };

    const handleCheckUpdates = async () => {
        setCheckingUpdates(true);
        addToast('Checking for updates...', 'info');
        const result = await window.electron.ipc.invoke('update:check');
        setCheckingUpdates(false);
        if (result.success) {
            await fetchUpdateHistory();
            addToast('Update check completed', 'success');
        } else {
            addToast(result.error || 'Failed to check for updates', 'error');
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        const result = await window.electron.ipc.invoke('settings:update', settings);
        setLoading(false);
        if (result.success) {
            addToast('Settings saved successfully', 'success');
        } else {
            addToast(result.error, 'error');
        }
    };

    const handleManualBackup = async () => {
        addToast('Creating backup...', 'info');
        const result = await window.electron.ipc.invoke('backup:create');
        if (result.success) {
            addToast(`Backup created: ${result.name} (${result.records} records)`, 'success');
            await fetchBackupLists();
        } else {
            addToast(result.error, 'error');
        }
    };

    const handleRestoreBackup = async () => {
        const result = await window.electron.ipc.invoke('backup:restore');
        if (result.success) {
            addToast(`Data restored successfully (${result.restored} records)`, 'success');
            await fetchBackupLists();
        } else if (result.error !== 'No file selected') {
            addToast(result.error, 'error');
        }
    };

    const handleRestoreRecovery = async (filePath) => {
        const result = await window.electron.ipc.invoke('backup:restore', filePath);
        if (result.success) {
            addToast(`Recovery backup restored (${result.restored} records)`, 'success');
            await fetchBackupLists();
        } else {
            addToast(result.error, 'error');
        }
    };

    const handleDeleteBackup = async (filePath) => {
        if (window.confirm('Are you sure you want to delete this backup?')) {
            const result = await window.electron.ipc.invoke('backup:delete', filePath);
            if (result.success) {
                addToast('Backup deleted', 'success');
                await fetchBackupLists();
            } else {
                addToast(result.error, 'error');
            }
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        // Validation
        if (!passwordForm.currentPassword) {
            addToast('Please enter your current password', 'error');
            return;
        }

        if (!passwordForm.newPassword) {
            addToast('Please enter a new password', 'error');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            addToast('New password must be at least 6 characters', 'error');
            return;
        }

        if (!/[A-Z]/.test(passwordForm.newPassword)) {
            addToast('Password must contain at least one uppercase letter', 'error');
            return;
        }

        if (!/[0-9]/.test(passwordForm.newPassword)) {
            addToast('Password must contain at least one number', 'error');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            addToast('New passwords do not match', 'error');
            return;
        }

        setChangingPassword(true);

        try {
            const result = await window.electron.ipc.invoke('auth:changePassword', {
                adminId: user._id,
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            if (result.success) {
                addToast('Password changed successfully', 'success');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                addToast(result.error || 'Failed to change password', 'error');
            }
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    const tabs = [
        { name: 'Policy', icon: ShieldCheck },
        { name: 'Security', icon: Lock },
        { name: 'Backup', icon: Database },
        { name: 'Updates', icon: Download },
    ];

    return (
        <div className="flex flex-col animate-fade-in pb-12">

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30 text-white">
                    <Settings2 size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">Settings</h2>
                    <p className="text-sm text-slate-500 font-semibold ">System Config</p>
                </div>
            </div>

            {/* Top Tabs Navigation */}
            <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm mb-8 overflow-x-auto">
                <div className="flex gap-1.5 min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold transition-all whitespace-nowrap
                                ${activeTab === tab.name
                                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/20 active:scale-95'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:scale-95'
                                }
                            `}
                        >
                            <tab.icon size={18} />
                            <span className="text-sm">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div>
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden min-h-[600px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -z-10 pointer-events-none" />

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{activeTab} Preferences</h2>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">Configure your system {activeTab.toLowerCase()} settings</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-70 whitespace-nowrap"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>


                    {/* Policy */}
                    {activeTab === 'Policy' && (
                        <div className="space-y-6 max-w-2xl animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Issue Period (Days)" icon={Calendar}>
                                    <input
                                        className={inputCls}
                                        type="number"
                                        placeholder="30"
                                        value={settings.issue_period_days || ''}
                                        onChange={e => handleChange('issue_period_days', e.target.value)}
                                    />
                                </Field>
                                <Field label="Per Day Late Fine (₹)" icon={IndianRupee}>
                                    <input
                                        className={inputCls}
                                        type="number"
                                        placeholder="10"
                                        value={settings.per_day_fine || ''}
                                        onChange={e => handleChange('per_day_fine', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <Field label="Max Books Per Student" icon={BookOpen}>
                                <input
                                    className={inputCls}
                                    type="number"
                                    placeholder="5"
                                    value={settings.max_books_per_student || ''}
                                    onChange={e => handleChange('max_books_per_student', e.target.value)}
                                />
                            </Field>

                            <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-teal-200 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-teal-500 transition-colors">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">Block Issue on Pending Fine</h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Prevent new issues if student has unpaid fines</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === 'Security' && (
                        <div className="space-y-8 animate-fade-in w-full">
                            {/* Change Password Card */}
                            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white">
                                        <Lock size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-800">Change Password</h4>
                                        <p className="text-sm text-slate-500 mt-1">Update your librarian account password</p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordChange} className="space-y-5">
                                    <Field label="Current Password" icon={Lock}>
                                        <input
                                            className={inputCls}
                                            type="password"
                                            placeholder="Enter your current password"
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            disabled={changingPassword}
                                        />
                                    </Field>

                                    <Field label="New Password" icon={Lock}>
                                        <input
                                            className={inputCls}
                                            type="password"
                                            placeholder="Min 6 chars, 1 uppercase, 1 number"
                                            value={passwordForm.newPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            disabled={changingPassword}
                                        />
                                    </Field>

                                    <Field label="Confirm New Password" icon={Lock}>
                                        <input
                                            className={inputCls}
                                            type="password"
                                            placeholder="Re-enter new password"
                                            value={passwordForm.confirmPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            disabled={changingPassword}
                                        />
                                    </Field>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={changingPassword}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all active:scale-95 disabled:opacity-70"
                                        >
                                            {changingPassword ? (
                                                <>
                                                    <Clock size={18} className="animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={18} />
                                                    Change Password
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-8 p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                                    <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-amber-600" />
                                        Password Requirements
                                    </h5>
                                    <ul className="text-xs text-slate-600 space-y-2">
                                        <li className="flex items-center gap-2">
                                            <Check size={14} className="text-green-600" />
                                            At least 6 characters long
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check size={14} className="text-green-600" />
                                            Contains at least one uppercase letter (A-Z)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check size={14} className="text-green-600" />
                                            Contains at least one number (0-9)
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Security Info */}
                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-3xl">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-blue-900 mb-2">Security Features</h5>
                                        <ul className="text-xs text-blue-700 space-y-2">
                                            <li>✓ Login attempts are rate-limited to prevent brute force attacks</li>
                                            <li>✓ Failed login attempts are logged for security auditing</li>
                                            <li>✓ SMTP passwords are encrypted with AES-256-GCM</li>
                                            <li>✓ All database backups are encrypted</li>
                                            <li>✓ Session tokens expire after 8 hours</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Backup */}
                    {activeTab === 'Backup' && (
                        <div className="space-y-8 animate-fade-in max-w-5xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Manual Backup Card */}
                                <div className="p-6 bg-white border border-teal-100 rounded-3xl space-y-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                                        <Save size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-800">Manual Backup</h4>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Create an immediate encrypted snapshot of your entire database.</p>
                                    </div>
                                    <button
                                        onClick={handleManualBackup}
                                        className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/20 transition-all active:scale-95"
                                    >
                                        Create Backup Now
                                    </button>
                                </div>

                                {/* Restore Data Card */}
                                <div className="p-6 bg-white border border-amber-100 rounded-3xl space-y-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                        <RotateCcw size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-800">Restore Backup</h4>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Restore your database from a previously created .lbak file.</p>
                                    </div>
                                    <button
                                        onClick={handleRestoreBackup}
                                        className="w-full py-3 bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                                    >
                                        Restore from File
                                    </button>
                                </div>
                            </div>

                            {/* Recovery Backups - Auto Backups */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800">Automatic Recovery Backups</h4>
                                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">Safe</span>
                                </div>
                                <p className="text-xs text-slate-600 mb-4">Auto-backups are created every 30 minutes and saved on app startup. These are your safety net in case of data loss.</p>

                                {loadingBackups ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Clock size={18} className="animate-spin text-slate-400 mr-2" />
                                        <span className="text-sm text-slate-500">Loading backups...</span>
                                    </div>
                                ) : recoveryBackups.length === 0 ? (
                                    <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center">
                                        <HardDrive size={32} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-600 font-medium">No recovery backups yet</p>
                                        <p className="text-xs text-slate-500 mt-1">Auto-backups will be created automatically</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                        {recoveryBackups.map((backup, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl hover:border-red-200 transition-all group">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                                        <HardDrive size={16} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{backup.name}</p>
                                                        <p className="text-xs text-slate-500">{backup.date} • {(backup.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRestoreRecovery(backup.path)}
                                                    className="ml-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all whitespace-nowrap"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Manual Backups List */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Database size={18} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800">Manual Backups</h4>
                                </div>
                                <p className="text-xs text-slate-600 mb-4">Backups you created manually are stored in your Documents folder.</p>

                                {loadingBackups ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Clock size={18} className="animate-spin text-slate-400 mr-2" />
                                        <span className="text-sm text-slate-500">Loading backups...</span>
                                    </div>
                                ) : backups.length === 0 ? (
                                    <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center">
                                        <Database size={32} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-600 font-medium">No manual backups created yet</p>
                                        <p className="text-xs text-slate-500 mt-1">Create your first backup using the button above</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                        {backups.map((backup, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl hover:border-blue-200 transition-all group">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                        <Database size={16} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{backup.name}</p>
                                                        <p className="text-xs text-slate-500">{backup.date} • {(backup.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <button
                                                        onClick={() => handleDeleteBackup(backup.path)}
                                                        className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Info Card */}
                            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-blue-900">Data Security</h5>
                                    <p className="text-xs text-blue-700 mt-2">
                                        • All backups are encrypted with AES-256-GCM<br />
                                        • Auto-backups run every 30 minutes automatically<br />
                                        • Initial backup created on app startup<br />
                                        • Recovery backups stored securely on your device<br />
                                        • Last 5 recovery backups are automatically maintained
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Updates */}
                    {activeTab === 'Updates' && (
                        <div className="space-y-8 animate-fade-in max-w-4xl">
                            {/* Check for Updates Card */}
                            <div className="p-6 bg-white border border-blue-100 rounded-3xl space-y-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-800">Check for Updates</h4>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Check if a new version of LibraryPro is available and download it automatically.</p>
                                </div>
                                <button
                                    onClick={handleCheckUpdates}
                                    disabled={checkingUpdates}
                                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {checkingUpdates ? (
                                        <>
                                            <Clock size={18} className="animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            Check for Updates
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Update History */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">Update History</h4>

                                {updateHistory.length === 0 ? (
                                    <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center">
                                        <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-500 font-medium">No updates found yet</p>
                                        <p className="text-xs text-slate-400 font-medium mt-1">Click "Check for Updates" to see available updates</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {updateHistory.map((update, idx) => (
                                            <div key={idx} className="flex items-start gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${update.status === 'Downloaded & Ready to Install'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {update.status === 'Downloaded & Ready to Install' ? (
                                                        <Check size={20} />
                                                    ) : (
                                                        <Download size={20} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h5 className="font-bold text-slate-800">Version {update.version}</h5>
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${update.status === 'Downloaded & Ready to Install'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {update.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium mb-2">
                                                        {new Date(update.timestamp).toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-slate-600">{update.changelog}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
