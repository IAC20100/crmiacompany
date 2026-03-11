import React, { useState, useRef, useMemo } from 'react';
import { useStore, QuoteItem, Quote } from '../store';
import { Upload, Plus, Trash2, Save, FileSpreadsheet, CheckCircle, Clock, XCircle, FileText, Download, Eye, ArrowLeft, Send, Printer, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';

export default function Quotes() {
  const { clients, quotes, products, addQuote, updateQuote, deleteQuote, addReceipt, companyLogo, companyData } = useStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteToPrint, setQuoteToPrint] = useState<Quote | null>(null);

  const approvedQuotes = quotes.filter(q => q.status === 'APPROVED');
  const pendingQuotes = quotes.filter(q => q.status === 'DRAFT' || q.status === 'SENT');
  const rejectedQuotes = quotes.filter(q => q.status === 'REJECTED');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedItems: QuoteItem[] = results.data.map((row: any) => {
          // Try to guess columns
          const descKey = Object.keys(row).find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('prod') || k.toLowerCase().includes('nome'));
          const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes('qtd') || k.toLowerCase().includes('quant'));
          const priceKey = Object.keys(row).find(k => k.toLowerCase().includes('preco') || k.toLowerCase().includes('preço') || k.toLowerCase().includes('valor') || k.toLowerCase().includes('unit'));

          const description = descKey ? row[descKey] : Object.values(row)[0] as string;
          const quantity = qtyKey ? parseFloat(row[qtyKey]) : 1;
          
          let unitPrice = 0;
          if (priceKey) {
            const priceStr = String(row[priceKey]).replace(/[R$\s]/g, '').replace(',', '.');
            unitPrice = parseFloat(priceStr);
          }

          return {
            id: uuidv4(),
            description: description || 'Produto sem nome',
            quantity: isNaN(quantity) ? 1 : quantity,
            unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
            total: (isNaN(quantity) ? 1 : quantity) * (isNaN(unitPrice) ? 0 : unitPrice)
          };
        });

        setItems(prev => [...prev, ...parsedItems]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    setItems([...items, { id: uuidv4(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const totalValue = items.reduce((sum, item) => sum + item.total, 0);

  const handleSave = () => {
    if (!clientId) {
      alert('Selecione um cliente');
      return;
    }
    if (items.length === 0) {
      alert('Adicione pelo menos um item');
      return;
    }

    addQuote({
      clientId,
      date: new Date().toISOString(),
      items,
      totalValue,
      status: 'DRAFT'
    });

    alert('Orçamento salvo com sucesso!');
    setClientId('');
    setItems([]);
    setIsCreating(false);
  };

  const handleStatusChange = (quote: Quote, newStatus: Quote['status']) => {
    updateQuote(quote.id, { ...quote, status: newStatus });
    
    // If approved, automatically create a receipt
    if (newStatus === 'APPROVED' && quote.status !== 'APPROVED') {
      addReceipt({
        clientId: quote.clientId,
        date: new Date().toISOString().split('T')[0],
        value: quote.totalValue,
        description: `Referente ao orçamento aprovado #${quote.id.substring(0, 8)}`
      });
      alert('Orçamento aprovado! Uma receita foi gerada automaticamente na aba Financeiro.');
    }
  };

  const handleDownloadPdf = async (quote: Quote) => {
    setQuoteToPrint(quote);
    setIsGenerating(true);
    
    // Wait for state to update and DOM to render
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) {
        setIsGenerating(false);
        setQuoteToPrint(null);
        alert('Erro: Template do PDF não encontrado.');
        return;
      }

      try {
        const imgData = await toJpeg(element, {
          quality: 0.95,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;
        const pdfHeight = (elementHeight * pdfWidth) / elementWidth;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        const client = clients.find(c => c.id === quote.clientId);
        const safeName = client?.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') || 'Cliente';
        const dateStr = new Date(quote.date).toLocaleDateString('pt-BR').replace(/\//g, '-');
        const fileName = `Orcamento_${safeName}_${dateStr}.pdf`;
        
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert(`Ocorreu um erro ao gerar o PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
        setIsGenerating(false);
        setQuoteToPrint(null);
      }
    }, 1500); // Increased timeout to ensure rendering
  };

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {!isCreating ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 md:p-12 max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tighter text-center md:text-left">Orçamentos</h1>
                <p className="text-zinc-500 font-bold mt-1 uppercase text-[10px] tracking-widest text-center md:text-left">Propostas comerciais e faturamento</p>
              </div>
              <button 
                onClick={() => setIsCreating(true)}
                className="btn-primary group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" /> 
                <span>NOVO ORÇAMENTO</span>
              </button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <StatCard 
                title="Total de Orçamentos" 
                value={quotes.length} 
                icon={FileText} 
                color="blue" 
                subtitle="HISTÓRICO"
              />
              <StatCard 
                title="Aprovados" 
                value={approvedQuotes.length} 
                icon={CheckCircle} 
                color="emerald" 
                subtitle="CONCLUÍDOS"
              />
              <StatCard 
                title="Aguardando Aprovação" 
                value={pendingQuotes.length} 
                icon={Clock} 
                color="orange" 
                subtitle="PENDENTES"
              />
            </div>

            {/* Quotes List */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 card-shadow overflow-hidden">
              <div className="p-8 border-b border-zinc-50 bg-zinc-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Histórico Recente</h2>
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-zinc-100 rounded-full shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Monitoramento Ativo</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] uppercase tracking-[0.15em] font-black">
                      <th className="p-6">Data de Emissão</th>
                      <th className="p-6">Cliente / Identificação</th>
                      <th className="p-6">Valor da Proposta</th>
                      <th className="p-6">Status Atual</th>
                      <th className="p-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {quotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(quote => {
                      const client = clients.find(c => c.id === quote.clientId);
                      return (
                        <tr key={quote.id} className="group hover:bg-zinc-50/50 transition-colors">
                          <td className="p-6 text-sm text-zinc-400 font-mono font-bold">
                            {new Date(quote.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-zinc-900 group-hover:text-red-600 transition-colors">
                                {client?.name || 'Cliente Desconhecido'}
                              </span>
                              <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">
                                ID: {quote.id.substring(0, 8)}
                              </span>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="text-sm font-black text-zinc-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue)}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="relative inline-block">
                              <select 
                                value={quote.status}
                                onChange={(e) => handleStatusChange(quote, e.target.value as Quote['status'])}
                                className={`appearance-none pl-4 pr-10 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 cursor-pointer outline-none transition-all ${
                                  quote.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  quote.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                                  'bg-orange-50 text-orange-600 border-orange-100'
                                }`}
                              >
                                <option value="DRAFT">Rascunho</option>
                                <option value="SENT">Enviado</option>
                                <option value="APPROVED">Aprovado</option>
                                <option value="REJECTED">Rejeitado</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <Clock className="w-3 h-3" />
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setViewingQuote(quote)}
                                className="p-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all"
                                title="Visualizar"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDownloadPdf(quote)}
                                disabled={isGenerating}
                                className="p-3 bg-zinc-50 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                title="Baixar PDF"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
                                    deleteQuote(quote.id);
                                  }
                                }}
                                className="p-3 bg-zinc-50 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {quotes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-20">
                            <FileText className="w-16 h-16" />
                            <p className="text-xs font-black uppercase tracking-[0.2em]">Nenhum registro encontrado</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 md:p-12 max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-3 bg-white border-2 border-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all card-shadow active:scale-95"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Nova Proposta</h1>
                  <p className="text-zinc-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Configure os itens e o cliente</p>
                </div>
              </div>
              <button 
                onClick={handleSave}
                className="w-full md:w-auto bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-zinc-200 flex items-center justify-center gap-3"
              >
                <Save className="w-6 h-6" /> 
                <span>FINALIZAR ORÇAMENTO</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left Column: Config */}
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-zinc-100 card-shadow p-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">Informações Base</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Cliente Destinatário</label>
                      <select 
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-zinc-900 transition-all"
                      >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Importação Rápida (CSV)</label>
                      <input 
                        type="file" 
                        accept=".csv" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                        id="csv-upload"
                      />
                      <label 
                        htmlFor="csv-upload"
                        className="w-full flex flex-col items-center justify-center gap-4 border-2 border-dashed border-zinc-100 rounded-[2rem] p-10 text-zinc-300 hover:border-primary hover:text-primary cursor-pointer transition-all group bg-zinc-50/50"
                      >
                        <FileSpreadsheet className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Carregar Planilha</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-zinc-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-8">Resumo Financeiro</h3>
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Subtotal Bruto</span>
                      <span className="font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Descontos</span>
                      <span className="font-mono text-emerald-500">R$ 0,00</span>
                    </div>
                    <div className="pt-8 border-t border-zinc-800 flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Total Geral</span>
                      <span className="text-4xl font-black text-white tracking-tighter">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-[2.5rem] border border-zinc-100 card-shadow overflow-hidden">
                  <div className="p-8 border-b border-zinc-50 bg-zinc-50/30 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Itens da Proposta</h2>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <select 
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const product = products.find(p => p.id === e.target.value);
                          if (product) {
                            setItems([...items, { id: uuidv4(), description: product.name, quantity: 1, unitPrice: product.price, total: product.price }]);
                          }
                          e.target.value = '';
                        }}
                        className="flex-1 bg-white border-2 border-zinc-100 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest focus:border-primary outline-none transition-all shadow-sm"
                      >
                        <option value="">Catálogo...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>
                        ))}
                      </select>
                      <button 
                        onClick={addItem}
                        className="bg-zinc-900 text-white p-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
                        title="Adicionar Manual"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] uppercase tracking-wider font-black">
                          <th className="p-6">Descrição</th>
                          <th className="p-6 w-24 text-center">Qtd</th>
                          <th className="p-6 w-32 text-right">Unitário</th>
                          <th className="p-6 w-32 text-right">Total</th>
                          <th className="p-6 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {items.map((item) => (
                          <tr key={item.id} className="group hover:bg-zinc-50/30 transition-colors">
                            <td className="p-4">
                              <input 
                                type="text" 
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className="w-full bg-transparent border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black text-zinc-900 focus:bg-white focus:border-primary outline-none transition-all"
                                placeholder="Nome do serviço ou produto"
                              />
                            </td>
                            <td className="p-4">
                              <input 
                                type="number" 
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent border-2 border-transparent rounded-xl px-4 py-3 text-sm font-mono font-bold text-center text-zinc-500 focus:bg-white focus:border-primary outline-none transition-all"
                                min="1"
                              />
                            </td>
                            <td className="p-4">
                              <input 
                                type="number" 
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent border-2 border-transparent rounded-xl px-4 py-3 text-sm font-mono font-bold text-right text-zinc-500 focus:bg-white focus:border-primary outline-none transition-all"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-sm font-black text-zinc-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="p-3 text-zinc-300 hover:text-red-600 transition-colors rounded-2xl hover:bg-red-50"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {items.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-20 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-20">
                                <Wrench className="w-12 h-12" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Adicione itens para compor o orçamento.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote View Modal */}
      <Modal 
        isOpen={!!viewingQuote} 
        onClose={() => setViewingQuote(null)} 
        title="Detalhes da Proposta"
        maxWidth="4xl"
      >
        {viewingQuote && (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Cliente</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {clients.find(c => c.id === viewingQuote.clientId)?.name}
                </h3>
                <p className="text-sm text-gray-500 font-mono mt-1">
                  Emitido em {new Date(viewingQuote.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Valor Total</p>
                <p className="text-3xl font-black text-red-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingQuote.totalValue)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-zinc-800">
                    <th className="p-4">Item / Descrição</th>
                    <th className="p-4 text-center">Qtd</th>
                    <th className="p-4 text-right">Unitário</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {viewingQuote.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-4 text-sm font-bold text-gray-900 dark:text-zinc-100">{item.description}</td>
                      <td className="p-4 text-sm text-center text-gray-600 dark:text-zinc-400 font-mono">{item.quantity}</td>
                      <td className="p-4 text-sm text-right text-gray-600 dark:text-zinc-400 font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                      </td>
                      <td className="p-4 text-sm text-right font-black text-gray-900 dark:text-zinc-100 font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => handleDownloadPdf(viewingQuote)}
                className="flex-1 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <Printer className="w-5 h-5" /> Imprimir Proposta
              </button>
              <button 
                onClick={() => setViewingQuote(null)}
                className="px-8 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Ultra-Quality PDF Template */}
      {quoteToPrint && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div 
            ref={printRef}
            className="bg-white w-[800px] text-zinc-900 font-sans relative"
            style={{ minHeight: '1131px', padding: '0' }}
          >
            {/* Left Vertical Brand Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-600"></div>
            
            {/* Main Content Container */}
            <div className="p-16 flex flex-col min-h-[1131px]">
              
              {/* Header: Editorial Style */}
              <div className="flex justify-between items-start mb-20">
                <div className="space-y-8">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" className="h-20 w-auto max-w-[280px] object-contain" />
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-zinc-900 flex items-center justify-center rounded-2xl rotate-3 shadow-xl">
                        <Wrench className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-3xl font-black tracking-tighter leading-none">MANUTENÇÃO</span>
                        <span className="text-3xl font-light tracking-widest text-red-600 leading-none">PRO</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1 text-[11px] font-medium text-zinc-400 uppercase tracking-[0.1em]">
                    {companyData ? (
                      <>
                        <p className="text-zinc-900 font-bold text-sm mb-2">{companyData.name}</p>
                        <p>{companyData.address}</p>
                        <p>CNPJ {companyData.document} • {companyData.phone}</p>
                        <p>{companyData.email} • {companyData.website || 'www.manutencaopro.com.br'}</p>
                      </>
                    ) : (
                      <p className="italic">Informações da empresa não configuradas</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block border-b-4 border-red-600 pb-2 mb-4">
                    <h1 className="text-7xl font-black tracking-tighter uppercase leading-none">ORÇAMENTO</h1>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Referência</span>
                      <span className="text-lg font-mono font-bold text-zinc-900">#{quoteToPrint.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Emissão</span>
                      <span className="text-sm font-bold text-zinc-600">{new Date(quoteToPrint.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client & Project Info: Split Grid */}
              <div className="grid grid-cols-12 gap-12 mb-20">
                <div className="col-span-7">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-6">Destinatário</h3>
                  <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10">
                      <p className="text-2xl font-black text-zinc-900 mb-2">
                        {clients.find(c => c.id === quoteToPrint.clientId)?.name}
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-zinc-400">Documento</p>
                          <p className="text-xs font-bold text-zinc-700">{clients.find(c => c.id === quoteToPrint.clientId)?.document || '---'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-zinc-400">Contato</p>
                          <p className="text-xs font-bold text-zinc-700">{clients.find(c => c.id === quoteToPrint.clientId)?.phone}</p>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <p className="text-[9px] font-black uppercase text-zinc-400">Endereço de Faturamento</p>
                          <p className="text-xs font-bold text-zinc-700 leading-relaxed">{clients.find(c => c.id === quoteToPrint.clientId)?.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-5 flex flex-col justify-end">
                  <div className="border-l-2 border-zinc-100 pl-8 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Validade da Proposta</h4>
                      <p className="text-sm font-bold text-zinc-900">15 Dias Corridos</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Condições de Pagamento</h4>
                      <p className="text-sm font-bold text-zinc-900">À combinar / Faturado</p>
                    </div>
                    <div className="pt-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Documento Oficial</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table: Clean & Spaced */}
              <div className="flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                      <th className="pb-6 text-left border-b border-zinc-100">Descrição dos Serviços e Materiais</th>
                      <th className="pb-6 text-center w-24 border-b border-zinc-100">Qtd</th>
                      <th className="pb-6 text-right w-32 border-b border-zinc-100">Unitário</th>
                      <th className="pb-6 text-right w-32 border-b border-zinc-100">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {quoteToPrint.items.map((item, idx) => (
                      <tr key={item.id} className="group">
                        <td className="py-8 pr-6">
                          <div className="flex gap-4">
                            <span className="text-[10px] font-black text-red-600/30 mt-1">{(idx + 1).toString().padStart(2, '0')}</span>
                            <p className="text-sm font-bold text-zinc-900 leading-relaxed">{item.description}</p>
                          </div>
                        </td>
                        <td className="py-8 text-center">
                          <span className="text-sm font-mono font-bold text-zinc-500">{item.quantity}</span>
                        </td>
                        <td className="py-8 text-right">
                          <span className="text-sm font-mono text-zinc-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                          </span>
                        </td>
                        <td className="py-8 text-right">
                          <span className="text-base font-black text-zinc-900 font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Footer Section */}
              <div className="mt-20">
                <div className="grid grid-cols-12 gap-12 items-end">
                  <div className="col-span-7">
                    <div className="space-y-6">
                      <div className="bg-zinc-900 rounded-3xl p-10 text-white relative overflow-hidden">
                        {/* Abstract background */}
                        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                          <div className="absolute top-[-50%] right-[-20%] w-[100%] h-[200%] bg-white rotate-12"></div>
                        </div>
                        
                        <div className="relative z-10 flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Investimento Total</p>
                            <h2 className="text-5xl font-black tracking-tighter">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quoteToPrint.totalValue)}
                            </h2>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Subtotal</p>
                            <p className="text-sm font-bold text-zinc-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quoteToPrint.totalValue)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-4">
                        <p className="text-[9px] text-zinc-400 font-medium leading-relaxed max-w-md">
                          * Este orçamento não inclui taxas de urgência ou serviços adicionais não listados. 
                          Qualquer alteração no escopo resultará em uma nova revisão de valores.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 space-y-12">
                    <div className="text-center space-y-4">
                      <div className="w-full h-px bg-zinc-200"></div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Assinatura do Responsável</p>
                        <p className="text-[9px] text-zinc-400 font-medium">ManutençãoPro - Departamento Comercial</p>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-4">
                      <div className="w-full h-px bg-zinc-200"></div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">De acordo do Cliente</p>
                        <p className="text-[9px] text-zinc-400 font-medium">Assinatura e Carimbo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Footer Bar */}
              <div className="mt-auto pt-12 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">
                <span>Gerado via ManutençãoPro Cloud</span>
                <span>Página 01 de 01</span>
                <span>Autenticidade Verificada</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
