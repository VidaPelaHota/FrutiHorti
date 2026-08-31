import './TitleLayout.css';

import { Text } from "../../styles/globalStyles";

const TitleLayout = () => {
    return (
        <div className="titleLayoutApp">
            <div className="titleLayoutContainer">
                <div className="titleLayoutTexts">
                    <Text fontSize="1.1rem" color="var(--text-green)" fontWeight="bold" letterSpacing="0.1rem">
                        COLHIDO PERTINHO DE VOCÊ
                    </Text>

                    <Text fontSize="4rem" fontFamily="Lora, serif" color="var(--white)" fontWeight="bold">
                        Frutas, legumes e verduras <br />
                        com validade sempre à vista
                    </Text>

                    <Text fontSize="1.2rem" color="var(--text-green)" fontWeight="500" wordSpacing="0.15rem">
                        Confira o que temos fresco hoje na loja. Itens vencidos aparecem sinalizados <br />
                        e não estão disponíveis para venda.
                    </Text>
                </div>
            </div>
        </div>
    )
}

export default TitleLayout;