import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Layout/Header";
import MobileBottomNav from "@/components/Layout/MobileBottomNav";
import Dashboard from "@/components/Dashboard/Dashboard";
import KanbanBoard from "@/components/Kanban/KanbanBoard";
import CalendarView from "@/components/Calendar/CalendarView";
import FileManager from "@/components/Files/FileManager";
import AIChat from "@/components/Chat/AIChat";
import UserManagement from "@/components/Users/UserManagement";
import ProjectsManager from "@/components/Projects/ProjectsManager";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useUserTypeSetup } from "@/hooks/useUserTypeSetup";
import { loginWithGoogle } from "@/lib/firebase";
import type { User } from "@shared/schema";
import type { Section } from "@/types";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  // Initialize WebSocket connection
  useWebSocket();
  
  // Setup user type if needed
  useUserTypeSetup();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(async () => {
        await loginWithGoogle();
        window.location.reload();
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;

      case 'kanban':
        return <KanbanBoard />;
      case 'projects':
        return <ProjectsManager />;
      case 'calendar':
        return <CalendarView />;
      case 'files':
        return <FileManager />;
      case 'chat':
        return <AIChat />;
      case 'users':
        return user.role === 'admin' ? <UserManagement /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header 
        user={user} 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <main className="transition-all duration-300 pb-16 lg:pb-0 min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)]">
        {renderActiveSection()}
      </main>

      <MobileBottomNav 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userRole={user.role}
      />
    </div>
  );
}
