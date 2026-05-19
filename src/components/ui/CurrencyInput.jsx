import { useState, useEffect } from 'react';

export default function CurrencyInput({ value, onChange, onValueChange, error, ...props }) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === undefined || value === null) {
      setDisplayValue('');
      return;
    }
    if (typeof value === 'number') {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleChange = (e) => {
    let inputValue = e.target.value;
    
    // Remove tudo exceto números
    const numericValue = inputValue.replace(/\D/g, '');
    
    if (numericValue === '') {
      setDisplayValue('');
      onChange(null);
      return;
    }

    // Transforma em float com 2 casas decimais
    const floatValue = parseInt(numericValue, 10) / 100;
    
    setDisplayValue(formatCurrency(floatValue));
    const handler = onValueChange || onChange;
    if (handler) handler(floatValue);
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
        error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
      }`}
      placeholder="R$ 0,00"
      {...props}
    />
  );
}
