import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar, Clock, User, Building, AlertCircle, CheckCircle, Pause, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails, Project, User as UserType } from "@shared/schema";
import TaskModal from "./TaskModal";

type TaskStatus = "aberta" | "em_andamento" | "concluida" | "cancelada";

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const columns: KanbanColumn[] = [
  {
    id: "aberta",
    title: "Abertas",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200"
  },
  {
    id: "em_andamento",
    title: "Em Andamento",
    icon: <Clock className="w-4 h-4" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200"
  },
  {
    id: "concluida",
    title: "Concluídas",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200"
  },
  {
    id: "cancelada",
    title: "Canceladas",
    icon: <X className="w-4 h-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200"
  }
];

const priorityColors = {
  baixa: "bg-blue-100 text-blue-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-orange-100 text-orange-800",
  critica: "bg-red-100 text-red-800"
};

const priorityLabels = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica"
};

export default function KanbanBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [draggedTask, setDraggedTask] = useState<TaskWithDetails | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks'],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch users
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) => {
      return await apiRequest('PUT', `/api/tasks/${taskId}`, { status });
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/user-stats'] });
      
      toast({
        title: "Tarefa atualizada",
        description: `Status alterado para ${getStatusLabel(updatedTask.status)}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const getStatusLabel = (status: TaskStatus) => {
    const column = columns.find(col => col.id === status);
    return column ? column.title : status;
  };

  const getUserDisplayName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser?.firstName && foundUser?.lastName) {
      return `${foundUser.firstName} ${foundUser.lastName}`;
    }
    return foundUser?.email || 'Usuário';
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Sem projeto';
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: TaskWithDetails) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    // Check if user can edit task
    const canEdit = user?.role === 'admin' || 
                   draggedTask.assignedUserId === user?.id || 
                   draggedTask.createdUserId === user?.id;

    if (!canEdit) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para mover esta tarefa",
        variant: "destructive",
      });
      setDraggedTask(null);
      return;
    }

    updateTaskStatusMutation.mutate({
      taskId: draggedTask.id,
      status: targetStatus
    });

    setDraggedTask(null);
  };

  const handleTaskClick = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleNewTask = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Kanban Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie suas tarefas organizadamente
          </p>
        </div>
        
        <Button 
          onClick={handleNewTask}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div
              key={column.id}
              className={`${column.bgColor} rounded-lg border-2 border-dashed p-4 min-h-[500px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between mb-4 ${column.color}`}>
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className="font-semibold text-sm lg:text-base">
                    {column.title}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {columnTasks.length}
                </Badge>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-move hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {task.title}
                        </CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={`${priorityColors[task.priority]} text-xs ml-2`}
                        >
                          {priorityLabels[task.priority]}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-2">
                      {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Project */}
                      {task.projectId && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Building className="w-3 h-3" />
                          <span className="truncate">{getProjectName(task.projectId)}</span>
                        </div>
                      )}
                      
                      {/* Due Date */}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      )}
                      
                      {/* Hours */}
                      {(task.estimatedHours || task.actualHours) && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {task.actualHours?.toFixed(1) || '0.0'}h
                            {task.estimatedHours && ` / ${task.estimatedHours.toFixed(1)}h`}
                          </span>
                        </div>
                      )}
                      
                      {/* Assigned User */}
                      {task.assignedUserId && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={users.find(u => u.id === task.assignedUserId)?.profileImageUrl} />
                            <AvatarFallback className="text-xs">
                              {getUserDisplayName(task.assignedUserId).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {getUserDisplayName(task.assignedUserId)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        open={showModal}
        onOpenChange={handleModalClose}
        defaultStatus="aberta"
      />
    </div>
  );
}