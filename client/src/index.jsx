import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './CSS/index.css';
import './CSS/import.css';
import App from './App.jsx'
import DataContext from './context/DataContext.jsx'
import AuthContext from './context/AuthContext.jsx';
import ShopContext from './context/ShopContext.jsx';

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <DataContext>
            <AuthContext>
                <ShopContext>
                    <App /> 
                </ShopContext>
            </AuthContext>
        </DataContext>
    </BrowserRouter>
);
