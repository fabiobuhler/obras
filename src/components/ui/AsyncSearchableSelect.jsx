import { useState, useRef, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/services/supabase';

/**
 * AsyncSearchableSelect — busca registros direto do Supabase.
 * Props:
 *   control      — react-hook-form control
 *   name         — nome do campo no form
 *   table        — nome da tabela no Supabase
 *   labelField   — coluna a exibir como label
 *   placeholder  — texto placeholder
 *   error        — booleano de erro
 */
export default function AsyncSearchableSelect({ control, name, table, labelField, placeholder = 'Selecione...', error }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <AsyncSelect
          value={field.value}
          onChange={field.onChange}
          table={table}
          labelField={labelField}
          placeholder={placeholder}
          error={error}
        />
      )}
    />
  );
}

function AsyncSelect({ value, onChange, table, labelField, placeholder, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resolve label do valor inicial
  useEffect(() => {
    if (!value) { setSelectedLabel(''); return; }
    const found = options.find(o => o.value === value);
    if (found) { setSelectedLabel(found.label); return; }

    // Buscar pelo ID diretamente se não estiver na lista
    supabase.from(table).select(`id, ${labelField}`).eq('id', value).single()
      .then(({ data }) => {
        if (data) setSelectedLabel(data[labelField] || '-');
      });
  }, [value, options]);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from(table)
          .select(`id, ${labelField}`)
          .order(labelField, { ascending: true })
          .limit(50);
        if (searchTerm) query = query.ilike(labelField, `%${searchTerm}%`);
        const { data, error } = await query;
        if (error) {
          console.error(`AsyncSearchableSelect error [${table}]:`, error);
          setOptions([]);
        } else {
          setOptions((data || []).map(row => ({ value: row.id, label: row[labelField] || '-' })));
        }
      } catch (e) {
        console.error('AsyncSearchableSelect fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetch, 250);
    return () => clearTimeout(timer);
  }, [isOpen, searchTerm, table, labelField]);

  const handleSelect = (option) => {
    onChange(option.value);
    setSelectedLabel(option.label);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSelectedLabel('');
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-primary',
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn('truncate flex-1', !selectedLabel && 'text-muted-foreground')}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 text-xs px-1">✕</button>
          )}
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="flex items-center px-3 py-2 border-b border-gray-100 dark:border-zinc-700">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-center text-muted-foreground">Carregando...</div>
            ) : options.length === 0 ? (
              <div className="p-3 text-sm text-center text-muted-foreground">Nenhum resultado.</div>
            ) : (
              options.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700',
                    value === option.value && 'bg-primary/5 text-primary'
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && <Check size={16} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
