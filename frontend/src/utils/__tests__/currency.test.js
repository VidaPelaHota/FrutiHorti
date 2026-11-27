import { describe, expect, it } from 'vitest';
import { describePrice, formatCurrency } from '../currency.js';

// Intl formats BRL with a non-breaking space after "R$".
const normalize = (text) => text.replace(/\s/g, ' ');

describe('formatCurrency', () => {
    it('formats reais with comma decimals', () => {
        expect(normalize(formatCurrency(6.5))).toBe('R$ 6,50');
    });

    it('treats a missing value as zero', () => {
        expect(normalize(formatCurrency(undefined))).toBe('R$ 0,00');
    });
});

describe('describePrice (N2 automatic discount)', () => {
    it('shows the discounted price, the struck original and the badge', () => {
        const price = describePrice({ precoUnitario: 10, precoComDesconto: 7, percentualDesconto: 30 });
        expect(price.hasDiscount).toBe(true);
        expect(normalize(price.current)).toBe('R$ 7,00');
        expect(normalize(price.original)).toBe('R$ 10,00');
        expect(price.badge).toBe('-30%');
    });

    it('shows only the list price without a discount', () => {
        const price = describePrice({ precoUnitario: 8.9, precoComDesconto: 8.9, percentualDesconto: 0 });
        expect(price.hasDiscount).toBe(false);
        expect(normalize(price.current)).toBe('R$ 8,90');
        expect(price.original).toBeNull();
        expect(price.badge).toBeNull();
    });
});
