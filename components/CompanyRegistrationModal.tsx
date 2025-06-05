import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { BuildingOffice2Icon, XMarkIcon, ArrowUpTrayIcon, TrashIcon, DocumentTextIcon } from './Icons';
import type { CompanyData, CompanyDocument } from '../types';
import { Spinner } from './Spinner';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

interface CompanyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFormData: CompanyData = {
  companyName: '',
  cnpj: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  representativeName: '',
  representativeCpf: '',
  companyDocuments: [], // Initialize as an empty array
};

const COMPANY_DATA_LS_KEY = 'registeredCompanyData';
const MAX_PDF_SIZE_MB = 5; // Max PDF size in MB for localStorage consideration
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<CompanyData>(initialFormData);
  const [isPdfProcessing, setIsPdfProcessing] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const storedData = localStorage.getItem(COMPANY_DATA_LS_KEY);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          // Ensure companyDocuments is an array, provide default if not
          setFormData({ ...initialFormData, ...parsedData, companyDocuments: Array.isArray(parsedData.companyDocuments) ? parsedData.companyDocuments : [] });
        } catch (e) {
          console.error("Failed to parse company data from localStorage", e);
          setFormData(initialFormData); 
        }
      } else {
        setFormData(initialFormData);
      }
      setPdfError(null);
      setIsPdfProcessing(false);
      firstInputRef.current?.focus();
      
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setPdfError(`O arquivo PDF "${file.name}" é muito grande (máx: ${MAX_PDF_SIZE_MB}MB). Por favor, selecione um arquivo menor.`);
      if (pdfInputRef.current) pdfInputRef.current.value = ""; // Clear the input
      return;
    }

    setIsPdfProcessing(true);
    setPdfError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newDocument: CompanyDocument = {
          id: uuidv4(), // Generate unique ID
          name: file.name,
          base64: reader.result as string,
        };
        setFormData(prev => ({
          ...prev,
          companyDocuments: [...(prev.companyDocuments || []), newDocument],
        }));
        setIsPdfProcessing(false);
      };
      reader.onerror = () => {
        setPdfError(`Falha ao ler o arquivo PDF "${file.name}".`);
        setIsPdfProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing PDF:', err);
      setPdfError(`Ocorreu um erro ao processar o PDF "${file.name}".`);
      setIsPdfProcessing(false);
    } finally {
        if (pdfInputRef.current) pdfInputRef.current.value = ""; // Clear the input for re-selection
    }
  };

  const handleRemovePdf = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      companyDocuments: (prev.companyDocuments || []).filter(doc => doc.id !== documentId),
    }));
    setPdfError(null); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(COMPANY_DATA_LS_KEY, JSON.stringify(formData));
      console.log('Company Registration Data Saved to localStorage:', formData);
      alert('Dados da empresa salvos localmente com sucesso!');
    } catch (error) {
      console.error('Failed to save company data to localStorage:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert(`Erro ao salvar: Espaço de armazenamento local excedido. Os documentos PDF podem ser muito grandes. Tente remover alguns arquivos ou usar arquivos menores.`);
      } else {
        alert('Erro ao salvar os dados da empresa. Verifique o console para mais detalhes.');
      }
      if (!(error instanceof DOMException && error.name === 'QuotaExceededError')) {
        onClose();
      }
      return; 
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-registration-title"
    >
      <div 
        ref={modalRef}
        className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="company-registration-title" className="text-2xl font-semibold text-sky-400 flex items-center">
            <BuildingOffice2Icon className="w-7 h-7 mr-3" />
            Cadastrar/Atualizar Empresa
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-sky-400 transition-colors"
            aria-label="Fechar modal de cadastro de empresa"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Info Fields */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-1">Nome da Empresa</label>
            <input
              ref={firstInputRef}
              type="text"
              name="companyName"
              id="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full p-2.5 bg-slate-700 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-slate-300 mb-1">CNPJ</label>
            <input
              type="text"
              name="cnpj"
              id="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              required
              className="w-full p-2.5 bg-slate-700 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="XX.XXX.XXX/0001-XX"
            />
          </div>
           <div>
            <label htmlFor="representativeName" className="block text-sm font-medium text-slate-300 mb-1">Nome do Representante Legal</label>
            <input
              type="text"
              name="representativeName"
              id="representativeName"
              value={formData.representativeName || ''}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-700 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
           <div>
            <label htmlFor="representativeCpf" className="block text-sm font-medium text-slate-300 mb-1">CPF do Representante Legal</label>
            <input
              type="text"
              name="representativeCpf"
              id="representativeCpf"
              value={formData.representativeCpf || ''}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-700 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="XXX.XXX.XXX-XX"
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-300 mb-1">Email de Contato</label>
            <input
              type="email"
              name="contactEmail"
              id="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              className="w-full p-2.5 bg-slate-700 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-300 mb-1">Telefone de Contato</label>
            <input
              type="tel"
              name="contactPhone"
              id="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-700 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-1">Endereço Completo (com cidade/estado)</label>
            <textarea
              name="address"
              id="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              required
              className="w-full p-2.5 bg-slate-700 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-y"
            />
          </div>

          {/* PDF Upload Section */}
          <div className="pt-2 space-y-3">
            <label className="block text-sm font-medium text-slate-300">Documentos da Empresa (PDF)</label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handlePdfFileChange} 
              ref={pdfInputRef}
              style={{ display: 'none' }} 
              id="company-pdf-upload"
              disabled={isPdfProcessing}
            />
            <Button 
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              variant="secondary"
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white focus:ring-teal-400"
              disabled={isPdfProcessing}
              aria-label="Carregar documento PDF da empresa"
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              {isPdfProcessing ? 'Processando PDF...' : 'Adicionar Documento PDF'}
            </Button>

            {isPdfProcessing && <Spinner message="Processando PDF..." />}
            
            {pdfError && (
              <p role="alert" className="text-sm text-red-400 mt-2">{pdfError}</p>
            )}

            {formData.companyDocuments && formData.companyDocuments.length > 0 && (
              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-medium text-slate-400">Documentos Carregados:</h4>
                <ul className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {formData.companyDocuments.map((doc) => (
                    <li 
                      key={doc.id} 
                      className="p-2 bg-slate-700 rounded-md border border-slate-600 flex items-center justify-between"
                    >
                      <p className="text-sm text-slate-200 truncate flex-grow mr-2" title={doc.name}>
                        <DocumentTextIcon className="w-5 h-5 mr-2 inline-block align-text-bottom text-sky-400" />
                        {doc.name}
                      </p>
                      <Button
                        type="button"
                        onClick={() => handleRemovePdf(doc.id)}
                        variant="danger"
                        className="px-2.5 py-1 text-xs bg-red-700 hover:bg-red-600 focus:ring-red-500 flex-shrink-0"
                        aria-label={`Remover documento ${doc.name}`}
                        disabled={isPdfProcessing}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
             <p className="text-xs text-slate-400 mt-1">
                Opcional. Documentos serão salvos localmente. Limite individual: {MAX_PDF_SIZE_MB}MB.
            </p>
          </div>


          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPdfProcessing}>
             {isPdfProcessing ? 'Aguarde...' : 'Salvar Dados da Empresa'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white" disabled={isPdfProcessing}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
