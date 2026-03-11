import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function ChecklistManager() {
  const { checklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem, clients } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    task: string;
    category: string;
    clientIds: string[];
  }>({
    task: '',
    category: '',
    clientIds: []
  });

  const categories = Array.from(new Set(checklistItems.map(item => item.category))).filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      task: formData.task,
      category: formData.category,
      clientIds: formData.clientIds
    };
    
    if (editingId) {
      updateChecklistItem(editingId, dataToSave);
    } else {
      addChecklistItem(dataToSave);
    }
    closeModal();
  };

  const openModal = (item?: typeof checklistItems[0]) => {
    if (item) {
      // Handle legacy clientId as well
      const initialClientIds = item.clientIds || (item.clientId ? [item.clientId] : []);
      setFormData({ task: item.task, category: item.category, clientIds: initialClientIds });
      setEditingId(item.id);
    } else {
      setFormData({ task: '', category: categories[0] || '', clientIds: [] });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ task: '', category: '', clientIds: [] });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciador de Checklist</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">Configure os itens padrão para manutenções preventivas</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400 text-sm">
                <th className="p-4 font-medium">Tarefa</th>
                <th className="p-4 font-medium">Categoria</th>
                <th className="p-4 font-medium">Atribuído a</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {checklistItems.map(item => {
                const itemClientIds = item.clientIds || (item.clientId ? [item.clientId] : []);
                const assignedClients = clients.filter(c => itemClientIds.includes(c.id));
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-zinc-300">{item.task}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-zinc-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-md text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-zinc-400">
                      {assignedClients.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedClients.map(client => (
                            <span key={client.id} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-md text-xs font-medium">
                              {client.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 rounded-md text-xs font-medium">
                          Todos (Global)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(item)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {checklistItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-zinc-500">
                    Nenhuma tarefa configurada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Descrição da Tarefa</label>
                <input 
                  required
                  type="text" 
                  value={formData.task}
                  onChange={e => setFormData({...formData, task: e.target.value})}
                  className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Ex: Verificar iluminação de emergência"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Categoria</label>
                <input 
                  required
                  type="text" 
                  list="categories"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Ex: Elétrica, Hidráulica, Segurança..."
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Atribuir a Condomínios/Clientes (Opcional)</label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-zinc-700 rounded-lg p-3 space-y-2 bg-white dark:bg-zinc-800">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-zinc-700/50 rounded cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.clientIds.length === 0}
                      onChange={() => setFormData({...formData, clientIds: []})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">Todos (Checklist Global)</span>
                  </label>
                  
                  {clients.map(client => (
                    <label key={client.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-zinc-700/50 rounded cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.clientIds.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, clientIds: [...formData.clientIds, client.id]});
                          } else {
                            setFormData({...formData, clientIds: formData.clientIds.filter(id => id !== client.id)});
                          }
                        }}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-zinc-300">{client.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                  Selecione um ou mais clientes. Se nenhum for selecionado, a tarefa aparecerá para todos.
                </p>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-600 dark:text-zinc-400 mb-6">Tem certeza que deseja excluir esta tarefa?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  deleteChecklistItem(itemToDelete);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
