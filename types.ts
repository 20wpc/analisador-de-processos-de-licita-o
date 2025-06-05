import React from 'react';

// --- Component Prop Types ---
export interface AnalysisSectionProps {
  inputText: string;
  onInputChange: (text: string) => void;
  analysisResult: string;
  onAnalysisResultChange: (newResult: string) => void;
}

export interface EditalQASectionProps {
  editalText: string; // The context for questions
}

export interface CompanyDocument {
  id: string;
  name: string;
  base64: string; // Base64 encoded PDF content
}

export interface CompanyData {
  companyName: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  representativeName?: string;
  representativeCpf?: string;
  companyDocuments?: CompanyDocument[]; // Changed from single PDF to array
}

export interface DeclarationsGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editalText: string; 
}

// --- Declaration Template Types ---
export interface DeclarationDefinition {
  id: string;
  name: string;
  type: 'common' | 'specific_dispensation';
}