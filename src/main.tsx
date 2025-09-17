import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import './index.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Diagram from '@/components/Diagram.tsx'
import FtaDiagram from '@/components/FTA.tsx'
import { AppNav } from '@/components/AppNav.tsx'
import { Toaster } from "@/components/ui/sonner"
import EditableNestedTable from '@/components/Table.tsx'
import ZoneSelecter from '@/components/ZoneSelecter.tsx'
import Stepper from '@/components/Stepper.tsx';
import Header from '@/components/Header';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="top-center" richColors expand={false} closeButton/>
    <BrowserRouter>
      <Header />
      <ZoneSelecter />
      {/* <AppNav /> */}
      <Stepper />
      <Routes>
        <Route path="/" element={<Navigate to="/diagram" replace />} />
        <Route path="/table" element={<EditableNestedTable />} />
        <Route path="/diagram" element={<Diagram />} />
        <Route path="/fta" element={<FtaDiagram />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
