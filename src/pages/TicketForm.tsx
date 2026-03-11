import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, TicketType } from '../store';
import { ArrowLeft } from 'lucide-react';

export default function TicketForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clients, checklistItems, addTicket, updateTicket, tickets } = useStore();
  
  const [type, setType] = useState<TicketType>('CORRETIVA');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [technician, setTechnician] = useState('');
  const [observations, setObservations] = useState('');
  
  // Corretiva
  const [reportedProblem, setReportedProblem] = useState('');
  const [productsForQuote, setProductsForQuote] = useState('');
  const [serviceReport, setServiceReport] = useState('');
  
  // Preventiva
  const [checklistResults, setChecklistResults] = useState<Record<string, { status: 'OK' | 'NOK' | 'NA', notes: string }>>(
    checklistItems.reduce((acc, item) => ({
      ...acc,
      [item.id]: { status: 'OK', notes: '' }
    }), {})
  );

  useEffect(() => {
    if (id) {
      const ticket = tickets.find(t => t.id === id);
      if (ticket) {
        setType(ticket.type);
        setClientId(ticket.clientId);
        setDate(ticket.date);
        setTechnician(ticket.technician);
        setObservations(ticket.observations);
        
        if (ticket.type === 'CORRETIVA') {
          setReportedProblem(ticket.reportedProblem || '');
          setProductsForQuote(ticket.productsForQuote || '');
          setServiceReport(ticket.serviceReport || '');
        } else if (ticket.type === 'PREVENTIVA' && ticket.checklistResults) {
          const results = ticket.checklistResults.reduce((acc, result) => ({
            ...acc,
            [result.taskId]: { status: result.status, notes: result.notes }
          }), {});
          // Merge with default items in case new items were added
          setChecklistResults(prev => ({ ...prev, ...results }));
        }
      }
    }
  }, [id, tickets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      alert('Selecione um cliente');
      return;
    }

    const ticketData = {
      type,
      clientId,
      date,
      technician,
      observations,
      ...(type === 'CORRETIVA' ? {
        reportedProblem,
        productsForQuote,
        serviceReport
      } : {
        checklistResults: Object.entries(checklistResults).map(([taskId, data]: [string, any]) => ({
          taskId,
          status: data.status,
          notes: data.notes
        }))
      })
    };

    if (id) {
      updateTicket(id, ticketData);
    } else {
      addTicket(ticketData);
    }
    navigate('/tickets');
  };

  // Filter checklist items based on selected client
  const filteredChecklistItems = checklistItems.filter(item => {
    const itemClientIds = item.clientIds || (item.clientId ? [item.clientId] : []);
    return itemClientIds.length === 0 || itemClientIds.includes(clientId);
  });

  const categories = Array.from(new Set(filteredChecklistItems.map(item => item.category)));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 space-y-8">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-2">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Tipo de Ordem de Serviço</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="CORRETIVA">Manutenção Corretiva</option>
                <option value="PREVENTIVA">Manutenção Preventiva</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Cliente / Condomínio</label>
              <select 
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Data</label>
              <input 
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Técnico Responsável</label>
              <input 
                required
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="Nome do técnico"
              />
            </div>
          </div>
        </div>

        {/* Campos Específicos */}
        {type === 'CORRETIVA' ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-2">Detalhes da Corretiva</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Problema Relatado</label>
              <textarea 
                required
                value={reportedProblem}
                onChange={(e) => setReportedProblem(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Produtos para Orçamento</label>
              <textarea 
                value={productsForQuote}
                onChange={(e) => setProductsForQuote(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
                placeholder="Liste os produtos necessários, se houver"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Relato da Ordem de Serviço</label>
              <textarea 
                required
                value={serviceReport}
                onChange={(e) => setServiceReport(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-2">Checklist do Prédio</h2>
            
            {categories.map(category => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded">{category}</h3>
                <div className="space-y-3 pl-2">
                  {filteredChecklistItems.filter(item => item.category === category).map(item => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-4 p-3 border border-gray-100 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <div className="flex-1 font-medium text-sm text-gray-700 dark:text-zinc-300">{item.task}</div>
                      <div className="flex items-center gap-2">
                        <select 
                          value={checklistResults[item.id]?.status || 'OK'}
                          onChange={(e) => setChecklistResults(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], status: e.target.value as any }
                          }))}
                          className={`border rounded-md px-2 py-1 text-sm font-medium outline-none ${
                            checklistResults[item.id]?.status === 'OK' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' :
                            checklistResults[item.id]?.status === 'NOK' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' :
                            'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700'
                          }`}
                        >
                          <option value="OK">OK</option>
                          <option value="NOK">Não OK</option>
                          <option value="NA">N/A</option>
                        </select>
                        <input 
                          type="text"
                          placeholder="Observações..."
                          value={checklistResults[item.id]?.notes || ''}
                          onChange={(e) => setChecklistResults(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], notes: e.target.value }
                          }))}
                          className="border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-md px-3 py-1 text-sm outline-none focus:border-red-500 w-full md:w-48"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Observações Gerais</label>
          <textarea 
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
          />
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Salvar Ordem de Serviço
          </button>
        </div>
      </form>
    </div>
  );
}
