import './HomePage.css';

import TitleLayout from "../../layouts/TitleLayout/TitleLayout.jsx";
import SearchLayout from "../../layouts/SearchLayout/SearchLayout.jsx";
import FoodCard from "../../components/FoodCard/FoodCard.jsx";
import FooterLayout from '../../layouts/FooterLayout/FooterLayout.jsx';

import { Text } from "../../styles/globalStyles.js";
import { listProducts } from "../../services/productsApi.js";
import { useProductList } from "../../hooks/useProductList.js";

const HomePage = () => {
    const { filteredProducts, loading, error, search, setSearch, category, setCategory } = useProductList(listProducts);
    const isReady = !loading && !error;

    return (
        <div className="homepageApp">
            <TitleLayout/>
            <SearchLayout
                searchValue={search}
                onSearchChange={setSearch}
                activeCategory={category}
                onCategoryChange={setCategory}
            />

            {loading && <Text className="homepageStatus" fontSize="1.2rem">Carregando produtos...</Text>}

            {!loading && error && (
                <Text className="homepageStatus" fontSize="1.2rem" color="var(--solid-red)">
                    Não foi possível carregar os produtos: {error}
                </Text>
            )}

            {isReady && filteredProducts.length === 0 && (
                <Text className="homepageStatus" fontSize="1.2rem">Nenhum produto encontrado.</Text>
            )}

            {isReady && filteredProducts.length > 0 && (
                <div className="productGrid">
                    {filteredProducts.map((product) => (
                        <FoodCard key={product.id} {...product} />
                    ))}
                </div>
            )}

            <FooterLayout />
        </div>
    )
}

export default HomePage;
