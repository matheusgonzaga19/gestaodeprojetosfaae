import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Layout/Header";
import Dashboard from "@/components/Dashboard/Dashboard";
import KanbanBoard from "@/components/Kanban/KanbanBoard";
import CalendarView from "@/components/Calendar/CalendarView";
import FileManager from "@/components/Files/FileManager";
import AIChat from "@/components/Chat/AIChat";
import UserManagement from "@/components/Users/UserManagement";
import HeroSection from "@/components/Dashboard/HeroSection";
import { useWebSocket } from "@/hooks/useWebSocket";

type Section = 'dashboard' | 'kanban' | 'calendar' | 'files' | 'chat' | 'users';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  // Initialize WebSocket connection
  useWebSocket();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
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
        return (
          <div>
            <HeroSection />
            <Dashboard />
          </div>
        );
      case 'kanban':
        return <KanbanBoard />;
      case 'calendar':
        return <CalendarView />;
      case 'files':
        return <FileManager />;
      case 'chat':
        return <AIChat />;
      case 'users':
        return user.role === 'admin' ? <UserManagement /> : (
          <div>
            <HeroSection />
            <Dashboard />
          </div>
        );
      default:
        return (
          <div>
            <HeroSection />
            <Dashboard />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header 
        user={user} 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <main className="transition-all duration-300">
        {renderActiveSection()}
      </main>
    </div>
  );
}
