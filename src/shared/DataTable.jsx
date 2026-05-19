import { useState, useMemo } from 'react';
import { ButtonEditar, ButtonExcluir, ButtonVisualizar } from '@/components/ui/ActionButtons';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

export default function DataTable({ columns, data, onEdit, onDelete, onView, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (accessor) => {
    let direction = 'asc';
    if (sortConfig.key === accessor && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: accessor, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let result = data;

    // Filter
    if (searchTerm) {
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Pesquisa */}
      <div className="flex items-center max-w-sm px-3 py-2 border border-input rounded-md bg-background">
        <Search size={18} className="text-muted-foreground mr-2" />
        <input 
          type="text" 
          placeholder="Buscar em todas as colunas..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-border bg-card overflow-hidden">
        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</div>
        ) : (
          <table className="w-full caption-bottom text-sm min-w-[760px]">
            <thead className="[&_tr]:border-b bg-muted/60">
              <tr className="border-b border-border transition-colors hover:bg-muted/50">
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    onClick={() => col.accessor && handleSort(col.accessor)}
                    className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${col.accessor ? 'cursor-pointer hover:text-foreground select-none' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {sortConfig.key === col.accessor && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                ))}
                {(onView || onEdit || onDelete) && (
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[120px]">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {filteredAndSortedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border transition-colors hover:bg-muted/50 relative group">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="p-4 align-middle text-foreground">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="p-4 align-middle text-right space-x-2 whitespace-nowrap">
                      {onView && (
                        <ButtonVisualizar onClick={() => onView(row)} isIconOnly />
                      )}
                      {onEdit && (
                        <ButtonEditar onClick={() => onEdit(row)} isIconOnly />
                      )}
                      {onDelete && (
                        <ButtonExcluir onClick={() => onDelete(row)} isIconOnly />
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
