interface CurrencyDisplayProps {
  amount: number; // in paise
  className?: string;
}

export function CurrencyDisplay({ amount, className = "" }: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount / 100);

  return <span className={`currency-symbol font-mono ${className}`}>{formatted}</span>;
}
