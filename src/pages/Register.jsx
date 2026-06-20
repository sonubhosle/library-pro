import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, Sparkles } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import Button from '../components/ui/Button';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Mobile number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const Register = () => {
    const { register: registerAdmin } = useAuthStore();
    const { addToast } = useUiStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data) => {
        if (!window.electron) {
            addToast('Please run the application from the Electron desktop window, not a browser.', 'error');
            return;
        }
        setLoading(true);
        const result = await registerAdmin(data);
        setLoading(false);

        if (result.success) {
            addToast('Registration successful', 'success');
            navigate('/');
        } else {
            addToast(result.error || 'Registration failed', 'error');
        }
    };

    return (
        <div className="min-h-screen p-5 bg-gradient-to-br from-emerald-50 via-white to-rose-100  relative flex justify-center ">
            <div className="w-full max-w-xl z-10 animate-slide-in mt-6 md:mt-12">
                <div className="bg-white  rounded-2xl px-5 py-8 shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/60">
                    <div className="text-center mb-10 relative">
                        <div className="">
                            <span className="text-xs bg-teal-50 px-2 border border-teal-200 rounded-full py-1  tracking-widest text-teal-600 uppercase mb-3 flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Library Portal
                                <Sparkles className="w-4 h-4" />
                            </span>
                            <h1 className="text-3xl font-extrabold  text-slate-800 tracking-tight leading-tight mb-4">
                                MIT COLLEGE <br />
                                <span className="text-transparent uppercase bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600">
                                    Of Cs & It Basmath
                                </span>
                            </h1>
                            <p className="text-slate-500 font-medium">Create Admin Account</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-sm  text-slate-600 pl-1  text-[10px]">
                                    Full Name
                                </label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3 text-slate-600 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                                        <User size={18} />
                                    </div>
                                    <input
                                        className={`pl-10 w-full h-11 border border-slate-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 text-slate-600  rounded-xl transition ease-in duration-300 ${errors.name ? 'border-danger focus:ring-danger' : ''}`}
                                        placeholder="John Doe"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name?.message && (
                                    <span className="text-xs text-danger font-medium pl-1 animate-fade-in">
                                        {errors.name.message}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-sm  text-slate-600 pl-1  text-[10px]">
                                    Email Address
                                </label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3 text-slate-600 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        className={`pl-10 w-full h-11 border border-slate-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 text-slate-600  rounded-xl transition ease-in duration-300 ${errors.email ? 'border-danger focus:ring-danger' : ''}`}
                                        placeholder="admin@example.com"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email?.message && (
                                    <span className="text-xs text-danger font-medium pl-1 animate-fade-in">
                                        {errors.email.message}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5 w-full md:col-span-2">
                                <label className="text-sm  text-slate-600 pl-1  text-[10px]">
                                    Mobile No
                                </label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3 text-slate-600 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        className={`pl-10 w-full h-11 border border-slate-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 text-slate-600  rounded-xl transition ease-in duration-300 ${errors.phone ? 'border-danger focus:ring-danger' : ''}`}
                                        placeholder="+91 XXXXX XXXXX"
                                        {...register('phone')}
                                    />
                                </div>
                                {errors.phone?.message && (
                                    <span className="text-xs text-danger font-medium pl-1 animate-fade-in">
                                        {errors.phone.message}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-sm  text-slate-600 pl-1  text-[10px]">
                                    Password
                                </label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3 text-slate-600 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className={`pl-10 w-full h-11 border border-slate-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 text-slate-600  rounded-xl transition ease-in duration-300 ${errors.password ? 'border-danger focus:ring-danger' : ''}`}
                                    />
                                    <div className="absolute right-3 z-10 flex items-center pointer-events-auto">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowPassword((prev) => !prev);
                                            }}
                                            className="text-slate-400 hover:text-teal-500 transition-colors focus:outline-none p-1.5 rounded-full hover:bg-blue-50 flex items-center justify-center cursor-pointer pointer-events-auto"
                                            tabIndex="-1"
                                        >
                                            {showPassword ? <EyeOff size={18} className="pointer-events-none" /> : <Eye size={18} className="pointer-events-none" />}
                                        </button>
                                    </div>
                                </div>
                                {errors.password?.message && (
                                    <span className="text-xs text-danger font-medium pl-1 animate-fade-in">
                                        {errors.password.message}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-sm  text-slate-600 pl-1  text-[10px]">
                                    Confirm Password
                                </label>
                                <div className="relative group flex items-center">
                                    <div className="absolute left-3 text-slate-600 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        {...register('confirmPassword')}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className={`pl-10 w-full h-11 border border-slate-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 text-slate-600  rounded-xl transition ease-in duration-300 ${errors.confirmPassword ? 'border-danger focus:ring-danger' : ''}`}
                                    />
                                    <div className="absolute right-3 z-10 flex items-center pointer-events-auto">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowConfirmPassword((prev) => !prev);
                                            }}
                                            className="text-slate-400 hover:text-teal-500 transition-colors focus:outline-none p-1.5 rounded-full hover:bg-blue-50 flex items-center justify-center cursor-pointer pointer-events-auto"
                                            tabIndex="-1"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} className="pointer-events-none" /> : <Eye size={18} className="pointer-events-none" />}
                                        </button>
                                    </div>
                                </div>
                                {errors.confirmPassword?.message && (
                                    <span className="text-xs text-danger font-medium pl-1 animate-fade-in">
                                        {errors.confirmPassword.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-md rounded-xl bg-gradient-to-r from-teal-400 to-teal-600   !text-white mt-4 md:mt-8"
                            loading={loading}
                            icon={UserPlus}
                        >
                            Create Admin Account
                        </Button>

                        <div className="text-center text-sm font-medium text-slate-500 mt-6 pt-4 border-t border-slate-100">
                            Already have an account?{' '}
                            <Link to="/login" className="text-teal-600  hover:text-teal-600 transition-colors ">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
