import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-hidden">
      <div 
        className="relative bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded-full transition-colors"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 text-gray-800 dark:text-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
