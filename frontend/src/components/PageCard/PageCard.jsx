import './PageCard.css';
import { NavLink } from "react-router-dom";

const PageCard = ({ title, link }) => {
    return (
        <NavLink
            to={link}
            end
            className={({ isActive }) => `pageCard ${isActive ? "active" : ""}`}
        >
            {title}
        </NavLink>
    )
}

export default PageCard;