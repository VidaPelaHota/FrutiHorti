import './SearchLayout.css';

import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import Filter from "../../components/Filter/Filter.jsx";
import { ALL_CATEGORIES, PRODUCT_CATEGORIES } from "../../constants/catalog.js";

// Controlled search box and category filter; the page owns the state (see useProductList).
const SearchLayout = ({ searchValue, onSearchChange, activeCategory, onCategoryChange, categories = PRODUCT_CATEGORIES }) => (
    <div className="searchLayoutApp">
        <div className="searchLayoutContainer">
            <SearchBar value={searchValue} onChange={(event) => onSearchChange(event.target.value)} />

            <div className="searchLayoutFilters">
                {[ALL_CATEGORIES, ...categories].map((category) => (
                    <Filter
                        key={category}
                        label={category}
                        isActive={activeCategory === category}
                        onClick={() => onCategoryChange(category)}
                    />
                ))}
            </div>
        </div>
    </div>
);

export default SearchLayout;
