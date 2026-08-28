const http = require('http');
const fs = require('fs');
const path = require('path');
const { initDatabase, listProducts, createProduct, updateProduct, deleteProduct } = require('./database');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3000;
const frontendIndexPath = path.join(__dirname, '..', '..', 'frontend', 'index.html');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(html);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let rawData = '';

    req.on('data', (chunk) => {
      rawData += chunk;
    });

    req.on('end', () => {
      if (!rawData) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawData));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', () => {
      reject(new Error('Failed to read request body'));
    });
  });
}

function validateProductPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Payload is required';
  }

  const requiredFields = ['nome', 'categoria', 'preco_unitario', 'quantidade_estoque', 'codigo_lote', 'data_validade'];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      return `Field ${field} is required`;
    }
  }

  const price = Number(payload.preco_unitario);
  const stock = Number(payload.quantidade_estoque);

  if (!Number.isFinite(price) || price < 0) {
    return 'preco_unitario must be a positive number';
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return 'quantidade_estoque must be a non-negative integer';
  }

  return null;
}

function normalizeProductPayload(payload) {
  return {
    nome: String(payload.nome).trim(),
    categoria: String(payload.categoria).trim(),
    preco_unitario: Number(payload.preco_unitario),
    quantidade_estoque: Number(payload.quantidade_estoque),
    codigo_lote: String(payload.codigo_lote).trim(),
    data_validade: String(payload.data_validade).trim(),
    data_entrada: payload.data_entrada ? String(payload.data_entrada).trim() : undefined,
    perecivel: payload.perecivel !== false
  };
}

initDatabase();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (url.pathname === '/' && req.method === 'GET') {
    try {
      const html = fs.readFileSync(frontendIndexPath, 'utf8');
      return sendHtml(res, 200, html);
    } catch (error) {
      return sendJson(res, 500, { error: 'Failed to load frontend page' });
    }
  }

  if (url.pathname === '/health' && req.method === 'GET') {
    return sendJson(res, 200, { status: 'ok', service: 'frutihorti-backend' });
  }

  if (url.pathname === '/products' && req.method === 'GET') {
    try {
      const products = listProducts();
      return sendJson(res, 200, { items: products });
    } catch (error) {
      return sendJson(res, 500, { error: 'Failed to load products' });
    }
  }

  if (url.pathname === '/products' && req.method === 'POST') {
    parseJsonBody(req)
      .then((body) => {
        const validationError = validateProductPayload(body);
        if (validationError) {
          return sendJson(res, 400, { error: validationError });
        }

        const created = createProduct(normalizeProductPayload(body));
        return sendJson(res, 201, { item: created });
      })
      .catch((error) => {
        return sendJson(res, 400, { error: error.message });
      });
    return;
  }

  if (url.pathname.startsWith('/products/') && req.method === 'PUT') {
    const productId = Number(url.pathname.split('/')[2]);

    if (!Number.isInteger(productId) || productId <= 0) {
      return sendJson(res, 400, { error: 'Invalid product id' });
    }

    parseJsonBody(req)
      .then((body) => {
        const validationError = validateProductPayload(body);
        if (validationError) {
          return sendJson(res, 400, { error: validationError });
        }

        const updated = updateProduct(productId, normalizeProductPayload(body));
        if (!updated) {
          return sendJson(res, 404, { error: 'Product not found' });
        }

        return sendJson(res, 200, { item: updated });
      })
      .catch((error) => {
        return sendJson(res, 400, { error: error.message });
      });
    return;
  }

  if (url.pathname.startsWith('/products/') && req.method === 'DELETE') {
    const productId = Number(url.pathname.split('/')[2]);

    if (!Number.isInteger(productId) || productId <= 0) {
      return sendJson(res, 400, { error: 'Invalid product id' });
    }

    try {
      const removed = deleteProduct(productId);
      if (!removed) {
        return sendJson(res, 404, { error: 'Product not found' });
      }

      return sendJson(res, 200, { deleted: true });
    } catch (error) {
      return sendJson(res, 500, { error: 'Failed to delete product' });
    }
  }

  return sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
