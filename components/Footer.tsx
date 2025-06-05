
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 py-6 text-center">
      <div className="container mx-auto px-4">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} Analisador de Licitações IA. Todos os direitos reservados.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Potencializado por IA para otimizar seus processos.
        </p>
      </div>
    </footer>
  );
};