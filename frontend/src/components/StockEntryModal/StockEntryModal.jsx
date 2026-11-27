import Modal from '../Modal/Modal.jsx';
import { FormActions, LotDateInputs } from '../FormParts/FormParts.jsx';
import { formatDateOnly } from '../../utils/productStatus.js';
import { useAsyncSubmit, useFormFields } from '../../hooks/useAsyncSubmit.js';

const INITIAL_FORM = {
    quantidade: '',
    codigo_lote: '',
    data_validade: '',
    data_entrada: '',
    motivo: '',
};

function buildEntryPayload(form) {
    return {
        quantidade: Number(form.quantidade),
        codigo_lote: form.codigo_lote.trim() || undefined,
        data_validade: form.data_validade || undefined,
        data_entrada: form.data_entrada || undefined,
        motivo: form.motivo.trim() || undefined,
    };
}

const LotCodeField = ({ product, form, handleChange }) => (
    <label>
        Código do lote
        <input
            list={`lots-${product.id}`}
            placeholder="Vazio: lote mais recente"
            value={form.codigo_lote}
            onChange={handleChange('codigo_lote')}
        />
        <datalist id={`lots-${product.id}`}>
            {product.lotes.map((lot) => (
                <option key={lot.loteId} value={lot.codigoLote}>
                    Validade {formatDateOnly(lot.dataValidade)}
                </option>
            ))}
        </datalist>
    </label>
);

// An existing lot keeps its dates; a new lot code needs an expiration date.
const LotDateFields = ({ existingLot, form, handleChange }) => {
    if (existingLot) {
        return <p className="productFormHint">Lote existente, validade {formatDateOnly(existingLot.dataValidade)}.</p>;
    }

    return <LotDateInputs form={form} handleChange={handleChange} expirationRequired={Boolean(form.codigo_lote.trim())} />;
};

const StockEntryModal = ({ product, onClose, onSubmit }) => {
    const { form, handleChange } = useFormFields(INITIAL_FORM);
    const { error, submitting, handleSubmit } = useAsyncSubmit(() => onSubmit(product.id, buildEntryPayload(form)));
    const existingLot = product.lotes.find((lot) => lot.codigoLote === form.codigo_lote.trim());

    return (
        <Modal title={`Entrada por lote · ${product.nome}`} onClose={onClose}>
            <form className="productFormBody" onSubmit={handleSubmit}>
                <div className="productFormRow">
                    <label>
                        Quantidade
                        <input type="number" min="1" required value={form.quantidade} onChange={handleChange('quantidade')} />
                    </label>
                    <LotCodeField product={product} form={form} handleChange={handleChange} />
                </div>
                <LotDateFields existingLot={existingLot} form={form} handleChange={handleChange} />
                <label>
                    Motivo
                    <input value={form.motivo} onChange={handleChange('motivo')} />
                </label>

                <FormActions error={error} submitting={submitting} label="Registrar entrada" />
            </form>
        </Modal>
    );
};

export default StockEntryModal;
