import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, GraduationCap, Sparkles } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import Button from '../components/ui/Button';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
    const { login } = useAuthStore();
    const { addToast } = useUiStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data) => {
        setLoading(true);
        const result = await login(data.email, data.password);
        setLoading(false);

        if (result.success) {
            addToast('Login successful', 'success');
            navigate('/');
        } else {
            addToast(result.error || 'Login failed', 'error');
        }
    };

    return (
        <div className="h-screen p-5 bg-gradient-to-br from-emerald-50 via-white to-rose-100  relative flex justify-center ">
            {/* Premium Decorative Background Elements */}

            <div className="w-full max-w-lg z-10 animate-slide-in mt-12">


                <div className="bg-white  rounded-2xl px-5 py-5 shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/60">
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
                            <p className="text-slate-500 font-medium">Please enter your credentials to continue</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm  text-slate-600 pl-1  text-[10px]">
                                Email
                            </label>
                            <div className="relative group flex items-center">
                                <div className="absolute left-3 text-slate-600 group-focus-within:text-teal-500 transition-colors z-10 pointer-events-none">
                                    <Mail size={18} />
                                </div>
                                <input
                                    className={`pl-10 w-full h-11 border border-slate-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 text-slate-600  rounded-xl transition ease-in duration-300 ${errors.email ? 'border-danger focus:ring-danger' : ''}`}
                                    placeholder="student@mitbasmath.edu"
                                    {...register('email')}
                                />
                            </div>
                            {errors.email?.message && (
                                <span className="text-xs text-danger font-medium pl-1 animate-fade-in">
                                    {errors.email.message}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
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
                                        className={`pl-10 w-full h-11 border border-slate-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 text-slate-600  rounded-xl transition ease-in duration-300 ${errors.email ? 'border-danger focus:ring-danger' : ''}`}
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
                            <div className="flex justify-between items-center px-1 pt-2">
                                <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer group">
                                    <input type="checkbox" className="rounded border-slate-300 text-teal-400 focus:ring-blue-500 cursor-pointer transition-all" />
                                    <span className="group-hover:text-slate-800 transition-colors">Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-600 transition-colors ">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-md rounded-xl bg-gradient-to-r from-teal-400 to-teal-600   !text-white"
                            loading={loading}
                            icon={LogIn}
                        >
                            Sign In
                        </Button>

                        <div className="text-center text-sm font-medium text-slate-500  border-t border-slate-100">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-teal-600  hover:text-teal-600 transition-colors ">
                                Signup Now
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
