import './FoodCard.css';

import { Text } from '../../styles/globalStyles.js';
import { getExpirationStatus } from "../../utils/productStatus.js";
import { describePrice } from "../../utils/currency.js";
import { Leaf, Carrot, Sprout, Wheat, CircleCheck, TriangleAlert, CircleX } from "lucide-react";

const CATEGORY_ICONS = {
    Fruta: Leaf,
    Legume: Carrot,
    Verdura: Sprout,
    Grão: Wheat,
};

const EXPIRATION_ICONS = {
    valid: CircleCheck,
    warning: TriangleAlert,
    expired: CircleX,
};

const FoodCardHeader = ({ categoria, discountBadge }) => {
    const CategoryIcon = CATEGORY_ICONS[categoria] ?? Sprout;

    return (
        <div className="foodCardHeader">
            <div className="foodCardIcon">
                <CategoryIcon size={16} />
            </div>
            {discountBadge && <span className="foodCardDiscountBadge">{discountBadge}</span>}
            <Text className="foodCardCategory" fontSize="1rem" fontWeight="600">
                {categoria}
            </Text>
        </div>
    );
};

// N2: a product close to expiration shows the original price struck through and the discounted price.
const FoodCardPrice = ({ price, isAvailable }) => (
    <div className={`foodCardPrice ${isAvailable ? "" : "unavailable"}`}>
        {price.original && <span className="foodCardPriceOriginal">{price.original}</span>}
        <span className={`foodCardPriceCurrent ${price.hasDiscount ? "discounted" : ""}`}>{price.current}</span>
        {price.hasDiscount && <span className="foodCardPriceNote">Desconto por validade próxima</span>}
    </div>
);

const FoodCardFooter = ({ quantidadeEstoque, isAvailable }) => {
    const availability = isAvailable ? "available" : "unavailable";

    return (
        <div className="foodCardFooter">
            <Text className={`foodCardStock ${availability}`} fontSize="1.2rem" fontWeight="400">
                {quantidadeEstoque > 0 ? `${quantidadeEstoque} em estoque` : "Sem estoque disponível"}
            </Text>
            <Text className={`foodCardAvailability ${availability}`} fontSize="1rem" fontWeight="600">
                {isAvailable ? "Disponível" : "Indisponível"}
            </Text>
        </div>
    );
};

const FoodCard = (product) => {
    const { nome, categoria, quantidadeEstoque, status } = product;
    const expiration = getExpirationStatus(product);
    const ExpirationIcon = EXPIRATION_ICONS[expiration.variant];
    const isExpired = status === "vencido";
    const isAvailable = !isExpired && quantidadeEstoque > 0;
    const price = describePrice(product);

    return (
        <div className={`foodCard ${isExpired ? "expired" : ""}`}>
            <FoodCardHeader categoria={categoria} discountBadge={isAvailable ? price.badge : null} />

            <Text className={`foodCardName ${isAvailable ? "available" : "unavailable"}`} fontSize="1.7rem" fontWeight="700" fontFamily="Lora, serif">
                {nome}
            </Text>

            <FoodCardPrice price={price} isAvailable={isAvailable} />

            <Text className={`foodCardExpiration ${expiration.variant}`} fontSize="1rem" fontWeight="600">
                <ExpirationIcon size={12} />
                {expiration.label}
            </Text>

            <div className="foodCardDivider" />
            <FoodCardFooter quantidadeEstoque={quantidadeEstoque} isAvailable={isAvailable} />
        </div>
    )
}

export default FoodCard;
