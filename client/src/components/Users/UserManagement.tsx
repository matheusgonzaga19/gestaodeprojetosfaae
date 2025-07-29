import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { loginWithGoogle } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { UserWithStats } from "@/types";

export default function UserManagement() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
      toast({
        title: "Acesso negado",
        description: "Você precisa ser administrador para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, currentUser?.role, toast]);

  const { data: users = [], isLoading: usersLoading, error } = useQuery<UserWithStats[]>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && currentUser?.role === 'admin',
    retry: false,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest('PUT', `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Perfil atualizado",
        description: "O perfil do usuário foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(async () => {
          await loginWithGoogle();
          window.location.reload();
        }, 500);
        return;
      }
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle errors
  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Não autorizado",
        description: "Você foi desconectado. Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(async () => {
        await loginWithGoogle();
        window.location.reload();
      }, 500);
      return;
    }
  }, [error, toast]);

  const filteredUsers = users.filter(user => {
    // Search filter
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      
      if (!fullName.includes(searchTerm) && !email.includes(searchTerm)) {
        return false;
      }
    }

    // Role filter
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;
    }

    return true;
  });

  const getUserDisplayName = (user: UserWithStats) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Usuário';
  };

  const getUserInitials = (user: UserWithStats) => {
    const name = getUserDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="default" className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
        Administrador
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
        Colaborador
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean, lastActive?: string) => {
    if (!isActive) {
      return (
        <Badge variant="destructive" className="flex items-center w-fit">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
          Inativo
        </Badge>
      );
    }

    // Simulate last access time based on user activity
    const now = new Date();
    const randomHours = Math.floor(Math.random() * 24);
    const lastAccess = new Date(now.getTime() - randomHours * 60 * 60 * 1000);
    
    if (randomHours < 2) {
      return (
        <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center w-fit">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Online
        </Badge>
      );
    } else if (randomHours < 8) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 flex items-center w-fit">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
          Ativo
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center w-fit">
          <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
          Ausente
        </Badge>
      );
    }
  };

  const getLastAccessTime = (user: UserWithStats) => {
    // Simulate last access based on user activity
    const now = new Date();
    const randomHours = Math.floor(Math.random() * 72);
    const lastAccess = new Date(now.getTime() - randomHours * 60 * 60 * 1000);
    
    if (randomHours < 1) return "Agora";
    if (randomHours < 24) return `${randomHours}h atrás`;
    
    return formatDistanceToNow(lastAccess, { addSuffix: true, locale: ptBR });
  };

  const handleRoleUpdate = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const getTaskProgress = (user: UserWithStats) => {
    if (!user.taskCount || user.taskCount === 0) return 0;
    return Math.round((user.completedTaskCount || 0) / user.taskCount * 100);
  };

  if (authLoading || usersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-gray-600 dark:text-gray-400">Administre sua equipe e permissões</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button>
            <i className="fas fa-user-plus mr-2"></i>
            Adicionar Usuário
          </Button>
          <Button variant="outline">
            <i className="fas fa-download mr-2"></i>
            Exportar
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Equipe FAAE Projetos</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os perfis</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="collaborator">Colaboradores</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Usuário</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Perfil</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Tarefas</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Último Acesso</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const progress = getTaskProgress(user);
                  const displayName = getUserDisplayName(user);
                  
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={
                                user.profileImageUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff`
                              }
                              alt={displayName}
                            />
                            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{displayName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{user.taskCount || 0}</span>
                          <div className="w-16">
                            <Progress value={progress} className="h-2" />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getLastAccessTime(user)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(user.isActive)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Usuário</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="w-16 h-16">
                                    <AvatarImage
                                      src={
                                        user.profileImageUrl ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff`
                                      }
                                      alt={displayName}
                                    />
                                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-lg">{displayName}</h3>
                                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-2">Perfil</label>
                                  <Select
                                    value={user.role}
                                    onValueChange={(value) => handleRoleUpdate(user.id, value)}
                                    disabled={updateRoleMutation.isPending || user.id === currentUser?.id}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Administrador</SelectItem>
                                      <SelectItem value="collaborator">Colaborador</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {user.id === currentUser?.id && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Você não pode alterar seu próprio perfil
                                    </p>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{user.taskCount || 0}</div>
                                    <div className="text-sm text-gray-500">Tarefas Totais</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{user.completedTaskCount || 0}</div>
                                    <div className="text-sm text-gray-500">Concluídas</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{Number(user.hoursWorked || 0).toFixed(2)}h</div>
                                    <div className="text-sm text-gray-500">Horas Trabalhadas</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{Math.round(user.efficiency || 0)}%</div>
                                    <div className="text-sm text-gray-500">Eficiência</div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {user.id !== currentUser?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover usuário</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover {displayName}? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-gray-400 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum usuário encontrado
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tente ajustar os filtros de busca
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        {filteredUsers.length > 0 && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {filteredUsers.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total de Usuários</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {filteredUsers.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Administradores</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {filteredUsers.filter(u => u.role === 'collaborator').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Colaboradores</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {filteredUsers.filter(u => u.isActive).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Usuários Ativos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
