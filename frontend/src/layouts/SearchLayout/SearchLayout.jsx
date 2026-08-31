import { useState } from "react";
import './SearchLayout.css';

import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import Filter from "../../components/Filter/Filter.jsx";

// Mockado (no futuro vem do backend)
const CATEGORIES = ["Fruta", "Legume", "Verdura", "Grão"];

const SearchLayout = () => {
    const [activeFilter, setActiveFilter] = useState("Todas");

    return (
        <div className="searchLayoutApp">
            <div className="searchLayoutContainer">
                <SearchBar />

                <div className="searchLayoutFilters">
                    <Filter
                        label="Todas"
                        isActive={activeFilter === "Todas"}
                        onClick={() => setActiveFilter("Todas")}
                    />

                    {CATEGORIES.map((category) => (
                        <Filter
                            key={category}
                            label={category}
                            isActive={activeFilter === category}
                            onClick={() => setActiveFilter(category)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SearchLayout;