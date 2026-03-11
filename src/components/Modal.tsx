import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-[2.5rem] shadow-2xl w-full ${maxWidthClasses[maxWidth]} overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100`}>
        <div className="flex justify-between items-center p-8 border-b border-zinc-50 shrink-0">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
            {title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-50 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>
        <div className="overflow-y-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
