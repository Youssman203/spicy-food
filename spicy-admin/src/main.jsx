import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/oswald/latin-600.css';
import './styles.css';
import Dashboard from './Dashboard';
createRoot(document.getElementById('root')).render(<React.StrictMode><Dashboard audience="admin" /></React.StrictMode>);
