import { describe, expect, it } from 'vitest';
import { formatDateOnly, getExpirationStatus } from '../productStatus.js';

describe('formatDateOnly', () => {
    it('formats YYYY-MM-DD as DD/MM/YYYY without going through Date (no time zone shift)', () => {
        expect(formatDateOnly('2026-09-20')).toBe('20/09/2026');
    });

    it('returns an empty string for a missing date', () => {
        expect(formatDateOnly(null)).toBe('');
    });
});

describe('getExpirationStatus', () => {
    it('labels expired, today, tomorrow and later dates', () => {
        expect(getExpirationStatus({ diasParaVencer: -1 }).variant).toBe('expired');
        expect(getExpirationStatus({ diasParaVencer: 0, status: 'vencido' })).toEqual({ variant: 'expired', label: 'Vence hoje' });
        expect(getExpirationStatus({ diasParaVencer: 1, proximoDoVencimento: true }).label).toBe('Vence amanhã');
        expect(getExpirationStatus({ diasParaVencer: 3, proximoDoVencimento: true }).label).toBe('Vence em 3 dias');
        expect(getExpirationStatus({ diasParaVencer: 10, dataValidade: '2026-12-07' }).label).toBe('Válido até 07/12/2026');
    });
});
