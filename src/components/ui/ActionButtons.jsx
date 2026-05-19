import { Plus, Edit2, Trash2, Printer, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ButtonNovo({ onClick, className, children = "Novo" }) {
  return (
    <button 
      onClick={onClick} 
      className={cn("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2", className)}
    >
      <Plus size={16} />
      {children}
    </button>
  );
}

export function ButtonVisualizar({ onClick, className, children = "Visualizar", isIconOnly = false }) {
  return (
    <button 
      onClick={onClick} 
      className={cn("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 h-8 px-3 py-1", className)}
      title="Visualizar Detalhes"
    >
      <Eye size={16} />
      {!isIconOnly && children}
    </button>
  );
}

export function ButtonEditar({ onClick, className, children = "Editar", isIconOnly = false }) {
  return (
    <button 
      onClick={onClick} 
      className={cn("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 py-1", className)}
      title="Editar registro"
    >
      <Edit2 size={16} />
      {!isIconOnly && children}
    </button>
  );
}

export function ButtonExcluir({ onClick, className, isIconOnly = false, children = "Excluir" }) {
  return (
    <button 
      onClick={onClick} 
      className={cn("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors text-destructive hover:bg-destructive/10 h-8 px-3 py-1", className)}
      title="Excluir ou inativar"
    >
      <Trash2 size={16} />
      {!isIconOnly && children}
    </button>
  );
}

export function ButtonImprimir({ onClick, className, children = "Imprimir" }) {
  return (
    <button 
      onClick={onClick} 
      className={cn("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-border bg-background hover:bg-muted h-10 px-4 py-2", className)}
    >
      <Printer size={16} />
      {children}
    </button>
  );
}

export function ButtonRelatorio({ onClick, className, children = "Relatório" }) {
  return (
    <button 
      onClick={onClick} 
      className={cn("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-border bg-background hover:bg-muted h-10 px-4 py-2", className)}
    >
      <FileText size={16} />
      {children}
    </button>
  );
}
