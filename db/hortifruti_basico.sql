-- Modelo SQL simples para um hortifrúti de bairro
-- Contexto: produtos perecíveis e alta rotatividade

CREATE TABLE categorias (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lotes (
    id INTEGER PRIMARY KEY,
    codigo_lote VARCHAR(30) NOT NULL UNIQUE,
    data_entrada DATE NOT NULL,
    data_validade DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE produtos (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria_id INTEGER NOT NULL,
    lote_id INTEGER NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    quantidade_estoque INTEGER NOT NULL,
    perecivel BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id)
);

CREATE TABLE vendas (
    id INTEGER PRIMARY KEY,
    data_venda DATE NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Dados iniciais de exemplo
INSERT INTO categorias (id, nome, descricao) VALUES
(1, 'Fruta', 'Frutas frescas de alta saída'),
(2, 'Legume', 'Legumes para consumo diário'),
(3, 'Verdura', 'Verduras folhosas perecíveis');

INSERT INTO lotes (id, codigo_lote, data_entrada, data_validade) VALUES
(1, 'L20260821-01', '2026-08-21', '2026-08-28'),
(2, 'L20260821-02', '2026-08-21', '2026-08-25'),
(3, 'L20260821-03', '2026-08-21', '2026-08-23');

INSERT INTO produtos (id, nome, categoria_id, lote_id, preco_unitario, quantidade_estoque, perecivel) VALUES
(1, 'Banana Prata', 1, 1, 6.50, 120, TRUE),
(2, 'Tomate', 2, 2, 8.90, 90, TRUE),
(3, 'Alface Crespa', 3, 3, 3.50, 60, TRUE);

INSERT INTO vendas (id, data_venda, produto_id, quantidade, valor_total) VALUES
(1, '2026-08-21', 1, 12, 78.00),
(2, '2026-08-21', 2, 8, 71.20),
(3, '2026-08-21', 3, 10, 35.00);
