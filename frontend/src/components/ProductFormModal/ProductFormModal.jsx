import './ProductFormModal.css';

import Modal from '../Modal/Modal.jsx';
import { FormActions, LotDateInputs } from '../FormParts/FormParts.jsx';
import { PRODUCT_CATEGORIES } from '../../constants/catalog.js';
import { useAsyncSubmit, useFormFields } from '../../hooks/useAsyncSubmit.js';

const INITIAL_FORM = {
    nome: '',
    categoria: PRODUCT_CATEGORIES[0],
    codigo_lote: '',
    data_validade: '',
    data_entrada: '',
    preco_unitario: '',
    quantidade_estoque: '',
    quantidade_minima: '0',
};

function buildProductPayload(form) {
    return {
        ...form,
        preco_unitario: Number(form.preco_unitario),
        quantidade_estoque: Number(form.quantidade_estoque),
        quantidade_minima: Number(form.quantidade_minima || 0),
        data_entrada: form.data_entrada || undefined,
    };
}

const LotFields = ({ form, handleChange }) => (
    <>
        <label>
            Código do lote
            <input required value={form.codigo_lote} onChange={handleChange('codigo_lote')} />
        </label>
        <LotDateInputs form={form} handleChange={handleChange} />
    </>
);

const StockFields = ({ form, handleChange }) => (
    <>
        <div className="productFormRow">
            <label>
                Preço unitário (R$)
                <input type="number" step="0.01" min="0" required value={form.preco_unitario} onChange={handleChange('preco_unitario')} />
            </label>
            <label>
                Quantidade inicial
                <input type="number" min="0" required value={form.quantidade_estoque} onChange={handleChange('quantidade_estoque')} />
            </label>
        </div>
        <label>
            Estoque mínimo
            <input type="number" min="0" value={form.quantidade_minima} onChange={handleChange('quantidade_minima')} />
        </label>
    </>
);

const ProductFormModal = ({ onClose, onSubmit }) => {
    const { form, handleChange } = useFormFields(INITIAL_FORM);
    const { error, submitting, handleSubmit } = useAsyncSubmit(() => onSubmit(buildProductPayload(form)));

    return (
        <Modal title="Novo produto" onClose={onClose}>
            <form className="productFormBody" onSubmit={handleSubmit}>
                <label>
                    Nome
                    <input required value={form.nome} onChange={handleChange('nome')} />
                </label>
                <label>
                    Categoria
                    <select value={form.categoria} onChange={handleChange('categoria')}>
                        {PRODUCT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </label>
                <LotFields form={form} handleChange={handleChange} />
                <StockFields form={form} handleChange={handleChange} />

                <FormActions error={error} submitting={submitting} label="Salvar produto" />
            </form>
        </Modal>
    );
};

export default ProductFormModal;
