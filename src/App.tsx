import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Wrench, Users, ClipboardList, FileText, Home, Settings as SettingsIcon, Moon, Sun, Kanban, Calculator, Receipt, DollarSign, Calendar as CalendarIcon, Package, Bell, LayoutDashboard, ListTodo, Hammer, User } from 'lucide-react';
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

function NavLink({ to, icon: Icon, children, mobile = false }: { to: string, icon: any, children: React.ReactNode, mobile?: boolean }) {
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
          : 'text-zinc-500 hover:bg-zinc-100'
      }`}
    >
      <Icon className="w-5 h-5" /> {children}
    </Link>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { companyLogo, theme, toggleTheme } = useStore();
  const location = useLocation();
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-zinc-100 flex-col shadow-sm z-10 print:hidden">
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter leading-none">MAINTENANCE</span>
            <span className="font-black text-xl tracking-tighter leading-none text-primary">PRO</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
          <NavLink to="/clients" icon={Users}>Clientes</NavLink>
          <NavLink to="/products" icon={Package}>Produtos</NavLink>
          <NavLink to="/checklist" icon={ClipboardList}>Checklists</NavLink>
          <NavLink to="/tickets" icon={Hammer}>Ordens</NavLink>
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
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white px-6 py-4 flex justify-between items-center border-b border-zinc-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tighter leading-none">MAINTENANCE</span>
            <span className="font-black text-sm tracking-tighter leading-none text-primary">PRO</span>
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
