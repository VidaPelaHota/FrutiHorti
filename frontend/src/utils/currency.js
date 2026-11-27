const CURRENCY_FORMAT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCurrency(value) {
    return CURRENCY_FORMAT.format(Number(value) || 0);
}

// Price line shown to the customer and on the stock screen; the discount comes from the API (N2).
export function describePrice({ precoUnitario, precoComDesconto, percentualDesconto }) {
    const hasDiscount = percentualDesconto > 0;
    return {
        hasDiscount,
        current: formatCurrency(hasDiscount ? precoComDesconto : precoUnitario),
        original: hasDiscount ? formatCurrency(precoUnitario) : null,
        badge: hasDiscount ? `-${percentualDesconto}%` : null,
    };
}
