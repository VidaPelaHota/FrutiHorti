import './SearchBar.css';

import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, placeholder = "Buscar produto" }) => {
    return (
        <div className="searchBar">
            <Search size={14} className="searchBarIcon" />
            <input
                type="text"
                className="searchBarInput"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </div>
    )
}

export default SearchBar;