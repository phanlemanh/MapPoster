import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode is intentionally omitted. Its dev-only double-invocation of
// effects races the MapLibre map create/teardown lifecycle and aborts the
// vector source mid-load ("no tile manager" errors).
createRoot(document.getElementById('root')!).render(<App />)
