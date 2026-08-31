import './FooterLayout.css';

import { Text } from '../../styles/globalStyles';

const FooterLayout = () => {
    return (
        <div className="footerLayoutApp">
            <div className="footerLine"></div>

            <Text fontSize="1.1rem">
                Horta do Bairro · Produtos vencidos nunca são vendidos.
            </Text>
        </div>
    )
}

export default FooterLayout;