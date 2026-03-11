import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Download, Printer, Edit } from 'lucide-react';
import { useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function TicketView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, clients, checklistItems, companyLogo, companyData } = useStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const ticket = tickets.find(t => t.id === id);
  const client = clients.find(c => c.id === ticket?.clientId);

  if (!ticket || !client) {
    return <div className="p-8 text-center text-gray-500">Ordem de Serviço não encontrada.</div>;
  }

  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    setIsGenerating(true);
    try {
      // Use html-to-image instead of html2canvas to support modern CSS like oklch
      const imgData = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2 // equivalent to scale: 2
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // We need to calculate the height based on the element's aspect ratio
      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;
      const pdfHeight = (elementHeight * pdfWidth) / elementWidth;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // Create a safe filename
      const dateStr = new Date(ticket.date).toLocaleDateString('pt-BR').replace(/\//g, '-');
      const safeName = client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
      const fileName = `OS_${ticket.type}_${safeName}_${dateStr}.pdf`;
      
      // Explicit download approach
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank'; // Try to open in new tab if download is blocked in iframe
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Ocorreu um erro ao gerar o PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detalhes da Ordem de Serviço</h1>
        </div>
        <div className="flex gap-3">
          <Link 
            to={`/tickets/${ticket.id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Editar
          </Link>
          <button 
            onClick={handlePrint}
            className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button 
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> {isGenerating ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      <div 
        ref={printRef} 
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-8 print:shadow-none print:border-none print:p-0"
      >
        {/* Cabeçalho do Relatório */}
        <div className="border-b-2 border-gray-800 dark:border-zinc-700 pb-6 mb-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            {companyLogo && (
              <img src={companyLogo} alt="Logo da Empresa" className="h-16 w-auto object-contain" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">Relatório de Manutenção</h2>
              <p className="text-gray-500 dark:text-zinc-400 font-medium mt-1">
                {ticket.type === 'CORRETIVA' ? 'Manutenção Corretiva' : 'Manutenção Preventiva / Checklist'}
              </p>
              {companyData && (
                <div className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                  <p className="font-bold text-gray-700 dark:text-zinc-300">{companyData.name}</p>
                  <p>CNPJ: {companyData.document} | Tel: {companyData.phone}</p>
                  <p>{companyData.email}</p>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-zinc-400">Data da OS</p>
            <p className="font-bold text-gray-900 dark:text-white">{new Date(ticket.date).toLocaleDateString('pt-BR')}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">Técnico Responsável</p>
            <p className="font-bold text-gray-900 dark:text-white">{ticket.technician}</p>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="mb-8 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-100 dark:border-zinc-800 print:bg-transparent print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Dados do Cliente</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Nome / Condomínio</p>
              <p className="font-medium text-gray-900 dark:text-zinc-200">{client.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">CNPJ / CPF</p>
              <p className="font-medium text-gray-900 dark:text-zinc-200">{client.document || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Responsável</p>
              <p className="font-medium text-gray-900 dark:text-zinc-200">{client.contactPerson || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Telefone</p>
              <p className="font-medium text-gray-900 dark:text-zinc-200">{client.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">E-mail</p>
              <p className="font-medium text-gray-900 dark:text-zinc-200">{client.email || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-zinc-400">Endereço</p>
              <p className="font-medium text-gray-900 dark:text-zinc-200">{client.address}</p>
            </div>
          </div>
        </div>

        {/* Conteúdo Específico */}
        {ticket.type === 'CORRETIVA' ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 border-b dark:border-zinc-800 pb-1">Problema Relatado</h3>
              <p className="text-gray-800 dark:text-zinc-300 whitespace-pre-wrap">{ticket.reportedProblem}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 border-b dark:border-zinc-800 pb-1">Relato da Ordem de Serviço</h3>
              <p className="text-gray-800 dark:text-zinc-300 whitespace-pre-wrap">{ticket.serviceReport}</p>
            </div>

            {ticket.productsForQuote && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-900/50 print:bg-transparent print:border-gray-300">
                <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-2">Produtos para Orçamento</h3>
                <p className="text-orange-900 dark:text-orange-300 whitespace-pre-wrap">{ticket.productsForQuote}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-4 border-b dark:border-zinc-800 pb-2">Resultados do Checklist</h3>
            
            <div className="overflow-hidden border border-gray-200 dark:border-zinc-800 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                    <th className="p-3 font-semibold border-b border-gray-200 dark:border-zinc-700">Tarefa</th>
                    <th className="p-3 font-semibold border-b border-gray-200 dark:border-zinc-700 w-24 text-center">Status</th>
                    <th className="p-3 font-semibold border-b border-gray-200 dark:border-zinc-700">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {ticket.checklistResults?.map(result => {
                    const item = checklistItems.find(i => i.id === result.taskId);
                    if (!item) return null;
                    
                    return (
                      <tr key={result.taskId}>
                        <td className="p-3 text-gray-900 dark:text-zinc-300 font-medium">{item.task}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            result.status === 'OK' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 print:border print:border-emerald-800' :
                            result.status === 'NOK' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 print:border print:border-red-800' :
                            'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-400 print:border print:border-gray-800'
                          }`}>
                            {result.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-zinc-400">{result.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Observações Gerais */}
        {ticket.observations && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 border-b dark:border-zinc-800 pb-1">Observações Gerais</h3>
            <p className="text-gray-800 dark:text-zinc-300 whitespace-pre-wrap">{ticket.observations}</p>
          </div>
        )}

        {/* Assinaturas */}
        <div className="mt-16 pt-8 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-gray-400 dark:border-zinc-600 w-3/4 mx-auto mb-2"></div>
            <p className="font-bold text-gray-900 dark:text-white">{ticket.technician}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Técnico Responsável</p>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 dark:border-zinc-600 w-3/4 mx-auto mb-2"></div>
            <p className="font-bold text-gray-900 dark:text-white">{client.name}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Cliente / Síndico(a)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
