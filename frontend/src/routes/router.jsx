import { createBrowserRouter } from 'react-router-dom';
import App from '../App.jsx';

import NotFound from '../pages/NotFound/NotFound.jsx';
import HomePage from '../pages/HomePage/HomePage.jsx';
import Stock from '../pages/Stock/Stock.jsx';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		errorElement: <NotFound />,
		children: [
			{
				index: true,
				element: <HomePage />
			},
			{
				path: 'stock',
				element: <Stock />
			}
		]
	}
]);