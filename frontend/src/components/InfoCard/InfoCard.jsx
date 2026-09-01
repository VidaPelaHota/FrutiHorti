import './InfoCard.css';

const InfoCard = ({ icon, title, content, variant = "default" }) => {
    return (
        <div className={`infoCardApp ${variant}`}>
            <div className="infoCardIcon">{icon}</div>

            <div className="infoCardContent">
                <span className="infoCardTitle">{title}</span>
                <span className="infoCardValue">{content}</span>
            </div>
        </div>
    )
}

export default InfoCard;