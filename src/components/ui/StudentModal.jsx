import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Users, User, Hash, GraduationCap, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import Button from './Button';
import Dropdown from './Dropdown';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

const CLASS_OPTIONS = ['BCA', 'B.Sc (CS)'];
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year'];

/* Reusable Login-style field wrapper */
const Field = ({ label, icon: Icon, error, children }) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm text-slate-600 pl-1 text-[10px]">{label}</label>
        <div className="relative group flex items-center">
            {Icon && (
                <div className="absolute left-3 text-slate-600 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                    <Icon size={18} />
                </div>
            )}
            {children}
        </div>
        {error && (
            <span className="text-xs text-red-500 font-medium pl-1 animate-fade-in">{error}</span>
        )}
    </div>
);

const inputCls = (hasError) =>
    `pl-10 w-full h-11 border outline-none rounded-xl transition ease-in duration-300 text-slate-600 text-sm
     ${hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100'
        : 'border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50'}`;

const StudentModal = ({ isOpen, onClose, onSuccess, student = null }) => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = React.useState(false);
    const isEdit = !!student;

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        setValue,
    } = useForm();

    useEffect(() => {
        if (isOpen) {
            if (student) {
                setValue('name', student.name);
                setValue('roll_number', student.roll_number);
                setValue('class', student.class);
                setValue('year', student.year);
                setValue('phone', student.phone);
                setValue('email', student.email);
                setValue('address', student.address);
            } else {
                reset();
            }
        }
    }, [isOpen, student, setValue, reset]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const result = isEdit
                ? await window.electron.ipc.invoke('students:update', { id: student.id, data, adminId: user?._id })
                : await window.electron.ipc.invoke('students:create', { data, adminId: user?._id });

            if (result.success) {
                addToast(`Student ${isEdit ? 'updated' : 'added'} successfully`, 'success');
                reset();
                onSuccess?.();
                onClose();
            } else {
                addToast(result.error || `Failed to ${isEdit ? 'update' : 'add'} student`, 'error');
            }
        } catch {
            addToast('An unexpected error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl shadow-sm">
                            <Users size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                {isEdit ? 'Edit Student' : 'Add New Student'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {isEdit ? `Editing details for ${student.name}` : 'Fill in the student details below'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Full Name */}
                        <div className="md:col-span-2">
                            <Field label="Full Name" icon={User} error={errors.name?.message}>
                                <input
                                    placeholder="e.g. Rahul Sharma"
                                    className={inputCls(!!errors.name)}
                                    {...register('name', { required: 'Name is required' })}
                                />
                            </Field>
                        </div>

                        {/* Roll Number */}
                        <Field label="Roll Number" icon={Hash} error={errors.roll_number?.message}>
                            <input
                                placeholder="e.g. 2024BCA001"
                                className={inputCls(!!errors.roll_number)}
                                {...register('roll_number', { required: 'Roll number is required' })}
                            />
                        </Field>

                        {/* Phone */}
                        <Field label="Phone Number" icon={Phone}>
                            <input
                                type="tel"
                                placeholder="e.g. 9876543210"
                                className={inputCls(false)}
                                {...register('phone')}
                            />
                        </Field>

                        {/* Class */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-slate-600 pl-1 text-[10px]">Class</label>
                            <Controller
                                name="class"
                                control={control}
                                rules={{ required: 'Class is required' }}
                                render={({ field }) => (
                                    <Dropdown
                                        options={CLASS_OPTIONS}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select class..."
                                        icon={GraduationCap}
                                    />
                                )}
                            />
                            {errors.class && (
                                <span className="text-xs text-red-500 font-medium pl-1 animate-fade-in">
                                    {errors.class.message}
                                </span>
                            )}
                        </div>

                        {/* Year */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-slate-600 pl-1 text-[10px]">Year</label>
                            <Controller
                                name="year"
                                control={control}
                                rules={{ required: 'Year is required' }}
                                render={({ field }) => (
                                    <Dropdown
                                        options={YEAR_OPTIONS}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select year..."
                                        icon={Calendar}
                                    />
                                )}
                            />
                            {errors.year && (
                                <span className="text-xs text-red-500 font-medium pl-1 animate-fade-in">
                                    {errors.year.message}
                                </span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="md:col-span-2">
                            <Field label="Email Address (optional)" icon={Mail}>
                                <input
                                    type="email"
                                    placeholder="e.g. rahul@example.com"
                                    className={inputCls(false)}
                                    {...register('email')}
                                />
                            </Field>
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2 flex flex-col gap-1.5">
                            <label className="text-sm text-slate-600 pl-1 text-[10px]">Address (optional)</label>
                            <div className="relative group flex items-start">
                                <div className="absolute left-3 top-3 text-slate-600 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                                    <MapPin size={18} />
                                </div>
                                <textarea
                                    rows={2}
                                    placeholder="Student's home address..."
                                    className="pl-10 w-full border border-slate-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-xl pt-2.5 pb-2.5 pr-3 transition ease-in duration-300 text-slate-600 text-sm resize-none"
                                    {...register('address')}
                                />
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={loading} icon={Users}>
                            {isEdit ? 'Save Changes' : 'Register Student'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentModal;
