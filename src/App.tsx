import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Wrench, Users, ClipboardList, FileText, Home, Settings as SettingsIcon, Moon, Sun, Kanban, Calculator, Receipt, DollarSign, Calendar as CalendarIcon, Package, Bell, LayoutDashboard, ListTodo, Hammer, User, ChevronDown } from 'lucide-react';
import { useStore } from './store';

import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ChecklistManager from './pages/ChecklistManager';
import Tickets from './pages/Tickets';
import TicketForm from './pages/TicketForm';
import TicketView from './pages/TicketView';
import Settings from './pages/Settings';
import KanbanBoard from './pages/KanbanBoard';
import Quotes from './pages/Quotes';
import Receipts from './pages/Receipts';
import Financial from './pages/Financial';
import Calendar from './pages/Calendar';
import Products from './pages/Products';
import Login from './pages/Login';

function NavLink({ to, icon: Icon, children, mobile = false, sub = false }: { to: string, icon: any, children: React.ReactNode, mobile?: boolean, sub?: boolean }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  if (mobile) {
    return (
      <Link 
        to={to} 
        className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
          isActive ? 'text-primary' : 'text-zinc-400'
        }`}
      >
        <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{children}</span>
      </Link>
    );
  }

  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-bold ${
        isActive 
          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
          : sub 
            ? 'text-zinc-500 hover:bg-zinc-50 py-3 text-sm'
            : 'text-zinc-500 hover:bg-zinc-100'
      }`}
    >
      <Icon className={sub ? "w-4 h-4" : "w-5 h-5"} /> {children}
    </Link>
  );
}

function NavGroup({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const location = useLocation();
  const hasActiveChild = React.Children.toArray(children).some((child: any) => 
    location.pathname === child.props.to || (child.props.to !== '/' && location.pathname.startsWith(child.props.to))
  );

  return (
    <div className="space-y-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all font-bold ${
          hasActiveChild ? 'text-primary' : 'text-zinc-500 hover:bg-zinc-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" /> {title}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pl-4 space-y-1 border-l-2 border-zinc-50 ml-6">
          {children}
        </div>
      )}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { companyLogo, theme, toggleTheme, isAuthenticated, logout } = useStore();
  const location = useLocation();
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (!isAuthenticated) {
    return <Login />;
  }
  
  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-zinc-100 flex-col shadow-sm z-10 print:hidden">
        <div className="p-8 flex items-center gap-4">
          {companyLogo ? (
            <div className="h-12 w-auto flex items-center">
              <img src={companyLogo} alt="Logo" className="h-full w-auto object-contain max-w-[100px]" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter leading-none">IA COMPANY</span>
            <span className="font-black text-xl tracking-tighter leading-none text-primary">TEC</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
          <NavLink to="/clients" icon={Users}>Clientes</NavLink>
          <NavLink to="/products" icon={Package}>Produtos</NavLink>
          <NavGroup title="Ordens" icon={Hammer}>
            <NavLink to="/tickets" icon={ListTodo} sub>Lista de Ordens</NavLink>
            <NavLink to="/checklist" icon={ClipboardList} sub>Checklists</NavLink>
          </NavGroup>
          <NavLink to="/kanban" icon={Kanban}>Kanban</NavLink>
          <NavLink to="/quotes" icon={Calculator}>Orçamentos</NavLink>
          <NavLink to="/receipts" icon={Receipt}>Recibos</NavLink>
          <NavLink to="/financial" icon={DollarSign}>Financeiro</NavLink>
          <NavLink to="/calendar" icon={CalendarIcon}>Agenda</NavLink>
          <NavLink to="/settings" icon={SettingsIcon}>Ajustes</NavLink>
        </nav>

        <div className="p-6 border-t border-zinc-50 space-y-4">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-zinc-500 hover:bg-zinc-100 w-full"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          
          <button 
            onClick={logout}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-red-500 hover:bg-red-50 w-full"
          >
            <User className="w-5 h-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white px-6 py-4 flex justify-between items-center border-b border-zinc-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {companyLogo ? (
            <div className="h-10 w-auto flex items-center">
              <img src={companyLogo} alt="Logo" className="h-full w-auto object-contain max-w-[80px]" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tighter leading-none">IA COMPANY</span>
            <span className="font-black text-sm tracking-tighter leading-none text-primary">TEC</span>
          </div>
        </div>
        <button className="p-2 text-zinc-400 hover:text-primary transition-colors">
          <Bell className="w-6 h-6" />
        </button>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-4 py-2 flex justify-around items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavLink to="/" icon={LayoutDashboard} mobile>Início</NavLink>
        <NavLink to="/tickets" icon={ListTodo} mobile>Tarefas</NavLink>
        <NavLink to="/products" icon={Hammer} mobile>Ativos</NavLink>
        <NavLink to="/settings" icon={User} mobile>Perfil</NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/products" element={<Products />} />
          <Route path="/checklist" element={<ChecklistManager />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/service-orders" element={<Tickets />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/tickets/new" element={<TicketForm />} />
          <Route path="/tickets/:id/edit" element={<TicketForm />} />
          <Route path="/tickets/:id" element={<TicketView />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
