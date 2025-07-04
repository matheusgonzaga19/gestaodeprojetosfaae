import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Plus, Edit, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails, User, Project } from "@shared/schema";

interface TaskModalProps {
  task?: TaskWithDetails;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultStatus?: string;
}

export default function TaskModal({ task, trigger, open, onOpenChange, defaultStatus }: TaskModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"baixa" | "media" | "alta" | "critica">("media");
  const [status, setStatus] = useState<"aberta" | "em_andamento" | "concluida" | "cancelada">("aberta");
  const [projectId, setProjectId] = useState<string>("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("");

  // Data queries
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("📤 Enviando dados da tarefa:", data);
      const result = await apiRequest('POST', '/api/tasks', data);
      console.log("✅ Tarefa criada com sucesso:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/user-stats'] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso.",
      });
      handleOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Erro ao criar tarefa:", error);
      toast({
        title: "Erro ao criar tarefa",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/tasks/${task?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/user-stats'] });
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso.",
      });
      handleOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/tasks/${task?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/user-stats'] });
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso.",
      });
      handleOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir tarefa",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Handle modal open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
    if (!open) {
      resetForm();
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("media");
    setStatus(defaultStatus as any || "aberta");
    setProjectId("");
    setAssignedUserId("");
    setDueDate("");
    setEstimatedHours("");
  };

  // Sync external open prop with internal state
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  // Load task data when editing
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "media");
      setStatus(task.status || "aberta");
      setProjectId(task.projectId?.toString() || "");
      setAssignedUserId(task.assignedUserId || "");
      setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : "");
      setEstimatedHours(task.estimatedHours?.toString() || "");
    } else if (!task && isOpen) {
      resetForm();
    }
  }, [task, isOpen, defaultStatus]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Erro de validação",
        description: "O título da tarefa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Prepare task data
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      projectId: projectId && projectId !== "" ? parseInt(projectId) : null,
      assignedUserId: assignedUserId && assignedUserId !== "" ? assignedUserId : user?.id || null,
      estimatedHours: estimatedHours && estimatedHours !== "" ? parseFloat(estimatedHours) : null,
      dueDate: dueDate && dueDate !== "" ? dueDate : null,
    };

    if (task) {
      updateTaskMutation.mutate(taskData);
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      deleteTaskMutation.mutate();
    }
  };

  const canEditTask = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return task?.assignedUserId === user.id || task?.createdUserId === user.id;
  };

  const getUserDisplayName = (userId: string) => {
    const foundUser = users.find((u: any) => u.id === userId);
    if (foundUser?.firstName && foundUser?.lastName) {
      return `${foundUser.firstName} ${foundUser.lastName}`;
    }
    return foundUser?.email || 'Usuário';
  };

  const triggerButton = trigger || (
    <Button 
      size="sm" 
      className="bg-blue-600 hover:bg-blue-700"
    >
      <Plus className="w-4 h-4 mr-2" />
      Adicionar Tarefa
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {task ? "Editar Tarefa" : "Nova Tarefa"}
            {task && canEditTask() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da tarefa"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite a descrição da tarefa"
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="project">Projeto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum projeto</SelectItem>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned User */}
          <div className="space-y-2">
            <Label htmlFor="assigned">Atribuído para</Label>
            <Select value={assignedUserId} onValueChange={setAssignedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não atribuído</SelectItem>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserDisplayName(user.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de Vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Horas Estimadas</Label>
            <Input
              id="estimatedHours"
              type="number"
              step="0.5"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="0.0"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createTaskMutation.isPending || updateTaskMutation.isPending
                ? "Salvando..."
                : task
                ? "Atualizar"
                : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}