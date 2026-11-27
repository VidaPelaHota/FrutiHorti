import { useState } from 'react';
import './StockTable.css';

import { Plus, Minus, Trash2, PackagePlus, Power } from 'lucide-react';
import { getExpirationStatus } from '../../utils/productStatus.js';
import { describePrice } from '../../utils/currency.js';
import { EXIT_SUBTYPES } from '../../constants/catalog.js';

function useRowState() {
    const [quantity, setQuantity] = useState('');
    const [subtipo, setSubtipo] = useState('venda');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const parsedQuantity = Number(quantity);
    const isQuantityValid = Number.isInteger(parsedQuantity) && parsedQuantity > 0;

    // On failure the API message is shown and the typed quantity is kept so the user can retry.
    const runRowAction = async (action, { clearQuantity }) => {
        if (submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await action();
            if (clearQuantity) setQuantity('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const runQuantityAction = (action) => {
        if (!isQuantityValid) return;
        return runRowAction(() => action(parsedQuantity), { clearQuantity: true });
    };

    const runSimpleAction = (action) => runRowAction(action, { clearQuantity: false });

    return {
        quantity,
        setQuantity,
        subtipo,
        setSubtipo,
        submitting,
        error,
        isQuantityValid,
        runQuantityAction,
        runSimpleAction,
    };
}

function getRowClassName(product, expiration) {
    if (product.status === 'inativo') return 'stockRowInactive';
    return expiration.variant === 'expired' ? 'stockRowExpired' : '';
}

const ProductCell = ({ product }) => {
    const lotsWithStock = product.lotes.filter((lot) => lot.quantidade > 0).length;

    return (
        <td>
            <span className="stockRowName">{product.nome}</span>
            {product.codigoLote && (
                <span className="stockRowLote">
                    Lote {product.codigoLote}
                    {lotsWithStock > 1 && ` · ${lotsWithStock} lotes com saldo`}
                </span>
            )}
            {product.quantidadeVencida > 0 && (
                <span className="stockRowExpiredStock">{product.quantidadeVencida} un. em lote vencido</span>
            )}
        </td>
    );
};

// N2: the automatic discount is applied at sale time; the table shows the price the next sale will use.
const PriceCell = ({ product }) => {
    const price = describePrice(product);

    return (
        <td>
            <span className={`stockRowPrice ${price.hasDiscount ? 'discounted' : ''}`}>{price.current}</span>
            {price.hasDiscount && (
                <span className="stockRowPriceOriginal">
                    {price.original} <span className="stockRowDiscountBadge">{price.badge}</span>
                </span>
            )}
        </td>
    );
};

const ExpirationCell = ({ product, expiration }) => {
    if (product.status === 'inativo') {
        return (
            <td>
                <span className="stockRowExpiration inactive">Inativo</span>
            </td>
        );
    }

    return (
        <td>
            <span className={`stockRowExpiration ${expiration.variant}`}>{expiration.label}</span>
        </td>
    );
};

const MovementControls = ({ product, row, onEntry, onExit }) => (
    <>
        <input
            type="number"
            min="1"
            className="stockRowQuantityInput"
            placeholder="Qtd"
            value={row.quantity}
            onChange={(event) => row.setQuantity(event.target.value)}
        />

        <select
            className="stockRowSubtypeSelect"
            value={row.subtipo}
            onChange={(event) => row.setSubtipo(event.target.value)}
            title="Motivo da saída"
        >
            {EXIT_SUBTYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>

        <button
            type="button"
            className="stockRowActionButton entry"
            disabled={!row.isQuantityValid || row.submitting}
            onClick={() => row.runQuantityAction((qty) => onEntry(product.id, { quantidade: qty }))}
            title="Registrar entrada no lote mais recente"
        >
            <Plus size={14} />
        </button>

        <button
            type="button"
            className="stockRowActionButton exit"
            disabled={!row.isQuantityValid || row.submitting}
            onClick={() => row.runQuantityAction((qty) => onExit(product.id, { quantidade: qty, subtipo: row.subtipo }))}
            title="Registrar saída (lote de validade mais próxima primeiro)"
        >
            <Minus size={14} />
        </button>
    </>
);

const ProductControls = ({ product, row, onDelete, onLotEntry, onToggleActive }) => {
    const isInactive = product.status === 'inativo';

    return (
        <>
            <button
                type="button"
                className="stockRowActionButton lotEntry"
                disabled={row.submitting}
                onClick={() => onLotEntry(product)}
                title="Registrar entrada por lote"
            >
                <PackagePlus size={14} />
            </button>

            <button
                type="button"
                className={`stockRowActionButton ${isInactive ? 'activate' : 'deactivate'}`}
                disabled={row.submitting}
                onClick={() => row.runSimpleAction(() => onToggleActive(product))}
                title={isInactive ? "Reativar produto" : "Inativar produto"}
            >
                <Power size={14} />
            </button>

            <button
                type="button"
                className="stockRowActionButton delete"
                disabled={row.submitting}
                onClick={() => row.runSimpleAction(() => onDelete(product.id))}
                title="Excluir produto"
            >
                <Trash2 size={14} />
            </button>
        </>
    );
};

const ActionsCell = ({ product, onEntry, onExit, onDelete, onLotEntry, onToggleActive }) => {
    const row = useRowState();

    return (
        <td>
            <div className="stockRowActions">
                <MovementControls product={product} row={row} onEntry={onEntry} onExit={onExit} />
                <ProductControls
                    product={product}
                    row={row}
                    onDelete={onDelete}
                    onLotEntry={onLotEntry}
                    onToggleActive={onToggleActive}
                />
            </div>

            {row.error && (
                <p className="stockRowError" role="alert">{row.error}</p>
            )}
        </td>
    );
};

const StockTableRow = ({ product, ...handlers }) => {
    const expiration = getExpirationStatus(product);

    return (
        <tr className={getRowClassName(product, expiration)}>
            <ProductCell product={product} />
            <td>{product.categoria}</td>
            <PriceCell product={product} />
            <ExpirationCell product={product} expiration={expiration} />
            <td>{product.quantidadeEstoque}</td>
            <ActionsCell product={product} {...handlers} />
        </tr>
    );
};

const StockTable = ({ products, onEntry, onExit, onDelete, onLotEntry, onToggleActive }) => {
    if (products.length === 0) {
        return <p className="stockTableEmpty">Nenhum produto encontrado.</p>;
    }

    return (
        <table className="stockTable">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Validade</th>
                    <th>Estoque</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {products.map((product) => (
                    <StockTableRow
                        key={product.id}
                        product={product}
                        onEntry={onEntry}
                        onExit={onExit}
                        onDelete={onDelete}
                        onLotEntry={onLotEntry}
                        onToggleActive={onToggleActive}
                    />
                ))}
            </tbody>
        </table>
    );
};

export default StockTable;
