import React, { useState, useEffect, useRef } from 'react';
import { DollarSign } from 'lucide-react';

/**
 * CurrencyInput - A cents-based currency input component
 *
 * Behavior:
 * - Initial state defaults to 0.00
 * - Digits are entered from the right (cents-first)
 * - Automatic comma formatting for thousands
 * - Backspace shifts numbers to the right
 * - Cursor always stays at the end
 *
 * Examples:
 * - Type "1" → Display: 0.01
 * - Type "10" → Display: 0.10
 * - Type "100" → Display: 1.00
 * - Type "1000" → Display: 10.00
 * - Type "100000" → Display: 1,000.00
 */
function CurrencyInput({
  value = 0,
  onChange,
  onBlur,
  className = '',
  placeholder = '0.00',
  required = false,
  disabled = false,
  showIcon = true,
  ...props
}) {
  // Store the value in cents (integer) for internal state
  const [centsValue, setCentsValue] = useState(Math.round((value || 0) * 100));
  const inputRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    const newCentsValue = Math.round((value || 0) * 100);
    if (newCentsValue !== centsValue) {
      setCentsValue(newCentsValue);
    }
  }, [value]);

  // Format cents value to display string with commas
  const formatCentsToDisplay = (cents) => {
    const dollars = Math.floor(Math.abs(cents) / 100);
    const centsRemainder = Math.abs(cents) % 100;
    const formattedDollars = dollars.toLocaleString('en-US');
    const formattedCents = centsRemainder.toString().padStart(2, '0');
    const sign = cents < 0 ? '-' : '';
    return `${sign}${formattedDollars}.${formattedCents}`;
  };

  const displayValue = formatCentsToDisplay(centsValue);

  const handleKeyDown = (e) => {
    const key = e.key;

    // Allow: backspace, delete, tab, escape, enter
    if (
      key === 'Backspace' ||
      key === 'Delete' ||
      key === 'Tab' ||
      key === 'Escape' ||
      key === 'Enter' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight'
    ) {
      if (key === 'Backspace') {
        e.preventDefault();
        // Shift digits to the right (divide by 10 and floor)
        const newCentsValue = Math.floor(centsValue / 10);
        setCentsValue(newCentsValue);

        // Notify parent of the change
        if (onChange) {
          onChange(newCentsValue / 100);
        }
      } else if (key === 'Delete') {
        e.preventDefault();
        // Reset to 0
        setCentsValue(0);
        if (onChange) {
          onChange(0);
        }
      }
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && (key === 'a' || key === 'c' || key === 'v' || key === 'x')) {
      return;
    }

    // Only allow digits 0-9
    if (!/^\d$/.test(key)) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    // Add the digit to the right (shift left and add new digit)
    const digit = parseInt(key);
    const newCentsValue = centsValue * 10 + digit;

    // Prevent overflow (max value: 99,999,999.99)
    if (newCentsValue > 9999999999) {
      return;
    }

    setCentsValue(newCentsValue);

    // Notify parent of the change (convert cents to dollars)
    if (onChange) {
      onChange(newCentsValue / 100);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Extract only digits from pasted text
    const digits = pastedText.replace(/\D/g, '');

    if (digits.length === 0) return;

    // Convert to cents value
    const newCentsValue = parseInt(digits) || 0;

    // Prevent overflow
    if (newCentsValue > 9999999999) {
      return;
    }

    setCentsValue(newCentsValue);

    // Notify parent of the change
    if (onChange) {
      onChange(newCentsValue / 100);
    }
  };

  const handleFocus = (e) => {
    // Move cursor to end
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      }
    }, 0);
  };

  const handleClick = (e) => {
    // Always move cursor to end on click
    if (inputRef.current) {
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      );
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const baseClassName = showIcon
    ? 'w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    : 'w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="relative">
      {showIcon && (
        <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onClick={handleClick}
        onBlur={handleBlur}
        className={`${baseClassName} ${className}`}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={false}
        {...props}
      />
    </div>
  );
}

export default CurrencyInput;
