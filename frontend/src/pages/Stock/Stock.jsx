import './Stock.css';

import { Package, Apple, Ban, Plus } from "lucide-react";

import SearchLayout from "../../layouts/SearchLayout/SearchLayout";
import Button from "../../components/Button/Button";
import InfoCard from "../../components/InfoCard/InfoCard";

import { Text } from "../../styles/globalStyles";

const Stock = () => {
    return (
        <div className="stockApp">
            <div className="stockTitle">
                <div className="titleText">
                    <Text fontSize="2.4rem" fontFamily="Lora, serif" fontWeight="bold">
                        Gestão de estoque
                    </Text>

                    <Text fontSize="1.2rem">
                        Controle lotes, quantidades e validade dos produtos da loja.
                    </Text>
                </div>

                <Button
                    icon={<Plus size={16} />}
                    label="Novo produto"
                    onClick={() => console.log("abrir formulário de novo produto")}
                />
            </div>

            <div className="stockCards">
                <InfoCard icon={<Package size={20} />} title="Produtos" content="9" variant="default" />
                <InfoCard icon={<Apple size={20} />} title="Próximos do vencimento" content="2" variant="warning" />
                <InfoCard icon={<Ban size={20} />} title="Vencidos" content="2" variant="danger" />
            </div>

            <SearchLayout />

            {/* <Table /> */}
        </div>
    )
}

export default Stock;