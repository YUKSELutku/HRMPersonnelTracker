// Path: NextFrontend/src/hooks/useDebounce.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce a value. Useful for search inputs to avoid
 * firing API calls on every keystroke.
 *
 * Usage:
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *   useEffect(() => { api.search(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
} 