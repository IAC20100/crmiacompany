import React, { useRef, useState, useEffect } from 'react';
import { useStore, CompanyData } from '../store';
import { Upload, Trash2, Image as ImageIcon, Save, Download, Database, FileUp } from 'lucide-react';

export default function Settings() {
  const { 
    companyLogo, setCompanyLogo, 
    companySignature, setCompanySignature,
    companyData, setCompanyData,
    clients, checklistItems, tickets, quotes, receipts, costs, appointments, products,
    restoreData
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CompanyData>({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    website: ''
  });

  useEffect(() => {
    if (companyData) {
      setFormData(companyData);
    }
  }, [companyData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanySignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyData(formData);
    alert('Dados da empresa salvos com sucesso!');
  };

  const handleExportBackup = () => {
    const backupData = {
      clients,
      checklistItems,
      tickets,
      quotes,
      receipts,
      costs,
      appointments,
      products,
      companyLogo,
      companySignature,
      companyData,
      version: '1.0',
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_iac_tec_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (confirm('Atenção: Restaurar um backup irá substituir todos os dados atuais. Deseja continuar?')) {
            restoreData(json);
            alert('Backup restaurado com sucesso!');
          }
        } catch (error) {
          console.error('Erro ao importar backup:', error);
          alert('Erro ao importar backup. Verifique se o arquivo é um JSON válido.');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Configurações</h1>
      
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Logo da Empresa</h2>
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-zinc-800/50 overflow-hidden shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo da Empresa" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-gray-400 dark:text-zinc-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <span className="text-sm">Sem logo</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              Adicione a logo da sua empresa para que ela apareça no menu lateral e nos relatórios em PDF gerados pelo sistema.
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Recomendamos uma imagem com fundo transparente (PNG) ou branco (JPG).
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Escolher Imagem
              </button>
              
              {companyLogo && (
                <button 
                  onClick={() => setCompanyLogo(null)}
                  className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Remover Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Assinatura da Empresa</h2>
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-64 h-32 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-zinc-800/50 overflow-hidden shrink-0">
            {companySignature ? (
              <img src={companySignature} alt="Assinatura da Empresa" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-gray-400 dark:text-zinc-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                <span className="text-xs">Sem assinatura</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              Adicione uma imagem da assinatura digitalizada ou carimbo da sua empresa. Ela será exibida no rodapé de Orçamentos, Ordens de Serviço e Recibos.
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Recomendamos uma imagem com fundo transparente (PNG) para melhor visualização nos documentos.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={signatureInputRef}
                onChange={handleSignatureChange}
              />
              <button 
                onClick={() => signatureInputRef.current?.click()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Escolher Assinatura
              </button>
              
              {companySignature && (
                <button 
                  onClick={() => setCompanySignature(null)}
                  className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Remover Assinatura
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Dados da Empresa</h2>
        <form onSubmit={handleSaveData} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Nome da Empresa / Razão Social *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">CNPJ / CPF *</label>
              <input 
                type="text" 
                value={formData.document}
                onChange={(e) => setFormData({...formData, document: e.target.value})}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Telefone / WhatsApp *</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">E-mail *</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Endereço Completo *</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Site (Opcional)</label>
              <input 
                type="text" 
                value={formData.website || ''}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-zinc-800">
            <button 
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> Salvar Dados
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="w-6 h-6 text-red-600" />
          Backup e Restauração
        </h2>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
          Gere uma cópia de segurança de todos os seus dados (clientes, ordens, produtos, etc.) para salvar em outro local ou restaurar em caso de necessidade.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExportBackup}
            className="bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
          >
            <Download className="w-5 h-5" /> Gerar Backup Completo
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={backupInputRef}
              onChange={handleImportBackup}
            />
            <button 
              onClick={() => backupInputRef.current?.click()}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-6 py-3 rounded-xl font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
            >
              <FileUp className="w-5 h-5" /> Restaurar Backup
            </button>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
            <strong>Aviso Importante:</strong> Ao restaurar um backup, todos os dados atuais do sistema serão substituídos pelos dados contidos no arquivo. Recomendamos gerar um backup dos dados atuais antes de realizar uma restauração.
          </p>
        </div>
      </div>
    </div>
  );
}
