import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AppearanceProvider } from './contexts/AppearanceContext.tsx'
import { NotificationProvider } from './contexts/NotificationContext.tsx'
import { MultiAccountProvider } from './contexts/MultiAccountContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppearanceProvider>
            <NotificationProvider>
                <MultiAccountProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </MultiAccountProvider>
            </NotificationProvider>
        </AppearanceProvider>
    </React.StrictMode>,
)
