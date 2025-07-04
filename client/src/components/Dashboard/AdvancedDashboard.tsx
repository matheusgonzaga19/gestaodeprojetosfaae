import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
  UserIcon,
  ClockIcon,
  TrendingUpIcon,
  FileTextIcon,
} from "lucide-react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails, User, Project } from "@shared/schema";

interface Filters {
  startDate: string;
  endDate: string;
  priority: string;
  status: string;
  userId: string;
  projectId: string;
  category: string;
}

const PRIORITY_COLORS = {
  baixa: "#22c55e",
  media: "#f59e0b", 
  alta: "#ef4444",
  critica: "#dc2626",
};

const STATUS_COLORS = {
  aberta: "#6b7280",
  em_andamento: "#3b82f6",
  concluida: "#22c55e",
  cancelada: "#ef4444",
};

export default function AdvancedDashboard() {
  const [filters, setFilters] = useState<Filters>({
    startDate: "",
    endDate: "",
    priority: "",
    status: "",
    userId: "",
    projectId: "",
    category: "",
  });

  const [filteredTasks, setFilteredTasks] = useState<TaskWithDetails[]>([]);

  const { data: tasks = [] } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Apply filters whenever tasks or filters change
  useEffect(() => {
    let filtered = [...tasks];

    if (filters.startDate) {
      const startDate = startOfDay(parseISO(filters.startDate));
      filtered = filtered.filter(task => 
        task.createdAt && new Date(task.createdAt) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = endOfDay(parseISO(filters.endDate));
      filtered = filtered.filter(task => 
        task.createdAt && new Date(task.createdAt) <= endDate
      );
    }

    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.userId) {
      filtered = filtered.filter(task => 
        task.assignedUserId === filters.userId || task.createdUserId === filters.userId
      );
    }

    if (filters.projectId) {
      filtered = filtered.filter(task => task.projectId?.toString() === filters.projectId);
    }

    setFilteredTasks(filtered);
  }, [tasks, filters]);

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      priority: "",
      status: "",
      userId: "",
      projectId: "",
      category: "",
    });
  };

  const generatePDF = async () => {
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE ATIVIDADES - FAAE PROJETOS', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Fim'}`, 20, 35);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 45);

    // Summary
    let yPosition = 60;
    doc.setFontSize(16);
    doc.text('RESUMO GERAL', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'concluida').length;
    const inProgressTasks = filteredTasks.filter(t => t.status === 'em_andamento').length;
    const openTasks = filteredTasks.filter(t => t.status === 'aberta').length;

    doc.text(`Total de Tarefas: ${totalTasks}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Tarefas Concluídas: ${completedTasks}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Tarefas em Andamento: ${inProgressTasks}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Tarefas Abertas: ${openTasks}`, 20, yPosition);
    yPosition += 20;

    // Tasks by user
    if (filters.userId) {
      const user = users.find(u => u.id === filters.userId);
      if (user) {
        doc.setFontSize(16);
        doc.text(`TAREFAS POR USUÁRIO: ${user.firstName} ${user.lastName}`, 20, yPosition);
        yPosition += 15;

        filteredTasks.forEach((task, index) => {
          if (yPosition > 270) { // Start new page
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.text(`${index + 1}. ${task.title}`, 25, yPosition);
          yPosition += 8;
          doc.setFontSize(10);
          doc.text(`   Status: ${task.status} | Prioridade: ${task.priority}`, 25, yPosition);
          yPosition += 8;
          if (task.description) {
            doc.text(`   Descrição: ${task.description.substring(0, 80)}...`, 25, yPosition);
            yPosition += 8;
          }
          yPosition += 5;
        });
      }
    }

    doc.save(`relatorio-faae-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  // Calculate metrics for charts
  const tasksByPriority = Object.entries(PRIORITY_COLORS).map(([priority, color]) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: filteredTasks.filter(t => t.priority === priority).length,
    color,
  }));

  const tasksByStatus = Object.entries(STATUS_COLORS).map(([status, color]) => ({
    name: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
    value: filteredTasks.filter(t => t.status === status).length,
    color,
  }));

  const tasksByUser = users.map(user => ({
    name: `${user.firstName} ${user.lastName}` || user.email,
    tasks: filteredTasks.filter(t => t.assignedUserId === user.id || t.createdUserId === user.id).length,
  })).filter(u => u.tasks > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Avançado</h1>
          <p className="text-muted-foreground">
            Visualização completa e interativa dos dados de projetos e tarefas
          </p>
        </div>
        <Button onClick={generatePDF} className="flex items-center gap-2">
          <DownloadIcon className="w-4 h-4" />
          Gerar Relatório PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Usuário</Label>
              <Select value={filters.userId} onValueChange={(value) => setFilters({ ...filters, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Projeto</Label>
              <Select value={filters.projectId} onValueChange={(value) => setFilters({ ...filters, projectId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.length > filteredTasks.length ? `de ${tasks.length} total` : 'todas as tarefas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTasks.filter(t => t.status === 'concluida').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredTasks.length > 0 
                ? `${Math.round((filteredTasks.filter(t => t.status === 'concluida').length / filteredTasks.length) * 100)}%`
                : '0%'
              } do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTasks.filter(t => t.status === 'em_andamento').length}
            </div>
            <p className="text-xs text-muted-foreground">
              tarefas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByUser.length}</div>
            <p className="text-xs text-muted-foreground">
              com tarefas no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tasksByPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tasksByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by User */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tarefas por Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksByUser}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      {filteredTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Tarefas Filtradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          style={{ 
                            backgroundColor: PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS],
                            color: 'white' 
                          }}
                        >
                          {task.priority}
                        </Badge>
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: STATUS_COLORS[task.status as keyof typeof STATUS_COLORS],
                            color: 'white' 
                          }}
                        >
                          {task.status}
                        </Badge>
                        {task.project && (
                          <Badge variant="outline">{task.project.name}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {task.assignedUser && (
                        <p>{task.assignedUser.firstName} {task.assignedUser.lastName}</p>
                      )}
                      {task.dueDate && (
                        <p>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}