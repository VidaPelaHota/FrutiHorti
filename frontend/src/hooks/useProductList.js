import { useCallback, useEffect, useMemo, useState } from 'react';
import { ALL_CATEGORIES } from '../constants/catalog.js';
import { mapProductFromApi } from '../services/productsApi.js';
import { filterProducts } from '../utils/stockSummary.js';

// Loading, error and search/category filtering shared by the catalog (HomePage) and the stock screen.
export function useProductList(fetchProducts) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState(ALL_CATEGORIES);

    const reload = useCallback(() => {
        return fetchProducts()
            .then((items) => {
                setProducts(items.map(mapProductFromApi));
                setError(null);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [fetchProducts]);

    useEffect(() => {
        reload();
    }, [reload]);

    const filteredProducts = useMemo(
        () => filterProducts(products, { search, category, allCategories: ALL_CATEGORIES }),
        [products, category, search]
    );

    return { products, filteredProducts, loading, error, search, setSearch, category, setCategory, reload };
}
