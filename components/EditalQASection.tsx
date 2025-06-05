import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { analyzeTextWithGemini } from '../services/geminiService';
import { ChatBubbleLeftEllipsisIcon, SparklesIcon } from './Icons';
import type { EditalQASectionProps } from '../types';

export const EditalQASection: React.FC<EditalQASectionProps> = ({ editalText }) => {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [isAskingAI, setIsAskingAI] = useState<boolean>(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const handleAskAI = useCallback(async () => {
    if (!editalText.trim()) {
      setQaError('Nenhum texto do edital carregado para fazer perguntas.');
      setCurrentAnswer('');
      return;
    }
    if (!currentQuestion.trim()) {
      setQaError('Por favor, insira uma pergunta.');
      setCurrentAnswer('');
      return;
    }

    setIsAskingAI(true);
    setQaError(null);
    setCurrentAnswer('');

    const prompt = `
Contexto do Edital Fornecido:
---
${editalText}
---

Com base EXCLUSIVAMENTE no "Contexto do Edital Fornecido" acima, responda à seguinte "Pergunta do Usuário".
Se a resposta não puder ser encontrada diretamente no texto do edital, declare explicitamente que a informação não está presente no documento fornecido ou que não pode ser inferida a partir dele. Não adicione informações externas ao edital.

Pergunta do Usuário:
${currentQuestion}
---
Resposta Precisa e Concisa (baseada apenas no edital):
`;

    try {
      const resultText = await analyzeTextWithGemini(prompt);
      setCurrentAnswer(resultText);
    } catch (err) {
      console.error('Error during Q&A with AI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      let finalErrorMsg = `Falha ao obter resposta: ${errorMessage}`;
      if (errorMessage.includes("API") || errorMessage.toLowerCase().includes("chave api") || errorMessage.toLowerCase().includes("api key")) {
        finalErrorMsg = `Erro de API: ${errorMessage}. Verifique a configuração da chave API e suas permissões.`;
      }
      setQaError(finalErrorMsg);
      setCurrentAnswer('');
    } finally {
      setIsAskingAI(false);
    }
  }, [editalText, currentQuestion]);

  return (
    <div className="bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8 border border-slate-700 mt-12">
      <h2 className="text-2xl font-semibold mb-6 text-sky-400 flex items-center">
        <ChatBubbleLeftEllipsisIcon className="w-7 h-7 mr-3 text-sky-400" />
        Perguntas e Respostas sobre o Edital (IA)
      </h2>

      {!editalText.trim() && (
        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 text-center" role="alert">
          <p>Importe ou cole o texto de um edital na seção acima para habilitar as perguntas e respostas.</p>
        </div>
      )}

      {editalText.trim() && (
        <>
          <textarea
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Digite sua pergunta específica sobre o edital aqui..."
            rows={3}
            className="w-full p-3 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow duration-150 mb-4 resize-y min-h-[75px] aria-[disabled=true]:opacity-70"
            disabled={isAskingAI || !editalText.trim()}
            aria-disabled={isAskingAI || !editalText.trim()}
            aria-label="Caixa de texto para perguntas sobre o edital"
          />
          <Button
            onClick={handleAskAI}
            disabled={isAskingAI || !currentQuestion.trim() || !editalText.trim()}
            className="w-full sm:w-auto"
            aria-label="Perguntar à IA sobre o edital"
          >
            <SparklesIcon className={`w-5 h-5 mr-2 ${isAskingAI ? 'animate-pulse' : ''}`} />
            {isAskingAI ? 'Consultando IA...' : 'Perguntar à IA'}
          </Button>

          {isAskingAI && <Spinner message="A IA está buscando a resposta..." />}

          {qaError && (
            <div role="alert" aria-live="assertive" className="mt-4 p-3 bg-red-700/50 text-red-300 border border-red-600 rounded-lg">
              <p><strong>Erro:</strong> {qaError}</p>
            </div>
          )}

          {currentAnswer && !isAskingAI && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-300">Resposta da IA:</h3>
              <div
                className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg prose prose-sm prose-invert max-w-none text-slate-200 overflow-y-auto max-h-[300px] whitespace-pre-wrap"
                aria-live="polite"
                tabIndex={0}
              >
                {currentAnswer}
              </div>
            </div>
          )}
           {!isAskingAI && !currentAnswer.trim() && !qaError && (
             <div className="mt-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg text-center text-slate-400 min-h-[100px] flex items-center justify-center" aria-live="polite">
                <p>Faça uma pergunta sobre o edital carregado. A resposta da IA aparecerá aqui.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
