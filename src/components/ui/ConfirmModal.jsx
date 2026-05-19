import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Excluir', isDestructive = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
        {isDestructive && (
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
            <AlertTriangle size={24} />
          </div>
        )}
        <p className="text-muted-foreground">{message}</p>
        <div className="flex gap-3 mt-6 w-full justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
