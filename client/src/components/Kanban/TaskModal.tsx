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
  DialogDescription,
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
import { Trash2, Save, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TaskWithDetails, User, Project } from "@shared/schema";

interface TaskModalProps {
  task?: TaskWithDetails | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultStatus?: string;
  defaultProjectId?: number;
}

export default function TaskModal({ 
  task, 
  open = false, 
  onOpenChange, 
  defaultStatus = "aberta",
  defaultProjectId 
}: TaskModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"baixa" | "media" | "alta" | "critica">("media");
  const [status, setStatus] = useState<"aberta" | "em_andamento" | "concluida" | "cancelada">("aberta");
  const [projectId, setProjectId] = useState<string>("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [actualHours, setActualHours] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Data queries
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: false,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("📤 Criando tarefa:", data);
      return await apiRequest('POST', '/api/tasks', data);
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/user-stats'] });
      
      toast({
        title: "Tarefa criada com sucesso",
        description: `A tarefa "${newTask.title}" foi criada na coluna Abertas.`,
      });
      
      handleClose();
    },
    onError: (error: any) => {
      console.error("❌ Erro ao criar tarefa:", error);
      toast({
        title: "Erro ao criar tarefa",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("📤 Atualizando tarefa:", data);
      return await apiRequest('PUT', `/api/tasks/${task?.id}`, data);
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/user-stats'] });
      
      toast({
        title: "Tarefa atualizada",
        description: `A tarefa "${updatedTask.title}" foi atualizada.`,
      });
      
      handleClose();
    },
    onError: (error: any) => {
      console.error("❌ Erro ao atualizar tarefa:", error);
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
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
      
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir tarefa",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("media");
    setStatus(defaultStatus as any);
    setProjectId(defaultProjectId ? defaultProjectId.toString() : "");
    setAssignedUserId("");
    setDueDate("");
    setEstimatedHours("");
    setActualHours("");
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onOpenChange?.(false);
  };

  // Load task data when editing
  useEffect(() => {
    if (task && open) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "media");
      setStatus(task.status || "aberta");
      setProjectId(task.projectId?.toString() || "");
      setAssignedUserId(task.assignedUserId || "");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
      setEstimatedHours(task.estimatedHours?.toString() || "");
      setActualHours(task.actualHours?.toString() || "");
    } else if (!task && open) {
      resetForm();
    }
  }, [task, open, defaultStatus, defaultProjectId]);

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
      assignedUserId: assignedUserId && assignedUserId !== "" ? assignedUserId : null,
      estimatedHours: estimatedHours && estimatedHours !== "" ? parseFloat(estimatedHours) : null,
      actualHours: actualHours && actualHours !== "" ? parseFloat(actualHours) : null,
      dueDate: dueDate && dueDate !== "" ? dueDate : null,
    };

    console.log("📝 Dados da tarefa:", taskData);

    if (task) {
      updateTaskMutation.mutate(taskData);
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteTaskMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const canEditTask = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return task?.assignedUserId === user.id || task?.createdUserId === user.id;
  };

  const getUserDisplayName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser?.firstName && foundUser?.lastName) {
      return `${foundUser.firstName} ${foundUser.lastName}`;
    }
    return foundUser?.email || 'Usuário';
  };

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {task ? "Editar Tarefa" : "Nova Tarefa"}
            {task && canEditTask() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {task ? "Edite os detalhes da tarefa abaixo." : "Preencha as informações para criar uma nova tarefa."}
          </DialogDescription>
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
            <Select value={priority} onValueChange={setPriority}>
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
            <Select value={status} onValueChange={setStatus}>
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
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned User */}
          <div className="space-y-2">
            <Label htmlFor="assignedUser">Responsável</Label>
            <Select value={assignedUserId} onValueChange={setAssignedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
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

          {/* Actual Hours */}
          <div className="space-y-2">
            <Label htmlFor="actualHours">Horas Trabalhadas</Label>
            <Input
              id="actualHours"
              type="number"
              step="0.5"
              min="0"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              placeholder="0.0"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading
                ? "Salvando..."
                : task
                ? "Atualizar"
                : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir Tarefa"
        description={`Tem certeza que deseja excluir a tarefa "${task?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </Dialog>
  );
}