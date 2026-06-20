import create from 'zustand';
import { devtools } from 'zustand/middleware';

const useNotificationStore = create(devtools(set => ({
  notifications: [],
  fetchAll: async (adminId) => {
    try {
      const res = await window.electron.ipc.invoke('notifications:getAll', { adminId });
      if (res.success) {
        set({ notifications: res.data });
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  },
  markRead: async (id) => {
    try {
      const res = await window.electron.ipc.invoke('notifications:markRead', { id });
      if (res.success) {
        set(state => ({
          notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n)
        }));
      }
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  },
  deleteNotification: async (id) => {
    try {
      const res = await window.electron.ipc.invoke('notifications:delete', { id });
      if (res.success) {
        set(state => ({
          notifications: state.notifications.filter(n => n._id !== id)
        }));
      }
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  },
})),
{
  name: 'NotificationStore',
});

export default useNotificationStore;
