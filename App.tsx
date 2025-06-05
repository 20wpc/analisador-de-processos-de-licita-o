import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AnalysisSection } from './components/AnalysisSection';
import { EditalQASection } from './components/EditalQASection'; // Import the new Q&A section
import { DocumentTextIcon, ArrowDownTrayIcon } from './components/Icons'; 

const App: React.FC = () => {
  const [editalText, setEditalText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>(''); 

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-slate-100">
      <Header editalText={editalText} /> 
      <main className="flex-grow container mx-auto px-4 py-8 space-y-12">
        <div className="text-center mb-12 pt-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            Analisador Inteligente de Licitações
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Utilize o poder da IA para analisar seus processos de licitação e declarações. Obtenha insights, gere relatórios e documentos.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full lg:w-4/5 xl:w-3/4">
            <AnalysisSection
              inputText={editalText}
              onInputChange={setEditalText}
              analysisResult={analysisResult}
              onAnalysisResultChange={setAnalysisResult}
            />
          </div>
        </div>

        {/* New Edital Q&A Section */}
        <div className="flex justify-center">
          <div className="w-full lg:w-4/5 xl:w-3/4">
            <EditalQASection editalText={editalText} />
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-slate-800/50 rounded-lg shadow-xl border border-slate-700">
            <h3 className="text-xl font-semibold text-sky-400 mb-3 flex items-center">
                <ArrowDownTrayIcon className="w-6 h-6 mr-2" />
                Exportação de Relatórios e Documentos
            </h3>
            <p className="text-slate-300">
                Após gerar uma análise ou declarações, você poderá baixar os resultados em formato PDF (para análises) ou .txt e PDF (para declarações).
                Isso permite que você armazene e compartilhe facilmente os insights e documentos gerados.
            </p>
        </div>

         <div className="mt-12 p-6 bg-red-800/30 rounded-lg shadow-xl border border-red-700">
            <h3 className="text-xl font-semibold text-red-400 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                Aviso Importante
            </h3>
            <ul className="list-disc list-inside text-red-300 space-y-1">
                <li><strong>Chave API:</strong> Este aplicativo utiliza uma chave de API para interagir com os serviços de IA. 
                A chave API é configurada no ambiente (<code>process.env.API_KEY</code>) e <strong>não</strong> deve ser inserida aqui. 
                Se a análise falhar, verifique a configuração da chave.</li>
                <li><strong>Dados da Empresa:</strong> Os dados da empresa (incluindo o PDF do documento da empresa) são salvos <strong>localmente no seu navegador</strong> (localStorage). Limpar os dados do navegador removerá essas informações.</li>
                <li><strong>Texto do Edital:</strong> O texto do edital inserido ou importado para análise é mantido em memória durante a sessão e usado para gerar declarações e responder perguntas.</li>
            </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
