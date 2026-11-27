-- Migração 002: preço e desconto registrados em cada saída (N2 desconto automático / N3 relatório de desperdício)
-- Cada saída guarda o preço de lista do produto no momento e o percentual de desconto aplicado,
-- para o relatório mensal valorizar perdas e vendas com o preço da época, não com o preço atual.
-- Movimentações antigas ficam com NULL; o relatório usa o preço atual do produto para elas e avisa.
-- Retorno: db/migrations/002_movement_price_and_waste_report.rollback.sql
-- Pré-requisito: 001_stock_by_lot.sql. Faça backup antes de aplicar (mysqldump).

ALTER TABLE movimentacoes_estoque
    ADD COLUMN preco_unitario DECIMAL(10,2) DEFAULT NULL AFTER quantidade_atual,
    ADD COLUMN percentual_desconto DECIMAL(5,2) DEFAULT NULL AFTER preco_unitario;

-- O relatório mensal filtra saídas por subtipo e período.
CREATE INDEX idx_movimentacao_subtipo_data ON movimentacoes_estoque (subtipo, data_movimentacao);
