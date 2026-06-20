import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Book, User, Hash, Tag, IndianRupee } from 'lucide-react';
import Button from './Button';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

/* Login-style field wrapper */
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

const BookModal = ({ isOpen, onClose, onSuccess, book = null }) => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = React.useState(false);
    const isEdit = !!book;

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

    useEffect(() => {
        if (isOpen) {
            if (book) {
                setValue('title', book.title);
                setValue('author', book.author);
                setValue('isbn', book.isbn || book.book_code);
                setValue('category', book.category);
                setValue('price', book.price);
                setValue('total_copies', book.total_copies);
            } else {
                reset();
            }
        }
    }, [isOpen, book, setValue, reset]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                total_copies: parseInt(data.total_copies),
                available_copies: isEdit ? book.available_copies : parseInt(data.total_copies),
                price: parseFloat(data.price) || 0,
            };

            const result = isEdit
                ? await window.electron.ipc.invoke('books:update', { id: book.id, data: payload, adminId: user?._id })
                : await window.electron.ipc.invoke('books:create', { data: payload, adminId: user?._id });

            if (result.success) {
                addToast(`Book ${isEdit ? 'updated' : 'added'} successfully`, 'success');
                reset();
                onSuccess();
                onClose();
            } else {
                addToast(result.error || `Failed to ${isEdit ? 'update' : 'add'} book`, 'error');
            }
        } catch {
            addToast('An error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

            {/* Modal Panel */}
            <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl shadow-sm">
                            <Book size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                {isEdit ? 'Edit Book' : 'Add New Book'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {isEdit ? `Update details for ${book.title}` : 'Enter book details to add it to the inventory'}
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

                        {/* Title */}
                        <div className="md:col-span-2">
                            <Field label="Book Title" icon={Book} error={errors.title?.message}>
                                <input
                                    placeholder="e.g. The Great Gatsby"
                                    className={inputCls(!!errors.title)}
                                    {...register('title', { required: 'Title is required' })}
                                />
                            </Field>
                        </div>

                        {/* Author */}
                        <Field label="Author Name" icon={User} error={errors.author?.message}>
                            <input
                                placeholder="e.g. F. Scott Fitzgerald"
                                className={inputCls(!!errors.author)}
                                {...register('author', { required: 'Author is required' })}
                            />
                        </Field>

                        {/* ISBN Code */}
                        <Field label="ISBN Code" icon={Hash} error={errors.isbn?.message}>
                            <input
                                placeholder="e.g. 978-3-16-148410-0"
                                className={inputCls(!!errors.isbn)}
                                {...register('isbn', { required: 'ISBN Code is required' })}
                            />
                        </Field>

                        {/* Category */}
                        <Field label="Category" icon={Tag} error={errors.category?.message}>
                            <input
                                placeholder="e.g. Fiction"
                                className={inputCls(!!errors.category)}
                                {...register('category', { required: 'Category is required' })}
                            />
                        </Field>

                        {/* Price */}
                        <Field label="Price (₹)" icon={IndianRupee}>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className={inputCls(false)}
                                {...register('price')}
                            />
                        </Field>

                        {/* Total Copies */}
                        <Field label="Total Copies" icon={Hash} error={errors.total_copies?.message}>
                            <input
                                type="number"
                                placeholder="1"
                                defaultValue="1"
                                className={inputCls(!!errors.total_copies)}
                                {...register('total_copies', { required: 'Count is required' })}
                            />
                        </Field>

                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={loading} icon={Book}>
                            {isEdit ? 'Update Changes' : 'Register Book'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookModal;
