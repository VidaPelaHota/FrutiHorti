import './App.css';

import Header from "./components/Header/Header.jsx";

import { GlobalStyle } from "./styles/globalStyles.js";
import { Outlet } from "react-router-dom";

function App()
{
	return (
		<div className="app">
			<GlobalStyle />
			<Header />
			<Outlet />
		</div>
	);
}

export default App;