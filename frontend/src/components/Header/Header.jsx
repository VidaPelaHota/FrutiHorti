import './Header.css';

import PageCard from "../PageCard/PageCard.jsx";
import folhaLogo from "../../assets/folha.png";

import { Text } from "../../styles/globalStyles";

const Header = () => {
    return (
        <div className="header">
            <div className="headerContainer">
                <div className="headerTitle">
                    <img src={folhaLogo} alt="Logo" />
                    <Text fontSize="1.8rem" fontFamily="Lora, serif" fontWeight="bold">
                        Horta do Bairro
                    </Text>
                </div>

                <div className="headerPages">
                    <PageCard title="Vitrine" link="/" />
                    <PageCard title="Estoque" link="/stock" />
                </div>
            </div>
        </div>
    )
}

export default Header;