import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  currency?: string;
}

export function CurrencyInput({
  value = 0,
  onChange,
  placeholder = "0.00",
  min = 0,
  max,
  step = 0.01,
  disabled = false,
  className = "",
  id,
  currency = "USDC"
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Sincronizar o valor interno com o valor externo
  useEffect(() => {
    if (!isFocused) {
      if (value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(value.toString());
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Permitir string vazia
    if (inputValue === '') {
      onChange?.(0);
      return;
    }

    // Validar se é um número válido (incluindo decimais com zero na frente)
    const numberRegex = /^(\d+\.?\d*|\.\d+)$/;
    if (numberRegex.test(inputValue)) {
      const numericValue = parseFloat(inputValue);
      
      // Verificar limites
      if (min !== undefined && numericValue < min) {
        return;
      }
      if (max !== undefined && numericValue > max) {
        return;
      }
      
      onChange?.(numericValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Formatar o valor quando perder o foco
    if (displayValue && !isNaN(parseFloat(displayValue))) {
      const numericValue = parseFloat(displayValue);
      if (numericValue === 0) {
        setDisplayValue('');
      } else {
        // Manter o formato original se for válido
        setDisplayValue(numericValue.toString());
      }
    } else if (displayValue === '') {
      onChange?.(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de controle
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, etc.
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Permitir números
    if (/^\d$/.test(e.key)) {
      return;
    }

    // Permitir ponto decimal (apenas um)
    if (e.key === '.' && !displayValue.includes('.')) {
      return;
    }

    // Bloquear outras teclas
    e.preventDefault();
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={className}
      />
      {currency && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-sm text-gray-500">{currency}</span>
        </div>
      )}
    </div>
  );
}
