
import React, { useState, useCallback, useRef } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { analyzeTextWithGemini } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowPathIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, InformationCircleIcon } from './Icons';
import * as pdfjsLib from 'pdfjs-dist';
import type { AnalysisSectionProps } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.js';

const contentId = "process-analysis-content";

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  inputText,
  onInputChange,
  analysisResult,
  onAnalysisResultChange,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isPdfImportLoading, setIsPdfImportLoading] = useState<boolean>(false);
  const [isPdfExportLoading, setIsPdfExportLoading] = useState<boolean>(false);
  
  const analysisContentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) {
      setAnalysisError('Nenhum texto do edital para análise.');
      onAnalysisResultChange('');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    onAnalysisResultChange(''); 

    const prompt = `
Analise o seguinte texto de um edital ou processo de licitação e forneça um resumo dos pontos mais importantes,
incluindo objeto, principais requisitos, prazos (se mencionados) e quaisquer observações relevantes.
Seja conciso e direto.

Texto do Edital/Processo:
---
${inputText}
---
Resultado da Análise:
`;
    try {
      const resultText = await analyzeTextWithGemini(prompt);
      onAnalysisResultChange(resultText);
    } catch (err) {
      console.error('Error during analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante a análise.';
      let finalErrorMsg = `Falha na análise: ${errorMessage}`;
       if (errorMessage.includes("API") || errorMessage.toLowerCase().includes("chave api") || errorMessage.toLowerCase().includes("api key")) {
        finalErrorMsg = `Erro de API: ${errorMessage}. Verifique a configuração da chave API e suas permissões.`;
      }
      setAnalysisError(finalErrorMsg);
      onAnalysisResultChange('');
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, onAnalysisResultChange]);

  const handleDownloadPdf = useCallback(async () => {
    const element = analysisContentRef.current;
    if (!element || !analysisResult.trim()) {
      setAnalysisError('Nenhum conteúdo de análise para exportar.');
      return;
    }
    setIsPdfExportLoading(true);
    setAnalysisError(null);

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Improve quality
        backgroundColor: '#1e293b', // slate-800, a solid dark background for PDF consistency
        useCORS: true,
        width: element.scrollWidth, // Capture full scrollable width
        height: element.scrollHeight, // Capture full scrollable height
        x: 0, // Start capture from the top-left of the scrollable content
        y: 0,
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // mm margin on all sides

      const contentWidth = pdfWidth - 2 * margin;
      const contentHeightPerPage = pdfHeight - 2 * margin;

      const imgProps = pdf.getImageProperties(imgData);
      // Calculate the total height of the image if it's scaled to fit the PDF's content width
      const totalScaledImgHeight = (imgProps.height * contentWidth) / imgProps.width;

      let numPages = Math.ceil(totalScaledImgHeight / contentHeightPerPage);
      if (numPages === 0 && analysisResult.trim()) { // Ensure at least one page if there's content but calc results in 0 pages
        numPages = 1;
      }
      
      for (let i = 0; i < numPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Calculate the y-offset for the image source for the current page segment
        // This makes the tall image appear "pulled up" by the height of previous pages' content
        const imageSegmentYoffsetForPage = -(i * contentHeightPerPage);

        pdf.addImage(
          imgData,
          'PNG',
          margin, // x position on page
          margin + imageSegmentYoffsetForPage, // y position on page
          contentWidth, // width of image on page
          totalScaledImgHeight // total height of the scaled image (jsPDF will effectively clip this based on page boundaries)
        );

        // Add Header
        pdf.setFontSize(10);
        pdf.setTextColor(150); // Light gray
        pdf.text('Análise de Edital', pdfWidth / 2, margin / 1.5, { align: 'center' });
        
        // Add Footer
        pdf.text(`Página ${i + 1} de ${numPages}`, pdfWidth / 2, pdfHeight - (margin / 2), { align: 'center' });
        pdf.setTextColor(0); // Reset text color
      }
      pdf.save(`analise_edital.pdf`);

    } catch (err) {
      console.error("Error generating PDF:", err);
      setAnalysisError("Falha ao gerar PDF. Tente novamente.");
    } finally {
      setIsPdfExportLoading(false);
    }
  }, [analysisResult]);

  const handlePdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsPdfImportLoading(true);
    setAnalysisError(null);
    onInputChange(''); 
    onAnalysisResultChange(''); 


    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
      }
      onInputChange(fullText.trim());
    } catch (err) {
      console.error('Error parsing PDF:', err);
      const pdfErrorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao processar o PDF.';
      setAnalysisError(`Falha ao carregar PDF: ${pdfErrorMessage}. Verifique se o arquivo é um PDF válido e não está criptografado.`);
    } finally {
      setIsPdfImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8 border border-slate-700 flex flex-col h-full">
      <h2 className="text-2xl font-semibold mb-6 text-sky-400 flex items-center">
        <InformationCircleIcon className="w-7 h-7 mr-3 text-sky-400" />
        Análise de Edital / Processo de Licitação
      </h2>
      
      <div className="mb-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handlePdfFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          id="pdf-upload-main"
          disabled={isAnalyzing || isPdfImportLoading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white focus:ring-teal-400"
          disabled={isAnalyzing || isPdfImportLoading}
          aria-label="Importar arquivo PDF para análise"
        >
          <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
          {isPdfImportLoading ? 'Carregando PDF...' : 'Importar PDF do Edital'}
        </Button>
         {isPdfImportLoading && <Spinner message="Processando PDF..." />}
      </div>

      <textarea
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Cole aqui o texto do edital, contrato ou detalhes do processo de licitação para análise, ou importe um PDF..."
        rows={10}
        className="w-full p-3 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow duration-150 mb-4 resize-y min-h-[200px] aria-[disabled=true]:opacity-70"
        disabled={isAnalyzing || isPdfImportLoading}
        aria-disabled={isAnalyzing || isPdfImportLoading}
        aria-label="Input do texto do edital"
      />
      
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || isPdfImportLoading || !inputText.trim()}
          className="w-full sm:w-auto"
          aria-label="Analisar texto do edital"
        >
          <ArrowPathIcon className={`w-5 h-5 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analisando...' : 'Analisar Edital com IA'}
        </Button>
        {analysisResult.trim() && (
          <Button
            onClick={handleDownloadPdf}
            disabled={isPdfExportLoading || isAnalyzing}
            variant="secondary"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white focus:ring-emerald-400"
            aria-label="Baixar resultado da análise em PDF"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            {isPdfExportLoading ? 'Gerando PDF...' : 'Baixar Análise em PDF'}
          </Button>
        )}
      </div>

      {isAnalyzing && <Spinner message="Analisando o edital com IA..." />}
      {isPdfExportLoading && <Spinner message="Gerando PDF da análise..." />}

      {analysisError && (
        <div role="alert" aria-live="assertive" className="mt-4 p-3 bg-red-700/50 text-red-300 border border-red-600 rounded-lg">
          <p><strong>Erro:</strong> {analysisError}</p>
        </div>
      )}
      
      {analysisResult.trim() && !isAnalyzing && (
        <div className="mt-4 flex-grow">
          <h3 className="text-lg font-semibold mb-3 text-slate-300" id={`${contentId}-heading`}>Resultado da Análise:</h3>
          <div
            id={contentId}
            ref={analysisContentRef}
            className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg prose prose-sm prose-invert max-w-none text-slate-200 overflow-y-auto max-h-[400px] min-h-[150px] whitespace-pre-wrap"
            aria-labelledby={`${contentId}-heading`}
            tabIndex={0}
          >
            {analysisResult}
          </div>
        </div>
      )}
      {!isAnalyzing && !isPdfImportLoading && !analysisResult.trim() && !analysisError && (
         <div className="mt-4 p-4 bg-slate-700/30 border border-slate-600 rounded-lg text-center text-slate-400 flex-grow flex items-center justify-center min-h-[150px]" aria-live="polite">
            <p>Aguardando texto do edital para análise. Os resultados aparecerão aqui.</p>
        </div>
      )}
    </div>
  );
};
