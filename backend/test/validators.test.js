const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateProductPayload,
  normalizeProductPayload,
  validateStockMovementPayload,
  normalizeStockMovementPayload,
} = require('../src/validators');

const validProduct = {
  nome: 'Maçã',
  categoria: 'Fruta',
  codigo_lote: 'L20260830-01',
  data_validade: '2026-09-05',
  data_entrada: '2026-08-30',
  preco_unitario: 7.5,
  quantidade_estoque: 40,
};

test('validateProductPayload accepts a complete create payload', () => {
  assert.equal(validateProductPayload(validProduct), null);
});

test('validateProductPayload rejects a missing required field', () => {
  const { nome, ...withoutNome } = validProduct;
  assert.match(validateProductPayload(withoutNome), /nome/);
});

test('validateProductPayload rejects a malformed date', () => {
  const payload = { ...validProduct, data_validade: '05/09/2026' };
  assert.match(validateProductPayload(payload), /data_validade/);
});

test('validateProductPayload rejects an impossible calendar date', () => {
  const payload = { ...validProduct, data_validade: '2026-02-31' };
  assert.match(validateProductPayload(payload), /data_validade/);
  assert.match(validateProductPayload({ ...validProduct, data_entrada: '2026-02-30' }), /data_entrada/);
});

test('validateProductPayload rejects an expiration date before the entry date', () => {
  const payload = { ...validProduct, data_entrada: '2026-06-01', data_validade: '2026-01-01' };
  assert.match(validateProductPayload(payload), /anterior/);
});

test('validateProductPayload accepts an expiration date equal to the entry date', () => {
  const payload = { ...validProduct, data_entrada: '2026-09-05', data_validade: '2026-09-05' };
  assert.equal(validateProductPayload(payload), null);
});

test('validateProductPayload rejects a negative price', () => {
  const payload = { ...validProduct, preco_unitario: -1 };
  assert.match(validateProductPayload(payload), /preco_unitario/);
});

test('validateProductPayload rejects a non-integer stock quantity on create', () => {
  const payload = { ...validProduct, quantidade_estoque: 1.5 };
  assert.match(validateProductPayload(payload), /quantidade_estoque/);
});

test('validateProductPayload does not require lot fields on update', () => {
  const { quantidade_estoque, codigo_lote, data_validade, data_entrada, ...updatePayload } = validProduct;
  assert.equal(validateProductPayload(updatePayload, { isUpdate: true }), null);
});

// Regression found in etapa 3: etapa 1 changed the expiration date through PUT; after stock by lot the
// fields were silently ignored (HTTP 200 with nothing changed). They are now rejected with guidance.
for (const field of ['codigo_lote', 'data_validade', 'data_entrada', 'quantidade_estoque']) {
  test(`validateProductPayload rejects ${field} on update instead of ignoring it`, () => {
    const { quantidade_estoque, codigo_lote, data_validade, data_entrada, ...updatePayload } = validProduct;
    const error = validateProductPayload({ ...updatePayload, [field]: validProduct[field] ?? '2026-09-01' }, { isUpdate: true });
    assert.match(error, new RegExp(`${field} não pode ser alterado`));
    assert.match(error, /stock\/entries/);
  });
}

test('normalizeProductPayload trims strings and coerces numbers', () => {
  const normalized = normalizeProductPayload({ ...validProduct, nome: '  Maçã  ' });
  assert.equal(normalized.nome, 'Maçã');
  assert.equal(normalized.preco_unitario, 7.5);
  assert.equal(normalized.quantidade_estoque, 40);
  assert.equal(normalized.perecivel, true);
});

test('normalizeProductPayload leaves omitted quantidade_minima and localizacao undefined on update', () => {
  const { quantidade_estoque, ...updatePayload } = validProduct;
  const normalized = normalizeProductPayload(updatePayload, { isUpdate: true });
  assert.equal(normalized.quantidade_minima, undefined);
  assert.equal(normalized.localizacao, undefined);
});

test('normalizeProductPayload keeps sent quantidade_minima and turns an empty localizacao into null', () => {
  const normalized = normalizeProductPayload({ ...validProduct, quantidade_minima: 20, localizacao: '  ' });
  assert.equal(normalized.quantidade_minima, 20);
  assert.equal(normalized.localizacao, null);
});

test('validateStockMovementPayload accepts a positive integer quantity', () => {
  assert.equal(validateStockMovementPayload({ quantidade: 5 }), null);
});

test('validateStockMovementPayload rejects zero or negative quantity', () => {
  assert.match(validateStockMovementPayload({ quantidade: 0 }), /quantidade/);
  assert.match(validateStockMovementPayload({ quantidade: -3 }), /quantidade/);
});

test('validateStockMovementPayload requires a known subtipo for exits when required', () => {
  assert.match(validateStockMovementPayload({ quantidade: 5 }, { requireSubtipo: true }), /subtipo/);
  assert.equal(validateStockMovementPayload({ quantidade: 5, subtipo: 'venda' }, { requireSubtipo: true }), null);
});

test('validateStockMovementPayload rejects an unknown subtipo', () => {
  assert.match(validateStockMovementPayload({ quantidade: 5, subtipo: 'furto' }), /subtipo/);
});

test('validateProductPayload does not require lot fields on update', () => {
  const updatePayload = { nome: 'Maçã', categoria: 'Fruta', preco_unitario: 8 };
  assert.equal(validateProductPayload(updatePayload, { isUpdate: true }), null);
  assert.equal(normalizeProductPayload(updatePayload, { isUpdate: true }).codigo_lote, undefined);
});

test('validateStockMovementPayload validates optional lot dates on entries', () => {
  assert.equal(validateStockMovementPayload({ quantidade: 5, codigo_lote: 'L2', data_validade: '2026-11-01' }), null);
  assert.match(validateStockMovementPayload({ quantidade: 5, data_validade: '2026-02-31' }), /data_validade/);
  assert.match(
    validateStockMovementPayload({ quantidade: 5, data_entrada: '2026-11-02', data_validade: '2026-11-01' }),
    /anterior/
  );
});

test('normalizeStockMovementPayload maps lot fields and trims text', () => {
  const normalized = normalizeStockMovementPayload({ quantidade: '5', codigo_lote: ' L2 ', motivo: '  ' });
  assert.equal(normalized.quantidade, 5);
  assert.equal(normalized.codigoLote, 'L2');
  assert.equal(normalized.motivo, null);
  assert.equal(normalized.dataValidade, undefined);
});
