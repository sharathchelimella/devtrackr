/**
 * context/NotificationContext.jsx – Real-Time Notification Management
 * Integrates Socket.io-client with backend notification store.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications');
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Socket Connection Management
  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch initial list
    fetchNotifications();

    const token = localStorage.getItem('devtrackr_token');
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;

    // Connect to WebSocket server with JWT credentials
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to real-time notification gateway');
    });

    newSocket.on('notification', (notification) => {
      console.log('🔔 Received real-time notification:', notification);

      // Prepend to notification list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Trigger custom UI Toast with category coloring
      let toastTheme = {
        background: '#1e293b',
        color: '#f1f5f9',
        border: '1px solid rgba(255,255,255,0.1)',
      };

      if (notification.type.includes('complete')) {
        toastTheme.border = '1px solid rgba(16,185,129,0.3)';
        toast(
          (t) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-emerald-400 text-xs">✅ {notification.title}</span>
              <span className="text-xs text-slate-300">{notification.message}</span>
            </div>
          ),
          { style: toastTheme, duration: 4000 }
        );
      } else if (notification.type.includes('failed')) {
        toastTheme.border = '1px solid rgba(244,63,94,0.3)';
        toast(
          (t) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-rose-400 text-xs">⚠️ {notification.title}</span>
              <span className="text-xs text-slate-300">{notification.message}</span>
            </div>
          ),
          { style: toastTheme, duration: 5000 }
        );
      } else {
        toastTheme.border = '1px solid rgba(59,130,246,0.3)';
        toast(
          (t) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-blue-400 text-xs">🔔 {notification.title}</span>
              <span className="text-xs text-slate-300">{notification.message}</span>
            </div>
          ),
          { style: toastTheme, duration: 3500 }
        );
      }

      // Dispatch event to pages (e.g. to automatically refresh dashboard/ai insights)
      if (notification.type.startsWith('sync:')) {
        window.dispatchEvent(new Event('github-sync'));
      } else if (notification.type.startsWith('ai:')) {
        window.dispatchEvent(new Event('ai-analysis'));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  // Mark specific notification as read
  const markOneAsRead = async (id) => {
    try {
      await api.put('/api/notifications/read', { id });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Clear/delete a single notification or all
  const deleteNotification = async (id = null) => {
    try {
      const url = id ? `/api/notifications?id=${id}` : '/api/notifications';
      await api.delete(url);
      
      if (id) {
        setNotifications((prev) => {
          const target = prev.find((n) => n.id === id || n._id === id);
          const wasUnread = target && !target.isRead;
          if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
          return prev.filter((n) => n.id !== id && n._id !== id);
        });
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markOneAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
