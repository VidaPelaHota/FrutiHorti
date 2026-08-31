import './HomePage.css';

import TitleLayout from "../../layouts/TitleLayout/TitleLayout.jsx";
import SearchLayout from "../../layouts/SearchLayout/SearchLayout.jsx";
import FoodCard from "../../components/FoodCard/FoodCard.jsx";

const mockProducts = [
    { id: 1, nome: "Banana Prata", categoria: "Fruta", quantidadeEstoque: 42, dataValidade: "2026-09-05" },
    { id: 2, nome: "Maçã Gala", categoria: "Fruta", quantidadeEstoque: 30, dataValidade: "2026-09-12" },
    { id: 3, nome: "Morango", categoria: "Fruta", quantidadeEstoque: 8, dataValidade: "2026-09-02" },
    { id: 4, nome: "Cenoura", categoria: "Legume", quantidadeEstoque: 55, dataValidade: "2026-09-08" },
    { id: 5, nome: "Alface Crespa", categoria: "Verdura", quantidadeEstoque: 20, dataValidade: "2026-09-01" },
    { id: 6, nome: "Couve Manteiga", categoria: "Verdura", quantidadeEstoque: 18, dataValidade: "2026-09-04" },
    { id: 7, nome: "Feijão Carioca", categoria: "Grão", quantidadeEstoque: 60, dataValidade: "2027-02-26" },
    { id: 8, nome: "Tomate Italiano", categoria: "Legume", quantidadeEstoque: 0, dataValidade: "2026-08-20" },
    { id: 9, nome: "Arroz Integral", categoria: "Grão", quantidadeEstoque: 0, dataValidade: "2026-08-18" },
];

const HomePage = () => {
    return (
        <div className="homepageApp">
            <TitleLayout/>
            <SearchLayout/>

            <div className="productGrid">
                {mockProducts.map((product) => (
                    <FoodCard key={product.id} {...product} />
                ))}
            </div>

            {/* footerlayout */}
        </div>
    )
}

export default HomePage;