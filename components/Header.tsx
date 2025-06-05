
import React, { useState } from 'react';
import { ChartBarSquareIcon, UserPlusIcon, DocumentPlusIcon } from './Icons';
import { CompanyRegistrationModal } from './CompanyRegistrationModal';
import { DeclarationsGeneratorModal } from './DeclarationsGeneratorModal';
import { Button } from './Button';

interface HeaderProps {
  editalText: string; // Used to enable/disable Declarations button and pass to modal
}

export const Header: React.FC<HeaderProps> = ({ editalText }) => {
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDeclarationsModalOpen, setIsDeclarationsModalOpen] = useState(false);

  // Removed all BiddingProcessContext related hooks and handlers

  return (
    <>
      <header className="bg-slate-900/80 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-slate-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-white">
            <div className="flex items-center mb-2 sm:mb-0">
              <ChartBarSquareIcon className="h-8 w-8 mr-3 text-sky-400" />
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Analisador IA</h1>
            </div>

            {/* Process Management UI Removed */}
            
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-center sm:justify-end">
              <Button 
                onClick={() => setIsCompanyModalOpen(true)}
                variant="secondary"
                className="bg-sky-600 hover:bg-sky-500 text-white focus:ring-sky-400 px-3 py-2 text-xs sm:text-sm"
                aria-label="Cadastrar ou atualizar dados da empresa"
              >
                <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                Empresa
              </Button>
              <Button 
                onClick={() => setIsDeclarationsModalOpen(true)}
                variant="secondary"
                className="bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-400 px-3 py-2 text-xs sm:text-sm"
                aria-label="Gerar declarações para licitação"
                disabled={!editalText || !editalText.trim()} // Disabled if no editalText
              >
                <DocumentPlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                Declarações
              </Button>
            </div>
          </div>
        </div>
      </header>
      <CompanyRegistrationModal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} />
      <DeclarationsGeneratorModal 
        isOpen={isDeclarationsModalOpen} 
        onClose={() => setIsDeclarationsModalOpen(false)}
        editalText={editalText} // Pass editalText as a prop
      /> 
    </>
  );
};
