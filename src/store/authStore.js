import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    error: null,

    checkAuth: async () => {
        set({ loading: true });
        try {
            const result = await window.electron.ipc.invoke('auth:getCurrentUser');
            if (result.success) {
                set({ user: result.user, loading: false });
            } else {
                set({ user: null, loading: false });
            }
        } catch (error) {
            set({ user: null, loading: false, error: error.message });
        }
    },

    login: async (email, password) => {
        set({ loading: true, error: null });
        const result = await window.electron.ipc.invoke('auth:login', { email, password });
        if (result.success) {
            set({ user: result.user, loading: false });
            return { success: true };
        } else {
            set({ error: result.error, loading: false });
            return { success: false, error: result.error };
        }
    },

    register: async (data) => {
        set({ loading: true, error: null });
        const result = await window.electron.ipc.invoke('auth:register', data);
        if (result.success) {
            set({ user: result.user, loading: false });
            return { success: true };
        } else {
            set({ error: result.error, loading: false });
            return { success: false, error: result.error };
        }
    },

    logout: async () => {
        await window.electron.ipc.invoke('auth:logout');
        set({ user: null });
    }
}));

export default useAuthStore;
