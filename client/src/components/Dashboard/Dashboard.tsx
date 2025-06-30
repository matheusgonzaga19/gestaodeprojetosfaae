import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import MetricsCards from "./MetricsCards";
import Charts from "./Charts";
import RecentProjects from "./RecentProjects";
import TeamActivity from "./TeamActivity";
import type { DashboardStats, UserStats } from "@/types";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery<UserStats>({
    queryKey: ['/api/dashboard/user-stats'],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  if (statsLoading || userStatsLoading || tasksLoading || projectsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300" 
            alt="Architectural blueprints background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta! 👋</h2>
          <p className="text-blue-100 mb-4">Aqui está um resumo dos seus projetos arquitetônicos</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <i className="fas fa-tasks mr-2"></i>
              {dashboardStats?.totalTasks || 0} tarefas ativas
            </div>
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <i className="fas fa-project-diagram mr-2"></i>
              {dashboardStats?.activeProjects || 0} projetos em andamento
            </div>
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <i className="fas fa-clock mr-2"></i>
              {Math.round(dashboardStats?.totalHours || 0)}h trabalhadas
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <MetricsCards stats={dashboardStats} userStats={userStats} />

      {/* Charts Section */}
      <Charts tasks={tasks} />

      {/* Recent Projects & Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentProjects projects={projects} />
        </div>
        <div>
          <TeamActivity />
        </div>
      </div>
    </div>
  );
}
