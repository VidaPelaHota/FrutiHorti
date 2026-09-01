import './Button.css';

const Button = ({ icon, label, onClick, type = "button" }) => {
    return (
        <button type={type} className="button" onClick={onClick}>
            {icon}
            <span>{label}</span>
        </button>
    )
}

export default Button;