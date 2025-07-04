import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import TaskModal from "./TaskModal";
import type { TaskWithDetails } from "@shared/schema";

interface TaskCardProps {
  task: TaskWithDetails;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
}

const PRIORITY_COLORS = {
  baixa: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  media: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-300",
  alta: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-300",
  critica: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-300",
};

const PRIORITY_LABELS = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export default function TaskCard({ task, onDragStart }: TaskCardProps) {
  const { user } = useAuth();
  
  const getUserDisplayName = () => {
    if (task.assignedUser?.firstName && task.assignedUser?.lastName) {
      return `${task.assignedUser.firstName} ${task.assignedUser.lastName}`;
    }
    return task.assignedUser?.email || 'Usuário';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = () => {
    if (!task.dueDate || task.status === 'concluida') return false;
    return new Date(task.dueDate) < new Date();
  };

  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const isToday = dueDate.toDateString() === today.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return "Hoje";
    if (isTomorrow) return "Amanhã";
    
    return formatDistanceToNow(dueDate, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const canEditTask = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return task.assignedUserId === user.id || task.createdUserId === user.id;
  };

  const cardContent = (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-white dark:bg-gray-700 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-600 cursor-move hover:shadow-md transition-shadow group"
    >
      {/* Priority and Drag Handle */}
      <div className="flex items-center justify-between mb-2">
        <Badge
          variant="secondary"
          className={`${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]} text-xs px-1.5 py-0.5`}
        >
          {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
        </Badge>
        <i className="fas fa-grip-dots text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 text-sm"></i>
      </div>

      {/* Task Title */}
      <h4 className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Project Badge */}
      {task.project && (
        <div className="mb-3">
          <Badge variant="outline" className="text-xs">
            <i className="fas fa-project-diagram mr-1"></i>
            {task.project.name}
          </Badge>
        </div>
      )}

      {/* Progress Bar (if estimated hours) */}
      {task.estimatedHours && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progresso</span>
            <span>
              {task.actualHours ? Number(task.actualHours).toFixed(1) : '0.0'}h / {Number(task.estimatedHours).toFixed(1)}h
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: task.actualHours && task.estimatedHours
                  ? `${Math.min((Number(task.actualHours) / Number(task.estimatedHours)) * 100, 100)}%`
                  : '0%'
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Files Indicator */}
      {task.files && task.files.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-paperclip mr-1"></i>
            {task.files.length} arquivo{task.files.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assigned User Avatar */}
        {task.assignedUser && (
          <Avatar className="w-6 h-6">
            <AvatarImage 
              src={
                task.assignedUser.profileImageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=2563eb&color=fff`
              }
              alt={getUserDisplayName()}
            />
            <AvatarFallback className="text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <span 
            className={`text-xs ${
              isOverdue() 
                ? 'text-red-600 dark:text-red-400 font-medium' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <i className={`fas fa-calendar-alt mr-1 ${isOverdue() ? 'text-red-500' : ''}`}></i>
            {getDueDateDisplay()}
          </span>
        )}
      </div>

      {/* Overdue Warning */}
      {isOverdue() && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Tarefa em atraso
          </p>
        </div>
      )}
    </div>
  );

  if (canEditTask()) {
    return (
      <TaskModal task={task} trigger={cardContent} />
    );
  }

  return cardContent;
}
