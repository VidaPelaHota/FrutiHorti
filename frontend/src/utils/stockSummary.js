// Counters on the stock screen. Inactive products stay in the table (to be reactivated) but out of the counters.
export function summarizeStock(products) {
    const activeProducts = products.filter((product) => product.status !== 'inativo');

    return {
        totalProducts: activeProducts.length,
        expiredCount: activeProducts.filter((product) => product.quantidadeVencida > 0).length,
        expiringSoonCount: activeProducts.filter(
            (product) => product.status !== 'vencido' && product.proximoDoVencimento
        ).length,
        discountedCount: activeProducts.filter((product) => product.percentualDesconto > 0).length,
    };
}

export function filterProducts(products, { search, category, allCategories }) {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
        const matchesCategory = category === allCategories || product.categoria === category;
        const matchesSearch = product.nome.toLowerCase().includes(normalizedSearch);
        return matchesCategory && matchesSearch;
    });
}
