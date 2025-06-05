import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { DocumentPlusIcon, XMarkIcon, ClipboardDocumentIcon, ArrowDownTrayIcon, BuildingOffice2Icon, InformationCircleIcon, ArrowUpTrayIcon, TrashIcon } from './Icons';
import type { DeclarationsGeneratorModalProps as ExternalDeclarationsGeneratorModalProps, CompanyData } from '../types';
import { ALL_DECLARATIONS, DeclarationDefinition } from '../services/declarationTemplates';
import { analyzeTextWithGemini } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import { Spinner } from './Spinner';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure worker is set for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.js';

const COMPANY_DATA_LS_KEY = 'registeredCompanyData'; // Key for localStorage

export const DeclarationsGeneratorModal: React.FC<ExternalDeclarationsGeneratorModalProps> = ({ isOpen, onClose, editalText }) => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [selectedDeclarations, setSelectedDeclarations] = useState<Record<string, boolean>>({});
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(true);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState<boolean>(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  // State for additional contextual PDF
  const [additionalPdfText, setAdditionalPdfText] = useState<string | null>(null);
  const [additionalPdfName, setAdditionalPdfName] = useState<string | null>(null);
  const [isAdditionalPdfLoading, setIsAdditionalPdfLoading] = useState<boolean>(false);
  const [additionalPdfError, setAdditionalPdfError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableElementRef = useRef<HTMLButtonElement>(null);
  const additionalPdfInputRef = useRef<HTMLInputElement>(null);

  const editalTextForGeneration = editalText;

  useEffect(() => {
    if (isOpen) {
      setIsLoadingInitialData(true);
      setError(null);
      setGeneratedText('');
      setSelectedDeclarations({});
      setCopySuccess('');
      setIsPdfGenerating(false);
      setIsGeneratingWithAI(false);

      // Reset additional PDF states
      setAdditionalPdfText(null);
      setAdditionalPdfName(null);
      setIsAdditionalPdfLoading(false);
      setAdditionalPdfError(null);
      if(additionalPdfInputRef.current) additionalPdfInputRef.current.value = "";
      
      const storedCompanyData = localStorage.getItem(COMPANY_DATA_LS_KEY);
      if (storedCompanyData) {
        try {
          setCompanyData(JSON.parse(storedCompanyData));
        } catch(e) {
          console.error("Failed to parse company data from localStorage for declarations", e);
          setError("Falha ao carregar dados da empresa. Verifique o cadastro.");
          setCompanyData(null);
        }
      } else {
        setError("Nenhuma empresa cadastrada. Por favor, cadastre uma empresa primeiro para gerar declarações.");
        setCompanyData(null);
      }

      if (!editalTextForGeneration || !editalTextForGeneration.trim()) {
          setError(prevError => prevError ? `${prevError}\nNenhum texto de edital fornecido.` : "Nenhum texto de edital fornecido. Adicione ou importe na seção de análise principal.");
      }
      
      setIsLoadingInitialData(false);
      firstFocusableElementRef.current?.focus();
      
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose, editalTextForGeneration]);

  const handleSelectionChange = (declarationId: string) => {
    setSelectedDeclarations(prev => ({
      ...prev,
      [declarationId]: !prev[declarationId],
    }));
  };

  const handleAdditionalPdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsAdditionalPdfLoading(true);
    setAdditionalPdfError(null);
    setAdditionalPdfText(null);
    setAdditionalPdfName(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
      }
      setAdditionalPdfText(fullText.trim());
      setAdditionalPdfName(file.name);
    } catch (err) {
      console.error('Error parsing additional PDF:', err);
      const pdfErrorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao processar o PDF.';
      setAdditionalPdfError(`Falha ao carregar PDF adicional: ${pdfErrorMessage}.`);
    } finally {
      setIsAdditionalPdfLoading(false);
      if (additionalPdfInputRef.current) {
        additionalPdfInputRef.current.value = ""; // Clear file input for re-selection
      }
    }
  };

  const handleRemoveAdditionalPdf = () => {
    setAdditionalPdfText(null);
    setAdditionalPdfName(null);
    setAdditionalPdfError(null);
    if (additionalPdfInputRef.current) {
      additionalPdfInputRef.current.value = "";
    }
  };

  const handleGenerateDeclarations = async () => {
    if (!companyData) {
      setError("Dados da empresa não encontrados. Cadastre uma empresa primeiro.");
      return;
    }
    if (!editalTextForGeneration || editalTextForGeneration.trim() === '') {
      setError("Texto do edital não encontrado. Por favor, cole ou importe o texto do edital na seção de análise principal.");
      return;
    }

    const activeDeclarationIds = Object.entries(selectedDeclarations)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);
    
    const selectedDeclarationNames = activeDeclarationIds
        .map(id => ALL_DECLARATIONS.find(d => d.id === id)?.name)
        .filter(name => !!name) as string[];

    if (selectedDeclarationNames.length === 0) {
      setError("Nenhuma declaração selecionada.");
      setGeneratedText('');
      return;
    }

    setIsGeneratingWithAI(true);
    setError(null);
    setGeneratedText('');

    let additionalContextPrompt = '';
    if (additionalPdfText && additionalPdfText.trim() !== '') {
      additionalContextPrompt = `

Texto de Documento PDF Adicional Fornecido para Contexto (por "${additionalPdfName || 'Documento Adicional'}"):
---
${additionalPdfText}
---`;
    }

    const prompt = `
Você é um assistente especializado em gerar documentos para processos de licitação no Brasil.
Sua tarefa é gerar as seguintes declarações, com base nos dados da empresa, no texto do edital (ou processo de licitação) fornecidos abaixo, e em qualquer texto de documento PDF adicional fornecido.
As declarações devem ser formatadas de forma clara, prontas para uso, e devem incluir placeholders como "[Localidade]" e "[Data Atual]" para preenchimento manual pelo usuário.
Se alguma informação crucial do edital, da empresa ou do PDF adicional for necessária para uma declaração específica e não estiver explicitamente presente nos dados fornecidos, mencione no corpo da declaração que a informação precisa ser inserida/confirmada manualmente. Inclua o nome da empresa e CNPJ em cada declaração.

Dados da Empresa:
- Nome da Empresa: ${companyData.companyName}
- CNPJ: ${companyData.cnpj}
- Endereço: ${companyData.address}
- Nome do Representante Legal: ${companyData.representativeName || '[Nome do Representante Legal - PREENCHER]'}
- CPF do Representante Legal: ${companyData.representativeCpf || '[CPF do Representante Legal - PREENCHER]'}
- Email de Contato: ${companyData.contactEmail}
- Telefone de Contato: ${companyData.contactPhone}

Texto do Edital/Processo de Licitação:
---
${editalTextForGeneration}
---
${additionalContextPrompt}

Declarações Solicitadas:
${selectedDeclarationNames.map(name => `- ${name}`).join('\n')}

Por favor, gere o texto completo para CADA declaração solicitada, separando-as claramente com um título para cada uma (Ex: "DECLARAÇÃO DE IDONEIDADE") e algumas quebras de linha entre elas.
Adapte o conteúdo de cada declaração para refletir as informações relevantes do edital e do PDF adicional (se houver), além dos dados da empresa.
Finalize cada declaração com local para assinatura, nome do representante e nome da empresa.
    `;

    try {
      const result = await analyzeTextWithGemini(prompt);
      setGeneratedText(result);
    } catch (err) {
      console.error('Error generating declarations with AI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(`Falha ao gerar declarações com IA: ${errorMessage}`);
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopySuccess('Texto copiado!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Falha ao copiar.');
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedText) return;
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `declaracoes_IA_${companyData?.companyName?.replace(/\s+/g, '_') || 'empresa'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadPdf = () => {
    if (!generatedText || !companyData) return;
    setIsPdfGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(10);

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15; 
      const maxLineWidth = pageWidth - margin * 2;
      let yPosition = margin;
      const lineHeight = 5; 

      pdf.setFontSize(8);
      pdf.setTextColor(100);
      const headerText = `Empresa: ${companyData.companyName} (CNPJ: ${companyData.cnpj})`;
      pdf.text(headerText, margin, margin / 2);
      yPosition = margin + 5; 
      pdf.setFontSize(10);
      pdf.setTextColor(0);

      const lines = generatedText.split('\n');

      lines.forEach(line => {
        if (line.toUpperCase().startsWith("DECLARAÇÃO") && yPosition > margin + 20) {
            const testSplitForTitle = pdf.splitTextToSize(line, maxLineWidth);
            const remainingSpace = pageHeight - margin - yPosition;
            if ( (testSplitForTitle.length * lineHeight * 2) > remainingSpace && lines.indexOf(line) > 0) { 
                 pdf.addPage();
                 yPosition = margin;
                 pdf.setFontSize(8);
                 pdf.setTextColor(100);
                 pdf.text(headerText, margin, margin / 2);
                 yPosition = margin + 5;
                 pdf.setFontSize(10);
                 pdf.setTextColor(0);
            }
        }
        
        const splitText = pdf.splitTextToSize(line, maxLineWidth);

        splitText.forEach((textLine: string) => {
          if (yPosition + lineHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
            pdf.setFontSize(8);
            pdf.setTextColor(100);
            pdf.text(headerText, margin, margin / 2);
            yPosition = margin + 5;
            pdf.setFontSize(10);
            pdf.setTextColor(0);
          }
          pdf.text(textLine, margin, yPosition);
          yPosition += lineHeight;
        });
      });
      
      pdf.save(`declaracoes_IA_${companyData.companyName.replace(/\s+/g, '_') || 'empresa'}.pdf`);
    } catch (e) {
        console.error("Error generating PDF for declarations:", e);
        setError("Falha ao gerar PDF das declarações. Tente novamente.");
    } finally {
        setIsPdfGenerating(false);
    }
  };

  if (!isOpen) return null;

  const renderDeclarationList = (declarations: DeclarationDefinition[], title: string) => (
    <div className="mb-4">
      <h4 className="text-md font-semibold text-slate-300 mb-2">{title}</h4>
      <ul className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto p-2 rounded-md bg-slate-700/40 border border-slate-600">
        {declarations.map(decl => (
          <li key={decl.id} className="flex items-center p-1.5 hover:bg-slate-600/50 rounded transition-colors duration-150">
            <input
              type="checkbox"
              id={`decl-${decl.id}`}
              checked={!!selectedDeclarations[decl.id]}
              onChange={() => handleSelectionChange(decl.id)}
              className="h-4 w-4 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-2 focus:ring-sky-400 focus:ring-offset-slate-800 mr-3 cursor-pointer"
              disabled={!companyData || isGeneratingWithAI || isLoadingInitialData || !editalTextForGeneration.trim() || isAdditionalPdfLoading}
              aria-labelledby={`label-decl-${decl.id}`}
            />
            <label htmlFor={`decl-${decl.id}`} id={`label-decl-${decl.id}`} className="text-sm text-slate-200 cursor-pointer select-none">
              {decl.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );

  const commonDeclarations = ALL_DECLARATIONS.filter(d => d.type === 'common');
  const specificDeclarations = ALL_DECLARATIONS.filter(d => d.type === 'specific_dispensation');
  const allButtonsDisabled = isGeneratingWithAI || isPdfGenerating || isAdditionalPdfLoading;

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="declarations-generator-title"
    >
      <div
        ref={modalRef}
        className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="declarations-generator-title" className="text-2xl font-semibold text-sky-400 flex items-center">
            <DocumentPlusIcon className="w-7 h-7 mr-3" />
            Gerador de Declarações (IA)
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-sky-400 transition-colors"
            aria-label="Fechar modal de geração de declarações"
            ref={firstFocusableElementRef} 
            disabled={allButtonsDisabled}
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        {isLoadingInitialData && <Spinner message="Carregando dados..." />}
        
        {error && !isLoadingInitialData && (
          <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-700/50 text-red-300 border border-red-600 rounded-lg">
            <p className="whitespace-pre-line"><strong>Erro:</strong> {error}</p>
          </div>
        )}

        {!isLoadingInitialData && companyData && (
          <div className="mb-3 p-3 bg-slate-700/50 rounded-md border border-slate-600">
            <p className="text-sm text-slate-300 flex items-center">
              <BuildingOffice2Icon className="w-5 h-5 mr-2 text-sky-400"/>
              Empresa: <strong className="ml-1">{companyData.companyName}</strong> (CNPJ: {companyData.cnpj})
            </p>
             <p className="text-xs text-slate-400 mt-1">
                Representante: {companyData.representativeName || 'Não informado'}, CPF: {companyData.representativeCpf || 'Não informado'}
            </p>
          </div>
        )}
        
        {!isLoadingInitialData && (
            <div className="mb-4 p-3 bg-slate-700/30 rounded-md border border-slate-600">
                 <div className="flex items-center text-sm text-slate-300">
                    <InformationCircleIcon className="w-5 h-5 mr-2 text-sky-400"/>
                    <span>Contexto do Edital Principal:</span>
                 </div>
                {editalTextForGeneration && editalTextForGeneration.trim() !== '' ? (
                    <p className="text-xs text-slate-400 mt-1 truncate" title={editalTextForGeneration}>
                        "{editalTextForGeneration.substring(0,100)}..." (Total: {editalTextForGeneration.length} caracteres)
                    </p>
                ) : (
                    <p className="text-xs text-amber-400 mt-1">
                        Texto do edital não fornecido ou carregado. Cole ou importe na seção de análise principal.
                    </p>
                )}
            </div>
        )}

        {/* Section for Additional Contextual PDF */}
        {!isLoadingInitialData && (
            <div className="mb-4 p-3 bg-slate-700/30 rounded-md border border-slate-600">
                <div className="flex items-center text-sm text-slate-300 mb-2">
                    <InformationCircleIcon className="w-5 h-5 mr-2 text-teal-400"/>
                    <span>Documento PDF Adicional para Contexto da IA (Opcional):</span>
                </div>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleAdditionalPdfFileChange}
                    ref={additionalPdfInputRef}
                    style={{ display: 'none' }}
                    id="additional-pdf-upload"
                    disabled={isAdditionalPdfLoading || allButtonsDisabled}
                />
                {!additionalPdfName && (
                    <Button
                        type="button"
                        onClick={() => additionalPdfInputRef.current?.click()}
                        variant="secondary"
                        className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white focus:ring-teal-400"
                        disabled={isAdditionalPdfLoading || allButtonsDisabled}
                        aria-label="Carregar documento PDF adicional para contexto"
                    >
                        <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                        {isAdditionalPdfLoading ? 'Processando PDF...' : 'Carregar PDF Adicional'}
                    </Button>
                )}
                {isAdditionalPdfLoading && <Spinner message="Processando PDF adicional..." />}
                {additionalPdfError && (
                    <p role="alert" className="text-xs text-red-400 mt-2">{additionalPdfError}</p>
                )}
                {additionalPdfName && !isAdditionalPdfLoading && (
                    <div className="mt-2 p-2.5 bg-slate-700 rounded-md border border-slate-600 flex items-center justify-between">
                        <p className="text-sm text-slate-200 truncate" title={additionalPdfName}>
                            <DocumentPlusIcon className="w-5 h-5 mr-2 inline-block align-text-bottom text-teal-400" />
                            {additionalPdfName} ({additionalPdfText ? `${additionalPdfText.length} caracteres extraídos` : 'erro na extração'})
                        </p>
                        <Button
                            type="button"
                            onClick={handleRemoveAdditionalPdf}
                            variant="danger"
                            className="px-3 py-1 text-xs bg-red-700 hover:bg-red-600 focus:ring-red-500"
                            aria-label="Remover documento PDF adicional"
                            disabled={allButtonsDisabled}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        )}


        {!isLoadingInitialData && (
          <div className="flex-grow overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                    {renderDeclarationList(commonDeclarations, 'Declarações Comuns')}
                </div>
                <div>
                    {renderDeclarationList(specificDeclarations, 'Declarações Específicas (Dispensas)')}
                </div>
            </div>

            <Button
              onClick={handleGenerateDeclarations}
              disabled={
                !companyData || 
                !editalTextForGeneration || 
                editalTextForGeneration.trim() === '' || 
                Object.values(selectedDeclarations).every(v => !v) || 
                allButtonsDisabled
              }
              className="w-full sm:w-auto mt-3"
              aria-label="Gerar textos das declarações selecionadas com IA"
            >
              <DocumentPlusIcon className={`w-5 h-5 mr-2 ${isGeneratingWithAI ? 'animate-pulse' : ''}`} /> 
              {isGeneratingWithAI ? 'Gerando com IA...' : 'Gerar Declarações com IA'}
            </Button>

            {isGeneratingWithAI && <Spinner message="A IA está processando sua solicitação..." />}

            {generatedText && !isGeneratingWithAI && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Declarações Geradas pela IA:</h3>
                <textarea
                  readOnly
                  value={generatedText}
                  className="w-full p-3 bg-slate-900/70 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow duration-150 resize-y min-h-[200px] max-h-[300px] text-sm whitespace-pre-wrap"
                  aria-label="Textos das declarações geradas pela IA"
                />
                <div className="mt-3 flex flex-col sm:flex-row flex-wrap gap-3">
                  <Button 
                    onClick={handleCopyToClipboard} 
                    variant="secondary" 
                    className="bg-teal-600 hover:bg-teal-500 text-white"
                    disabled={allButtonsDisabled}
                  >
                    <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
                    {copySuccess ? copySuccess : 'Copiar Texto'}
                  </Button>
                  <Button 
                    onClick={handleDownloadTxt} 
                    variant="secondary" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    disabled={allButtonsDisabled}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Baixar como .txt
                  </Button>
                  <Button 
                    onClick={handleDownloadPdf} 
                    variant="secondary" 
                    className="bg-rose-600 hover:bg-rose-500 text-white"
                    disabled={allButtonsDisabled}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    {isPdfGenerating ? 'Gerando PDF...' : 'Baixar como PDF'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-auto pt-6 flex justify-end">
            <Button 
                variant="secondary" 
                onClick={onClose} 
                className="bg-slate-600 hover:bg-slate-500"
                disabled={allButtonsDisabled}
            >
              {allButtonsDisabled ? 'Aguarde...' : 'Fechar'}
            </Button>
        </div>
      </div>
    </div>
  );
};
