interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: string;
}

export default function Navigation({ activeSection, onSectionChange, userRole }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'kanban', label: 'Kanban', icon: 'fas fa-columns' },
    { id: 'projects', label: 'Projetos', icon: 'fas fa-building' },
    { id: 'calendar', label: 'Calendário', icon: 'fas fa-calendar' },
    { id: 'files', label: 'Arquivos', icon: 'fas fa-folder' },
    { id: 'chat', label: 'IA Chat', icon: 'fas fa-robot' },
  ];

  // Add admin-only tabs
  if (userRole === 'admin') {
    navItems.push({ id: 'advanced-dashboard', label: 'Dashboard Avançado', icon: 'fas fa-chart-pie' });
    navItems.push({ id: 'users', label: 'Usuários', icon: 'fas fa-users' });
  }

  return (
    <nav className="hidden md:flex items-center space-x-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSectionChange(item.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            activeSection === item.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <i className={item.icon}></i>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
