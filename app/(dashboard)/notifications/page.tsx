
// app/(dashboard)/notifications/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CheckCircle2, Clock, AlertTriangle, Info, Calendar, Filter, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get<any[]>('/notifications?limit=50');
      setNotifications(data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoading(false); 
    }
  };

 const handleMarkAsRead = async (id: string) => {
    try {
      // ✅ On ajoute {} pour satisfaire le "body" obligatoire de ton service api
      await api.patch(`/notifications/${id}/read`, {}); 
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // ✅ Ici aussi, on envoie un objet vide
      await api.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };
  const getIcon = (type: string) => {
    switch(type) {
      case 'LEAVE_REQUEST':
      case 'LEAVE_APPROVED':
      case 'LEAVE_REJECTED':
        return <Calendar className="text-sky-500" />;
      case 'PAYROLL_READY':
        return <CheckCircle2 className="text-emerald-500" />;
      case 'ATTENDANCE_ALERT':
        return <Clock className="text-orange-500" />;
      case 'PAYROLL_ERROR':
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="text-red-500" />;
      default:
        return <Info className="text-gray-500" />;
    }
  };

  const filtered = notifications.filter(n => 
    filter === 'ALL' || n.type.includes(filter)
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-[1000px] mx-auto pb-20 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border hover:bg-gray-50">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-3 px-3 py-1 text-sm bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-500">Historique de votre activité</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm font-bold text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="flex gap-2 pb-4 overflow-x-auto">
        {[
          { key: 'ALL', label: 'Tout' },
          { key: 'LEAVE', label: 'Congés' },
          { key: 'PAYROLL', label: 'Paie' },
          { key: 'ATTENDANCE', label: 'Pointage' }
        ].map(f => (
          <button 
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
              filter === f.key 
                ? 'bg-sky-500 text-white border-sky-500' 
                : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-sky-500" size={48}/>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center p-20 text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <Bell size={48} className="mx-auto mb-4 opacity-20"/>
              <p>Aucune notification trouvée</p>
            </div>
          ) : (
            filtered.map(n => (
              <div 
                key={n.id} 
                onClick={() => !n.read && handleMarkAsRead(n.id)}
                className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border flex gap-4 transition-all cursor-pointer hover:shadow-md ${
                  !n.read 
                    ? 'border-l-4 border-l-sky-500 border-gray-200 dark:border-gray-700' 
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl h-fit">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {n.title}
                      </h3>
                      {!n.read && (
                        <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(n.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}