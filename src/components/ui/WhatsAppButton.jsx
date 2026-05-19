import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, MessageCircle } from 'lucide-react';
import { Modal } from './Modal';

export function WhatsAppButton({ phone, showQrCode = true }) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/55${cleanPhone}`;

  if (!cleanPhone) return null;

  return (
    <>
      <div className="flex items-center gap-1">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 p-1.5 rounded-md transition-colors"
          title="Abrir no WhatsApp Web/App"
        >
          <MessageCircle size={18} />
        </a>
        {showQrCode && (
          <button 
            onClick={() => setIsQrOpen(true)}
            className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-1.5 rounded-md transition-colors"
            title="Mostrar QR Code do WhatsApp"
          >
            <QrCode size={18} />
          </button>
        )}
      </div>

      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="WhatsApp QR Code">
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <p className="text-center text-sm text-muted-foreground max-w-sm">
            Escaneie o QR Code abaixo com a câmera do seu celular para abrir a conversa diretamente no WhatsApp.
          </p>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <QRCodeSVG value={url} size={200} level="H" />
          </div>
          <p className="font-semibold text-lg">{phone}</p>
          <a 
            href={url}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <MessageCircle size={18} />
            Abrir Link Direto
          </a>
        </div>
      </Modal>
    </>
  );
}
