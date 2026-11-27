import { describe, expect, it } from 'vitest';
import { filterProducts, summarizeStock } from '../stockSummary.js';

const product = (overrides) => ({
    nome: 'Banana',
    categoria: 'Fruta',
    status: 'ativo',
    quantidadeVencida: 0,
    proximoDoVencimento: false,
    percentualDesconto: 0,
    ...overrides,
});

describe('summarizeStock', () => {
    it('counts active, expiring, discounted and expired products, ignoring inactive ones', () => {
        const summary = summarizeStock([
            product({}),
            product({ proximoDoVencimento: true, percentualDesconto: 30 }),
            product({ status: 'vencido', quantidadeVencida: 5, proximoDoVencimento: true }),
            product({ status: 'inativo', quantidadeVencida: 9, percentualDesconto: 50 }),
        ]);

        expect(summary).toEqual({ totalProducts: 3, expiringSoonCount: 1, discountedCount: 1, expiredCount: 1 });
    });

    it('counts a product with an expired lot and a valid lot as having expired stock', () => {
        expect(summarizeStock([product({ quantidadeVencida: 2 })]).expiredCount).toBe(1);
    });
});

describe('filterProducts', () => {
    const products = [product({ nome: 'Banana Prata' }), product({ nome: 'Alface', categoria: 'Verdura' })];

    it('filters by category and by name, ignoring case and surrounding spaces', () => {
        expect(filterProducts(products, { search: '  BANANA ', category: 'Todas', allCategories: 'Todas' })).toHaveLength(1);
        expect(filterProducts(products, { search: '', category: 'Verdura', allCategories: 'Todas' })[0].nome).toBe('Alface');
    });

    it('returns everything for the "Todas" category and an empty search', () => {
        expect(filterProducts(products, { search: '', category: 'Todas', allCategories: 'Todas' })).toHaveLength(2);
    });
});
