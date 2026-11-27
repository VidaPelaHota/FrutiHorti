// Sales and losses in a period, with the price recorded on each exit and the product's current price
// as a fallback for exits recorded before prices were stored (migration 002).
async function listExitMovements(executor, { start, end }) {
  const [rows] = await executor.execute(
    `SELECT m.produto_id, p.nome, c.nome AS categoria, m.subtipo, m.quantidade,
            m.preco_unitario, m.percentual_desconto, p.preco_unitario AS preco_atual
     FROM movimentacoes_estoque m
     INNER JOIN produtos p ON p.id = m.produto_id
     INNER JOIN categorias c ON c.id = p.categoria_id
     WHERE m.tipo = 'saida'
       AND m.subtipo IN ('perda', 'venda')
       AND m.data_movimentacao >= ?
       AND m.data_movimentacao < ?
     ORDER BY m.produto_id ASC, m.id ASC`,
    [start, end]
  );
  return rows;
}

module.exports = { listExitMovements };
