import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarHeatmap from "./CalendarHeatmap";
import { formatDistanceToNow, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails } from "@shared/schema";

// Feriados de São Paulo 2024-2025
const SP_HOLIDAYS = {
  2024: [
    { date: '2024-01-01', name: 'Ano Novo', type: 'nacional' },
    { date: '2024-01-25', name: 'Aniversário de São Paulo', type: 'municipal' },
    { date: '2024-02-12', name: 'Carnaval', type: 'nacional' },
    { date: '2024-02-13', name: 'Carnaval', type: 'nacional' },
    { date: '2024-02-14', name: 'Quarta-feira de Cinzas', type: 'ponto_facultativo' },
    { date: '2024-03-29', name: 'Sexta-feira Santa', type: 'nacional' },
    { date: '2024-04-21', name: 'Tiradentes', type: 'nacional' },
    { date: '2024-05-01', name: 'Dia do Trabalho', type: 'nacional' },
    { date: '2024-05-30', name: 'Corpus Christi', type: 'municipal' },
    { date: '2024-07-09', name: 'Revolução Constitucionalista', type: 'estadual' },
    { date: '2024-09-07', name: 'Independência do Brasil', type: 'nacional' },
    { date: '2024-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
    { date: '2024-11-02', name: 'Finados', type: 'nacional' },
    { date: '2024-11-15', name: 'Proclamação da República', type: 'nacional' },
    { date: '2024-11-20', name: 'Consciência Negra', type: 'municipal' },
    { date: '2024-12-25', name: 'Natal', type: 'nacional' },
  ],
  2025: [
    { date: '2025-01-01', name: 'Ano Novo', type: 'nacional' },
    { date: '2025-01-25', name: 'Aniversário de São Paulo', type: 'municipal' },
    { date: '2025-03-03', name: 'Carnaval', type: 'nacional' },
    { date: '2025-03-04', name: 'Carnaval', type: 'nacional' },
    { date: '2025-03-05', name: 'Quarta-feira de Cinzas', type: 'ponto_facultativo' },
    { date: '2025-04-18', name: 'Sexta-feira Santa', type: 'nacional' },
    { date: '2025-04-21', name: 'Tiradentes', type: 'nacional' },
    { date: '2025-05-01', name: 'Dia do Trabalho', type: 'nacional' },
    { date: '2025-06-19', name: 'Corpus Christi', type: 'municipal' },
    { date: '2025-07-09', name: 'Revolução Constitucionalista', type: 'estadual' },
    { date: '2025-09-07', name: 'Independência do Brasil', type: 'nacional' },
    { date: '2025-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
    { date: '2025-10-15', name: 'Dia do Professor', type: 'ponto_facultativo' },
    { date: '2025-10-28', name: 'Dia do Servidor Público', type: 'ponto_facultativo' },
    { date: '2025-11-02', name: 'Finados', type: 'nacional' },
    { date: '2025-11-15', name: 'Proclamação da República', type: 'nacional' },
    { date: '2025-11-20', name: 'Consciência Negra', type: 'municipal' },
    { date: '2025-12-25', name: 'Natal', type: 'nacional' },
  ]
};

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

  // Obter feriados do ano selecionado
  const holidays = useMemo(() => {
    return SP_HOLIDAYS[selectedYear as keyof typeof SP_HOLIDAYS] || [];
  }, [selectedYear]);

  // Função para verificar se uma data é feriado
  const isHoliday = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.find(holiday => holiday.date === dateStr);
  };

  // Obter feriados do mês selecionado
  const monthHolidays = useMemo(() => {
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getMonth() === selectedMonth && holidayDate.getFullYear() === selectedYear;
    });
  }, [holidays, selectedMonth, selectedYear]);

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
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Calendário de Projetos</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Visualize prazos e marcos importantes</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-40">
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
            <SelectTrigger className="w-full sm:w-24">
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
        </div>
      </div>

      {/* Calendar Heatmap */}
      <CalendarHeatmap tasks={tasks} year={selectedYear} holidays={holidays} />

      {/* Seção de Feriados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
        {/* Feriados do Mês */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="fas fa-calendar-star text-blue-600"></i>
              Feriados em {months[selectedMonth]} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthHolidays.length > 0 ? (
              <div className="space-y-3">
                {monthHolidays.map((holiday, index) => {
                  const holidayDate = new Date(holiday.date);
                  const typeColors = {
                    nacional: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
                    estadual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
                    municipal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
                    ponto_facultativo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                  };
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-300 font-bold">
                            {holidayDate.getDate()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {holiday.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(holidayDate, 'EEEE, d MMMM', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${typeColors[holiday.type as keyof typeof typeColors]} text-xs`}>
                        {holiday.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-day text-gray-400 text-2xl"></i>
                </div>
                <p className="text-gray-500 dark:text-gray-400">Nenhum feriado neste mês</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos Feriados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="fas fa-calendar-week text-green-600"></i>
              Próximos Feriados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {holidays
                .filter(holiday => new Date(holiday.date) >= new Date())
                .slice(0, 5)
                .map((holiday, index) => {
                  const holidayDate = new Date(holiday.date);
                  const daysUntil = Math.ceil((holidayDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-300 text-xs font-bold">
                          {holidayDate.getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{holiday.name}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {daysUntil === 0 ? 'Hoje' : 
                           daysUntil === 1 ? 'Amanhã' : 
                           `Em ${daysUntil} dias`}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Prazos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                <i className="fas fa-exclamation-triangle"></i>
                Tarefas em Atraso ({overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border-l-4 ${getPriorityColor(task.priority)} rounded-r-lg`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className={getPriorityIcon(task.priority)}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm sm:text-base">{task.title}</h4>
                        <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm">
                          Venceu {formatDistanceToNow(new Date(task.dueDate!), { addSuffix: true, locale: ptBR })}
                        </p>
                        {task.project && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {task.project.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-red-600 dark:text-red-400 self-end sm:self-center">
                      <i className="fas fa-calendar-times"></i>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="fas fa-calendar-alt text-blue-600"></i>
              Próximos Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task) => {
                  const daysUntilDue = Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntilDue <= 3;
                  
                  return (
                    <div
                      key={task.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border-l-4 ${
                        isUrgent 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                          : getPriorityColor(task.priority)
                      } rounded-r-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${
                          isUrgent ? 'bg-orange-100 dark:bg-orange-900' : 'bg-blue-100 dark:bg-blue-900'
                        } rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <i className={isUrgent ? 'fas fa-clock text-orange-600 dark:text-orange-400' : getPriorityIcon(task.priority)}></i>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm sm:text-base ${
                            isUrgent ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {task.title}
                          </h4>
                          <p className={`text-xs sm:text-sm ${
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
                      </div>
                      <div className={`${isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'} self-end sm:self-center`}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
