import '../ProductFormModal/ProductFormModal.css';

import { X } from 'lucide-react';

// Overlay, title and close button shared by every modal form.
const Modal = ({ title, onClose, children }) => (
    <div className="productFormOverlay" onClick={onClose}>
        <div className="productFormModal" onClick={(event) => event.stopPropagation()}>
            <div className="productFormHeader">
                <h2>{title}</h2>
                <button type="button" className="productFormClose" onClick={onClose} aria-label="Fechar">
                    <X size={18} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default Modal;
