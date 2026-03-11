import React, { useState, useMemo, useRef } from 'react';
import { useStore, Cost } from '../store';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet, FileSpreadsheet, BarChart3, Lightbulb, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Financial() {
  const { receipts, costs, addCost, deleteCost, addReceipt, clients } = useStore();
  
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Material');
  const [clientId, setClientId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalIncome = receipts.reduce((sum, r) => sum + r.value, 0);
  const totalCosts = costs.reduce((sum, c) => sum + c.value, 0);
  const balance = totalIncome - totalCosts;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let importedCosts = 0;
        let importedIncomes = 0;

        results.data.forEach((row: any) => {
          const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('date'));
          const descKey = Object.keys(row).find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('histórico') || k.toLowerCase().includes('historico'));
          const valKey = Object.keys(row).find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('value') || k.toLowerCase().includes('quantia'));
          
          if (!valKey) return;

          const description = descKey ? row[descKey] : 'Importado via CSV';
          let date = new Date().toISOString().split('T')[0];
          
          if (dateKey && row[dateKey]) {
            const dStr = row[dateKey];
            if (dStr.includes('/')) {
              const parts = dStr.split('/');
              if (parts.length === 3) {
                date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            } else {
              date = dStr;
            }
          }

          const valStr = String(row[valKey]).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
          const value = parseFloat(valStr);

          if (isNaN(value) || value === 0) return;

          if (value < 0) {
            addCost({
              description,
              value: Math.abs(value),
              date,
              category: 'Importado'
            });
            importedCosts++;
          } else {
            const genericClientId = clients.length > 0 ? clients[0].id : '';
            if (genericClientId) {
              addReceipt({
                clientId: genericClientId,
                description,
                value,
                date
              });
              importedIncomes++;
            }
          }
        });

        alert(`Importação concluída: ${importedIncomes} receitas e ${importedCosts} despesas importadas.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || value <= 0) {
      alert('Preencha descrição e valor válido.');
      return;
    }

    addCost({
      description,
      value,
      date,
      category
    });

    setDescription('');
    setValue(0);
    setIsAddingCost(false);
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || value <= 0 || !clientId) {
      alert('Preencha cliente, descrição e valor válido.');
      return;
    }

    addReceipt({
      clientId,
      description,
      value,
      date
    });

    setDescription('');
    setValue(0);
    setClientId('');
    setIsAddingIncome(false);
  };

  const transactions = [
    ...receipts.map(r => ({ ...r, type: 'income' as const })),
    ...costs.map(c => ({ ...c, type: 'expense' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthlyData = useMemo(() => {
    const dataByMonth: Record<string, { name: string, receitas: number, despesas: number, saldo: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!dataByMonth[monthYear]) {
        dataByMonth[monthYear] = { name: monthName, receitas: 0, despesas: 0, saldo: 0 };
      }
      
      if (t.type === 'income') {
        dataByMonth[monthYear].receitas += t.value;
      } else {
        dataByMonth[monthYear].despesas += t.value;
      }
      dataByMonth[monthYear].saldo = dataByMonth[monthYear].receitas - dataByMonth[monthYear].despesas;
    });

    return Object.keys(dataByMonth)
      .sort()
      .map(key => dataByMonth[key]);
  }, [transactions]);

  const expensesByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    costs.forEach(c => {
      data[c.category] = (data[c.category] || 0) + c.value;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [costs]);

  const insights = useMemo(() => {
    if (monthlyData.length === 0) return null;

    const bestMonth = [...monthlyData].sort((a, b) => b.saldo - a.saldo)[0];
    const worstMonth = [...monthlyData].sort((a, b) => b.despesas - a.despesas)[0];
    const topCategory = expensesByCategory.length > 0 ? expensesByCategory[0] : null;

    let growth = 0;
    if (monthlyData.length >= 2) {
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      if (previousMonth.receitas > 0) {
        growth = ((currentMonth.receitas - previousMonth.receitas) / previousMonth.receitas) * 100;
      }
    }

    return {
      bestMonth,
      worstMonth,
      topCategory,
      growth
    };
  }, [monthlyData, expensesByCategory]);

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Financeiro</h1>
          <p className="text-zinc-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Controle de fluxo de caixa</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            id="csv-upload-financial"
          />
          <label 
            htmlFor="csv-upload-financial"
            className="bg-white border-2 border-zinc-100 text-zinc-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 cursor-pointer card-shadow"
          >
            <FileSpreadsheet className="w-5 h-5 text-zinc-400" /> IMPORTAR EXTRATO
          </label>
          <button 
            onClick={() => {
              setDescription('');
              setValue(0);
              setClientId('');
              setIsAddingIncome(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-100"
          >
            <Plus className="w-5 h-5" /> RECEITA
          </button>
          <button 
            onClick={() => {
              setDescription('');
              setValue(0);
              setIsAddingCost(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-6 h-6" /> 
            <span>CUSTO</span>
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard 
          title="Receitas" 
          subtitle="TOTAL ACUMULADO"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)} 
          icon={TrendingUp} 
          color="emerald" 
        />
        <StatCard 
          title="Despesas" 
          subtitle="TOTAL DE CUSTOS"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCosts)} 
          icon={TrendingDown} 
          color="red" 
        />
        <StatCard 
          title="Saldo" 
          subtitle="DISPONÍVEL"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)} 
          icon={Wallet} 
          color={balance >= 0 ? "blue" : "orange"} 
        />
      </div>

      {/* Insights Section */}
      {insights && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 card-shadow mb-12">
          <h2 className="text-xl font-black text-zinc-900 mb-8 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </div>
            Insights Financeiros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-zinc-50/50 rounded-3xl border border-zinc-50">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Mês Mais Lucrativo</p>
              <p className="text-lg font-black text-zinc-900">{insights.bestMonth.name}</p>
              <p className="text-sm text-emerald-600 font-black mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.bestMonth.saldo)}
              </p>
            </div>
            <div className="p-6 bg-zinc-50/50 rounded-3xl border border-zinc-50">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Mês com Maior Despesa</p>
              <p className="text-lg font-black text-zinc-900">{insights.worstMonth.name}</p>
              <p className="text-sm text-red-600 font-black mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.worstMonth.despesas)}
              </p>
            </div>
            <div className="p-6 bg-zinc-50/50 rounded-3xl border border-zinc-50">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Maior Categoria</p>
              <p className="text-lg font-black text-zinc-900">{insights.topCategory?.name || 'N/A'}</p>
              <p className="text-sm text-amber-600 font-black mt-1">
                {insights.topCategory ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.topCategory.value) : '-'}
              </p>
            </div>
            <div className="p-6 bg-zinc-50/50 rounded-3xl border border-zinc-50">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Crescimento</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-zinc-900">
                  {Math.abs(insights.growth).toFixed(1)}%
                </p>
                {insights.growth > 0 ? (
                  <span className="flex items-center text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> ALTA
                  </span>
                ) : insights.growth < 0 ? (
                  <span className="flex items-center text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                    <ArrowDownRight className="w-3 h-3 mr-1" /> QUEDA
                  </span>
                ) : (
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">ESTÁVEL</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-zinc-400 mt-1">Receitas vs mês anterior</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 card-shadow">
            <h2 className="text-xl font-black text-zinc-900 mb-8 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-50 rounded-xl">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              Evolução Mensal
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 card-shadow">
            <h2 className="text-xl font-black text-zinc-900 mb-8 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              Acompanhamento de Saldo
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Line type="monotone" dataKey="saldo" name="Saldo Mensal" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 card-shadow overflow-hidden">
        <div className="p-8 border-b border-zinc-50">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Histórico</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] uppercase tracking-[0.15em] font-black">
                <th className="p-6">Data</th>
                <th className="p-6">Descrição</th>
                <th className="p-6">Categoria/Tipo</th>
                <th className="p-6 text-right">Valor</th>
                <th className="p-6 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {transactions.map(t => (
                <tr key={t.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="p-6 text-sm text-zinc-400 font-bold">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-6 text-sm text-zinc-900 font-black">
                    {t.description}
                  </td>
                  <td className="p-6 text-sm">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      t.type === 'income' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {t.type === 'income' ? 'Receita' : (t as Cost).category}
                    </span>
                  </td>
                  <td className={`p-6 text-sm font-black text-right ${
                    t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
                  </td>
                  <td className="p-6 text-center">
                    {t.type === 'expense' && (
                      <button 
                        onClick={() => deleteCost(t.id)}
                        className="p-2 text-zinc-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        title="Excluir Custo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-400 font-black uppercase text-xs tracking-widest">
                    Nenhuma transação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cost Modal */}
      <Modal 
        isOpen={isAddingCost} 
        onClose={() => setIsAddingCost(false)} 
        title="Adicionar Custo"
      >
        <form onSubmit={handleAddCost} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Descrição *</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
              placeholder="Ex: Compra de materiais..."
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Valor (R$) *</label>
            <input 
              type="number" 
              value={value || ''}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Data *</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all appearance-none"
            >
              <option value="Material">Material</option>
              <option value="Combustível">Combustível</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => setIsAddingCost(false)}
              className="px-8 py-4 text-zinc-400 font-black text-xs uppercase tracking-widest hover:text-zinc-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
            >
              Salvar Custo
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Income Modal */}
      <Modal 
        isOpen={isAddingIncome} 
        onClose={() => setIsAddingIncome(false)} 
        title="Adicionar Receita"
      >
        <form onSubmit={handleAddIncome} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Cliente *</label>
            <select 
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all appearance-none"
              required
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Descrição *</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
              placeholder="Ex: Pagamento de serviço avulso..."
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Valor (R$) *</label>
            <input 
              type="number" 
              value={value || ''}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Data *</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => setIsAddingIncome(false)}
              className="px-8 py-4 text-zinc-400 font-black text-xs uppercase tracking-widest hover:text-zinc-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
            >
              Salvar Receita
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
