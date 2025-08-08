import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import App from './App.tsx'
import TableDemo from '@/components/Table.tsx'
import Diagram from '@/components/Diagram.tsx'
import { AppNav } from '@/components/AppNav.tsx'
import EditableNestedTable from '@/components/Table-demo.tsx'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppNav />
      <Routes>
        <Route path="/" element={<EditableNestedTable />} />
        <Route path="/diagram" element={<Diagram />} />
        {/* <Route path="/demo" element={<App />} /> */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
