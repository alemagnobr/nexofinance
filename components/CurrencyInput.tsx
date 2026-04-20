import React from 'react';

// Formata um número (em centavos ou valor float) para string "R$ 1.234,56" ou "1.234,56"
export const formatCurrencyValue = (value: string | number) => {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  const number = parseFloat(digits) / 100;
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
};

export const parseCurrencyValue = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return parseFloat(digits) / 100;
};

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onChangeValue: (value: string) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChangeValue, ...props }) => {
  
  const displayValue = React.useMemo(() => {
    if (value === '' || value === undefined || value === null) return '';
    if (typeof value === 'number') {
       return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    }
    // se já vem com vírgula (string formatada manual ou float em string)
    if (value.includes(',')) return value;
    // se for string convertível
    const num = parseFloat(value);
    if (!isNaN(num)) {
       return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    }
    return value;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    // Tratamento especial para apagar tudo
    if (rawValue === '') {
      onChangeValue('');
      return;
    }

    const formatted = formatCurrencyValue(rawValue);
    // Para atualizar o pai passando o valor formatado (ex: "1.234,00") ou o número limpo.
    // O padrão aqui nos outros forms era string float "1234.00".
    // Mas pra não quebrar as lógicas de parsing (parseFloat(val) que o app js faz muito), 
    // precisaremos passar o numérico como string na porta do componente base ou adaptar.
    // Como a maioria dos componentes espera string "100.50", vamos chamar onchange com esse formato.
    const numValue = parseCurrencyValue(rawValue);
    onChangeValue(numValue.toString());
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onBlur) props.onBlur(e);
  };

  // Precisamos renderizar no input o valor exibível
  return (
    <input 
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
