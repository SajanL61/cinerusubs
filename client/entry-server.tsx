import { renderToString } from 'react-dom/server';
import { App } from './App';
import './styles.css';
import './premium.css';
export function render(url: string, initialData: unknown) { return renderToString(<App url={url} initialData={initialData}/>); }
