import React, { useState } from 'react';
import { useStore, TicketStatus, Ticket } from '../store';
import { Link } from 'react-router-dom';
import { Clock, Wrench, CheckCircle, AlertCircle, Calendar, User, Edit } from 'lucide-react';

const COLUMNS: { id: TicketStatus; title: string; icon: any; color: string; textColor: string }[] = [
  { id: 'APROVADO', title: 'Aprovado', icon: CheckCircle, color: 'bg-blue-50/50 border-blue-100', textColor: 'text-blue-600' },
  { id: 'AGUARDANDO_MATERIAL', title: 'Aguardando Material', icon: AlertCircle, color: 'bg-amber-50/50 border-amber-100', textColor: 'text-amber-600' },
  { id: 'REALIZANDO', title: 'Realizando', icon: Wrench, color: 'bg-purple-50/50 border-purple-100', textColor: 'text-purple-600' },
  { id: 'CONCLUIDO', title: 'Concluído', icon: CheckCircle, color: 'bg-emerald-50/50 border-emerald-100', textColor: 'text-emerald-600' },
];

export default function KanbanBoard() {
  const { tickets, clients, updateTicket } = useStore();
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticketId);
    
    setTimeout(() => {
      const el = document.getElementById(`ticket-${ticketId}`);
      if (el) el.classList.add('opacity-50', 'scale-95');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, ticketId: string) => {
    setDraggedTicketId(null);
    const el = document.getElementById(`ticket-${ticketId}`);
    if (el) el.classList.remove('opacity-50', 'scale-95');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    if (!draggedTicketId) return;

    const ticket = tickets.find(t => t.id === draggedTicketId);
    if (ticket && (ticket.status || 'APROVADO') !== status) {
      updateTicket(ticket.id, { ...ticket, status });
    }
    setDraggedTicketId(null);
  };

  return (
    <div className="p-6 md:p-12 h-[calc(100vh-2rem)] flex flex-col max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-12 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Kanban de Ordens</h1>
          <p className="text-zinc-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Arraste os cards para atualizar o status</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-8 snap-x">
        {COLUMNS.map(column => {
          const columnTickets = tickets.filter(t => (t.status || 'APROVADO') === column.id);
          const Icon = column.icon;

          return (
            <div 
              key={column.id}
              className="flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-zinc-50/50 rounded-[2rem] border border-zinc-100 overflow-hidden snap-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`p-6 border-b flex items-center justify-between bg-white ${column.textColor}`}>
                <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest">
                  <Icon className="w-5 h-5" />
                  {column.title}
                </div>
                <span className="bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full text-[10px] font-black">
                  {columnTickets.length}
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {columnTickets.map(ticket => {
                  const client = clients.find(c => c.id === ticket.clientId);
                  return (
                    <div
                      key={ticket.id}
                      id={`ticket-${ticket.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ticket.id)}
                      onDragEnd={(e) => handleDragEnd(e, ticket.id)}
                      className="bg-white p-5 rounded-2xl border border-zinc-100 card-shadow cursor-grab active:cursor-grabbing hover:border-primary/20 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          ticket.type === 'PREVENTIVA' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-orange-50 text-orange-600'
                        }`}>
                          {ticket.type}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            to={`/tickets/${ticket.id}/edit`}
                            className="p-1.5 text-zinc-300 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                      
                      <h3 className="font-black text-zinc-900 mb-1 line-clamp-2 leading-tight">
                        {client?.name || 'Cliente Desconhecido'}
                      </h3>
                      
                      <div className="space-y-2 mt-4 pt-4 border-t border-zinc-50">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(ticket.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                          <User className="w-3.5 h-3.5" />
                          {ticket.technician}
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Link 
                          to={`/tickets/${ticket.id}`}
                          className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  );
                })}
                
                {columnTickets.length === 0 && (
                  <div className="h-32 flex items-center justify-center text-zinc-300 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-zinc-100 rounded-2xl p-8 text-center">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
