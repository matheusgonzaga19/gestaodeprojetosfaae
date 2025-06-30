import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import CalendarHeatmap from "./CalendarHeatmap";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails } from "@/types";

export default function CalendarView() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: tasks = [], isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks'],
  });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getUpcomingDeadlines = () => {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return tasks
      .filter(task => {
        if (!task.dueDate || task.status === 'concluida') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= twoWeeksFromNow;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 10);
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks
      .filter(task => {
        if (!task.dueDate || task.status === 'concluida') return false;
        return new Date(task.dueDate) < now;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'alta':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'media':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'fas fa-exclamation-triangle text-red-600 dark:text-red-400';
      case 'alta':
        return 'fas fa-exclamation-circle text-orange-600 dark:text-orange-400';
      case 'media':
        return 'fas fa-clock text-yellow-600 dark:text-yellow-400';
      default:
        return 'fas fa-circle text-green-600 dark:text-green-400';
    }
  };

  const upcomingDeadlines = getUpcomingDeadlines();
  const overdueTasks = getOverdueTasks();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Calendário de Projetos</h2>
          <p className="text-gray-600 dark:text-gray-400">Visualize prazos e marcos importantes</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button>
            <i className="fas fa-calendar-plus mr-2"></i>
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <CalendarHeatmap tasks={tasks} year={selectedYear} />

      {/* Deadlines Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Tarefas em Atraso ({overdueTasks.length})
              </h3>
            </div>
            <div className="space-y-4">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center space-x-4 p-4 border-l-4 ${getPriorityColor(task.priority)} rounded-r-lg`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                      <i className={getPriorityIcon(task.priority)}></i>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 dark:text-red-100">{task.title}</h4>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      Venceu {formatDistanceToNow(new Date(task.dueDate!), { addSuffix: true, locale: ptBR })}
                    </p>
                    {task.project && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {task.project.name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-red-600 dark:text-red-400">
                    <i className="fas fa-calendar-times"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-6">Próximos Prazos</h3>
          <div className="space-y-4">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((task) => {
                const daysUntilDue = Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntilDue <= 3;
                
                return (
                  <div
                    key={task.id}
                    className={`flex items-center space-x-4 p-4 border-l-4 ${
                      isUrgent 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                        : getPriorityColor(task.priority)
                    } rounded-r-lg`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 ${
                        isUrgent ? 'bg-orange-100 dark:bg-orange-900' : 'bg-blue-100 dark:bg-blue-900'
                      } rounded-lg flex items-center justify-center`}>
                        <i className={isUrgent ? 'fas fa-clock text-orange-600 dark:text-orange-400' : getPriorityIcon(task.priority)}></i>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        isUrgent ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {task.title}
                      </h4>
                      <p className={`text-sm ${
                        isUrgent ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {daysUntilDue === 0 ? 'Vence hoje' : 
                         daysUntilDue === 1 ? 'Vence amanhã' : 
                         `Vence em ${daysUntilDue} dias`}
                      </p>
                      {task.project && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {task.project.name}
                        </Badge>
                      )}
                    </div>
                    <div className={isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}>
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-check text-gray-400 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Nenhum prazo próximo
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Você está em dia com suas tarefas!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
