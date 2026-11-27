import Button from '../Button/Button.jsx';

// Expiration and entry dates of a lot, used by the product form and the stock entry form.
export const LotDateInputs = ({ form, handleChange, expirationRequired = true }) => (
    <div className="productFormRow">
        <label>
            Data de validade
            <input type="date" required={expirationRequired} value={form.data_validade} onChange={handleChange('data_validade')} />
        </label>
        <label>
            Data de entrada
            <input type="date" value={form.data_entrada} onChange={handleChange('data_entrada')} />
        </label>
    </div>
);

// API error (kept until the next attempt) and the submit button, disabled while saving.
export const FormActions = ({ error, submitting, label }) => (
    <>
        {error && <p className="productFormError" role="alert">{error}</p>}
        <div className="productFormFooter">
            <Button type="submit" disabled={submitting} label={submitting ? "Salvando..." : label} />
        </div>
    </>
);
