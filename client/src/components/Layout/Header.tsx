import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useQuery } from "@tanstack/react-query";
import Navigation from "./Navigation";
import type { User } from "@shared/schema";

interface HeaderProps {
  user: User;
  activeSection: string;
  onSectionChange: (section: any) => void;
}

export default function Header({ user, activeSection, onSectionChange }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Usuário";
  };

  const getRoleDisplay = () => {
    return user.role === 'admin' ? 'Administrador' : 'Colaborador';
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <i className="fas fa-building text-white text-sm sm:text-lg"></i>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold">FAAE Projetos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gestão Inteligente</p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-lg font-bold">FAAE</h1>
          </div>
        </div>
        
        {/* Navigation */}
        <Navigation 
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          userRole={user.role}
        />
        
        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            >
              <i className="fas fa-bell text-gray-600 dark:text-gray-400"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-sm sm:text-base">Notificações</h3>
                </div>
                <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification: any) => (
                      <div 
                        key={notification.id}
                        className={`p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma notificação
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=2563eb&color=fff`}
              alt="User Avatar" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
            <div className="hidden sm:block">
              <p className="font-semibold text-sm">{getDisplayName()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleDisplay()}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Sair"
            >
              <i className="fas fa-sign-out-alt text-gray-600 dark:text-gray-400 text-sm"></i>
            </button>
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Alternar tema"
          >
            {theme === 'light' ? (
              <i className="fas fa-moon text-gray-600 text-sm"></i>
            ) : (
              <i className="fas fa-sun text-gray-400 text-sm"></i>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
