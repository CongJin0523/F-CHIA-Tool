import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './App.tsx'
import Diagram from '@/components/Diagram.tsx'
import FtaDiagram from '@/components/FTA.tsx'
import { AppNav } from '@/components/AppNav.tsx'
import EditableNestedTable from '@/components/Table.tsx'
import ZoneSelecter from '@/components/ZoneSelecter.tsx'
import Stepper from '@/components/Stepper.tsx';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ZoneSelecter />
      {/* <AppNav /> */}
      <Stepper />
      <Routes>
        <Route path="/table" element={<EditableNestedTable />} />
        <Route path="/diagram" element={<Diagram />} />
        <Route path="/demo" element={<App />} />
        <Route path="/fta" element={<FtaDiagram />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
