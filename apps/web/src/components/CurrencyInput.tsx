import React, { useState, useEffect, type ChangeEvent } from 'react';

interface CurrencyInputProps {
    value: number | string;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    id?: string;
    autoFocus?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    placeholder,
    className = "",
    disabled = false,
    required = false,
    name,
    id,
    autoFocus
}) => {
    // Determine initial display value
    const formatValue = (val: number | string) => {
        if (val === '' || val === 0 || val === '0') return '';
        const numVal = typeof val === 'string' ? parseInt(val, 10) : val;
        if (isNaN(numVal)) return '';
        // Format with dots (ID locale uses dots for thousands)
        return numVal.toLocaleString('id-ID').replace(/,/g, '.'); // Ensure dots are used if locale differs slightly in some envs, though id-ID usually uses dots
    };

    const [displayValue, setDisplayValue] = useState(formatValue(value));

    // Update internal state if external value changes significantly
    useEffect(() => {
        const numericDisplay = displayValue.replace(/\./g, '');
        const currentInt = parseInt(numericDisplay || '0', 10);
        const propInt = typeof value === 'string' ? parseInt(value, 10) : value;

        // Only update if they differ (avoid cursor jumping issues loop, though simplistic here)
        if (currentInt !== propInt && !isNaN(propInt)) {
            setDisplayValue(formatValue(propInt));
        } else if (value === '' || value === 0) {
            setDisplayValue('');
        }
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Remove all non-digit characters
        const cleanValue = inputValue.replace(/\D/g, '');

        if (cleanValue === '') {
            setDisplayValue('');
            onChange(0);
            return;
        }

        const intValue = parseInt(cleanValue, 10);

        // Update parent with number
        onChange(intValue);

        // Update display with dots
        const formatted = intValue.toLocaleString('id-ID');
        setDisplayValue(formatted);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            required={required}
            name={name}
            id={id}
            autoFocus={autoFocus}
            autoComplete="off"
        />
    );
};

export default CurrencyInput;
