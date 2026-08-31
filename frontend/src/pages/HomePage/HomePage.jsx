import './HomePage.css';

import TitleLayout from "../../layouts/TitleLayout/TitleLayout.jsx";
import SearchLayout from '../../layouts/SearchLayout/SearchLayout.jsx';

const HomePage = () => {
    return (
        <div className="homepageApp">
            <TitleLayout/>
            <SearchLayout/>
        </div>
    )
}

export default HomePage;