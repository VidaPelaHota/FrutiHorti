import { useState } from 'react';
import './Stock.css';

import { Package, Apple, Ban, Plus, BadgePercent } from "lucide-react";

import SearchLayout from "../../layouts/SearchLayout/SearchLayout";
import Button from "../../components/Button/Button";
import InfoCard from "../../components/InfoCard/InfoCard";
import StockTable from "../../components/StockTable/StockTable.jsx";
import ProductFormModal from "../../components/ProductFormModal/ProductFormModal.jsx";
import StockEntryModal from "../../components/StockEntryModal/StockEntryModal.jsx";

import { Text } from "../../styles/globalStyles";
import { useProductList } from "../../hooks/useProductList.js";
import { summarizeStock } from "../../utils/stockSummary.js";

import {
    getStockSummary,
    createProduct,
    registerStockEntry,
    registerStockExit,
    deleteProduct,
    activateProduct,
    deactivateProduct,
} from "../../services/productsApi.js";

const DELETE_CONFIRMATION =
    "Excluir este produto? Se ele tiver movimentações de estoque, será inativado e o histórico será mantido.";

const StockHeader = ({ onNewProduct }) => (
    <div className="stockTitle">
        <div className="titleText">
            <Text fontSize="2.4rem" fontFamily="Lora, serif" fontWeight="bold">
                Gestão de estoque
            </Text>
            <Text fontSize="1.2rem">
                Controle lotes, quantidades e validade dos produtos da loja.
            </Text>
        </div>
        <Button icon={<Plus size={16} />} label="Novo produto" onClick={onNewProduct} />
    </div>
);

const StockCounters = ({ products }) => {
    const summary = summarizeStock(products);

    return (
        <div className="stockCards">
            <InfoCard icon={<Package size={20} />} title="Produtos" content={summary.totalProducts} variant="default" />
            <InfoCard icon={<Apple size={20} />} title="Próximos do vencimento" content={summary.expiringSoonCount} variant="warning" />
            <InfoCard icon={<BadgePercent size={20} />} title="Com desconto" content={summary.discountedCount} variant="warning" />
            <InfoCard icon={<Ban size={20} />} title="Vencidos" content={summary.expiredCount} variant="danger" />
        </div>
    );
};

// Every handler reloads the stock afterwards; errors they throw are shown next to the product row.
function useStockActions(reload, closeModals) {
    const withReload = (action) => async (...args) => {
        await action(...args);
        await reload();
    };

    return {
        create: withReload(async (payload) => { await createProduct(payload); closeModals(); }),
        entry: withReload(registerStockEntry),
        exit: withReload(registerStockExit),
        lotEntry: withReload(async (id, payload) => { await registerStockEntry(id, payload); closeModals(); }),
        toggleActive: withReload((product) =>
            product.status === 'inativo' ? activateProduct(product.id) : deactivateProduct(product.id)
        ),
        remove: async (id) => {
            if (!window.confirm(DELETE_CONFIRMATION)) return;
            await deleteProduct(id);
            await reload();
        },
    };
}

const Stock = () => {
    const list = useProductList(getStockSummary);
    const [isModalOpen, setModalOpen] = useState(false);
    const [lotEntryProduct, setLotEntryProduct] = useState(null);
    const actions = useStockActions(list.reload, () => { setModalOpen(false); setLotEntryProduct(null); });

    return (
        <div className="stockApp">
            <StockHeader onNewProduct={() => setModalOpen(true)} />
            <StockCounters products={list.products} />

            <SearchLayout
                searchValue={list.search}
                onSearchChange={list.setSearch}
                activeCategory={list.category}
                onCategoryChange={list.setCategory}
            />

            <div className="stockTableWrapper">
                {list.loading && <Text fontSize="1.2rem">Carregando estoque...</Text>}
                {!list.loading && list.error && (
                    <Text fontSize="1.2rem" color="var(--solid-red)">Não foi possível carregar o estoque: {list.error}</Text>
                )}
                {!list.loading && !list.error && (
                    <StockTable
                        products={list.filteredProducts}
                        onEntry={actions.entry}
                        onExit={actions.exit}
                        onDelete={actions.remove}
                        onLotEntry={setLotEntryProduct}
                        onToggleActive={actions.toggleActive}
                    />
                )}
            </div>

            {isModalOpen && <ProductFormModal onClose={() => setModalOpen(false)} onSubmit={actions.create} />}
            {lotEntryProduct && (
                <StockEntryModal product={lotEntryProduct} onClose={() => setLotEntryProduct(null)} onSubmit={actions.lotEntry} />
            )}
        </div>
    )
}

export default Stock;
