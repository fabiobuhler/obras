import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const getBuildVersion = () => {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type) => parts.find((part) => part.type === type)?.value || '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');

  return `1.0.${year}.${month}${day}${hour}${minute}`;
};

const appVersion = getBuildVersion();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/obras/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
