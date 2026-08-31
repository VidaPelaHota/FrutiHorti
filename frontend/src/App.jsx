import { GlobalStyle } from "./styles/globalStyles.js";
import { Outlet } from "react-router-dom";

import Header from "./components/Header/Header.jsx";

function App()
{
	return (
		<>
			<GlobalStyle />
			<Header />
			<Outlet />
		</>
	);
}

export default App;