import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Phone, Check } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function PhoneInput({ value, onChange, error, className }: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  // Count only digits
  const digitCount = value.replace(/\D/g, '').length;
  const isComplete = digitCount === 11;
  const progress = Math.min((digitCount / 11) * 100, 100);
  
  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '');
    let formatted = '';
    
    if (digits.length >= 1) {
      formatted = '(' + digits.slice(0, 2);
    }
    if (digits.length >= 3) {
      formatted += ') ' + digits.slice(2, 7);
    }
    if (digits.length >= 8) {
      formatted += '-' + digits.slice(7, 11);
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatPhone(rawValue);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Icon */}
        <Phone 
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200",
            isComplete ? "text-green-500" : isFocused ? "text-primary" : "text-muted-foreground"
          )} 
        />
        
        {/* Input */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder="(00) 00000-0000"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={15}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background pl-10 pr-10 py-2 text-base ring-offset-background",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
            isComplete 
              ? "border-green-500 focus-visible:ring-green-500" 
              : error 
                ? "border-destructive focus-visible:ring-destructive" 
                : "border-input focus-visible:ring-ring",
            className
          )}
        />
        
        {/* Check icon when complete */}
        {isComplete && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-200">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      {isFocused && !isComplete && digitCount > 0 && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {11 - digitCount} {11 - digitCount === 1 ? 'dígito restante' : 'dígitos restantes'}
          </p>
        </div>
      )}
      
      {/* Success message */}
      {isComplete && !error && (
        <p className="text-xs text-green-500 animate-in fade-in slide-in-from-top-1 duration-200 flex items-center gap-1">
          <Check className="w-3 h-3" />
          WhatsApp válido
        </p>
      )}
      
      {/* Error message */}
      {error && !isComplete && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
