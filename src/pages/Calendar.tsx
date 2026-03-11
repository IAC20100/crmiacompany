import React, { useState } from 'react';
import { useStore, Appointment } from '../store';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, Calendar as CalendarIcon, Clock, AlignLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Calendar() {
  const { appointments, tickets, clients, addAppointment, deleteAppointment } = useStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] + 'T09:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0] + 'T10:00');
  const [type, setType] = useState<'MEETING' | 'OTHER'>('MEETING');
  const [notes, setNotes] = useState('');

  // Map tickets to calendar events
  const ticketEvents = tickets.map(t => {
    const client = clients.find(c => c.id === t.clientId);
    return {
      id: `ticket-${t.id}`,
      title: `OS: ${client?.name || 'Desconhecido'}`,
      start: new Date(t.date + 'T08:00:00'),
      end: new Date(t.date + 'T18:00:00'),
      allDay: true,
      resource: { type: 'TICKET', originalId: t.id }
    };
  });

  // Map appointments to calendar events
  const appointmentEvents = appointments.map(a => ({
    id: a.id,
    title: a.title,
    start: new Date(a.start),
    end: new Date(a.end),
    allDay: false,
    resource: { type: a.type, notes: a.notes }
  }));

  const allEvents = [...ticketEvents, ...appointmentEvents];

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    setStartDate(format(start, "yyyy-MM-dd'T'HH:mm"));
    setEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
    setIsAdding(true);
    setSelectedEvent(null);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    addAppointment({
      title,
      start: new Date(startDate).toISOString(),
      end: new Date(endDate).toISOString(),
      type,
      notes
    });

    setIsAdding(false);
    setTitle('');
    setNotes('');
  };

  const handleDelete = () => {
    if (selectedEvent && selectedEvent.resource.type !== 'TICKET') {
      deleteAppointment(selectedEvent.id);
      setSelectedEvent(null);
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6'; // blue for meetings
    
    if (event.resource.type === 'TICKET') {
      backgroundColor = '#ef4444'; // red for tickets
    } else if (event.resource.type === 'OTHER') {
      backgroundColor = '#8b5cf6'; // purple for other
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="p-6 md:p-12 h-[calc(100vh-2rem)] flex flex-col max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Agenda</h1>
          <p className="text-zinc-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Compromissos e Ordens de Serviço</p>
        </div>
        <button 
          onClick={() => {
            setStartDate(new Date().toISOString().split('T')[0] + 'T09:00');
            setEndDate(new Date().toISOString().split('T')[0] + 'T10:00');
            setIsAdding(true);
            setSelectedEvent(null);
          }}
          className="btn-primary"
        >
          <Plus className="w-6 h-6" /> 
          <span>NOVO COMPROMISSO</span>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-zinc-100 card-shadow p-6 overflow-hidden">
        <style>{`
          .rbc-calendar { font-family: inherit; border: none; }
          .rbc-month-view, .rbc-time-view, .rbc-header { border-color: #f4f4f5 !important; }
          .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row { border-color: #f4f4f5 !important; }
          .rbc-time-content > * + * > * { border-color: #f4f4f5 !important; }
          .rbc-timeslot-group { border-color: #f4f4f5 !important; min-height: 60px; }
          .rbc-day-slot .rbc-time-slot { border-color: #f4f4f5 !important; }
          .rbc-off-range-bg { background-color: #fafafa !important; }
          .rbc-today { background-color: rgba(225, 29, 72, 0.03) !important; }
          .rbc-header { 
            padding: 12px !important; 
            font-size: 10px !important; 
            font-weight: 900 !important; 
            text-transform: uppercase !important; 
            letter-spacing: 0.1em !important; 
            color: #a1a1aa !important;
            border-bottom: 2px solid #f4f4f5 !important;
          }
          .rbc-button-link { font-weight: 700 !important; color: #18181b !important; }
          .rbc-toolbar { margin-bottom: 24px !important; }
          .rbc-toolbar button { 
            border: 2px solid #f4f4f5 !important; 
            border-radius: 12px !important; 
            padding: 8px 16px !important; 
            font-weight: 900 !important; 
            font-size: 10px !important; 
            text-transform: uppercase !important; 
            letter-spacing: 0.05em !important;
            color: #71717a !important;
            transition: all 0.2s !important;
          }
          .rbc-toolbar button:hover { background-color: #f4f4f5 !important; color: #18181b !important; }
          .rbc-toolbar button.rbc-active { background-color: #18181b !important; border-color: #18181b !important; color: white !important; }
          .rbc-event { border-radius: 8px !important; padding: 4px 8px !important; font-size: 11px !important; font-weight: 700 !important; }
          .rbc-show-more { font-weight: 900 !important; font-size: 10px !important; color: #e11d48 !important; }
        `}</style>
        <BigCalendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture="pt-BR"
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período."
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      {/* Add Appointment Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-zinc-100">
            <div className="flex justify-between items-center p-8 border-b border-zinc-50">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Novo Compromisso</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-zinc-50 rounded-full transition-colors">
                <Plus className="w-6 h-6 text-zinc-400 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Título *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
                  placeholder="Ex: Reunião com fornecedor"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Início *</label>
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Fim *</label>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Tipo</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all appearance-none"
                >
                  <option value="MEETING">Reunião</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Observações</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all min-h-[100px] resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-4 text-zinc-400 font-black text-xs uppercase tracking-widest hover:text-zinc-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-zinc-100">
            <div className="flex justify-between items-center p-8 border-b border-zinc-50">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Detalhes</h2>
              <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-zinc-50 rounded-full transition-colors">
                <Plus className="w-6 h-6 text-zinc-400 rotate-45" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl ${
                  selectedEvent.resource.type === 'TICKET' ? 'bg-red-50 text-red-600' :
                  selectedEvent.resource.type === 'MEETING' ? 'bg-blue-50 text-blue-600' :
                  'bg-purple-50 text-purple-600'
                }`}>
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-zinc-900 leading-tight">{selectedEvent.title}</h3>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                    {selectedEvent.resource.type === 'TICKET' ? 'Ordem de Serviço' : 
                     selectedEvent.resource.type === 'MEETING' ? 'Reunião' : 'Outro'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-zinc-600 bg-zinc-50 p-4 rounded-2xl">
                <Clock className="w-5 h-5 text-zinc-400" />
                <div className="text-sm font-bold">
                  {selectedEvent.allDay ? 'Dia Inteiro' : (
                    <>
                      {format(selectedEvent.start, "dd/MM/yyyy 'às' HH:mm")} <br/>
                      <span className="text-zinc-400">até</span> {format(selectedEvent.end, "dd/MM/yyyy 'às' HH:mm")}
                    </>
                  )}
                </div>
              </div>

              {selectedEvent.resource.notes && (
                <div className="flex items-start gap-4 text-zinc-600 p-4">
                  <AlignLeft className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium leading-relaxed">{selectedEvent.resource.notes}</p>
                </div>
              )}

              <div className="pt-6 flex justify-end gap-4">
                {selectedEvent.resource.type !== 'TICKET' && (
                  <button 
                    onClick={handleDelete}
                    className="px-6 py-3 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Excluir
                  </button>
                )}
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="bg-zinc-100 text-zinc-900 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
