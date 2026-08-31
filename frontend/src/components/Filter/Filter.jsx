import './Filter.css';

const Filter = ({ label, isActive, onClick }) => {
    return (
        <button
            type="button"
            className={`filter ${isActive ? "active" : ""}`}
            onClick={onClick}
        >
            {label}
        </button>
    )
}

export default Filter;