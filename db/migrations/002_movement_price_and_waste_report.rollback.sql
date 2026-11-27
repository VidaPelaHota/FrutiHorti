-- Retorno da migração 002: remove o preço e o desconto registrados nas saídas.
-- O relatório de desperdício passa a não ter como valorizar as perdas; use uma versão do backend
-- anterior ao relatório de desperdício depois do retorno.

DROP INDEX idx_movimentacao_subtipo_data ON movimentacoes_estoque;

ALTER TABLE movimentacoes_estoque
    DROP COLUMN percentual_desconto,
    DROP COLUMN preco_unitario;
