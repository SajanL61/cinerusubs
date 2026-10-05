import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './premium.css';
const initialDataElement = document.getElementById('initial-data');
const initialData = initialDataElement?.textContent ? JSON.parse(initialDataElement.textContent) : undefined;
hydrateRoot(document.getElementById('root')!, <StrictMode><App initialData={initialData}/></StrictMode>);
