import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router'
import './index.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Diagram from '@/components/Diagram.tsx'
import FtaPage from '@/components/FTA/FTAPage';
import { Toaster } from '@/components/ui/sonner'
import EditableNestedTable from '@/components/Table.tsx'
import ZoneSelecter from '@/components/ZoneSelecter.tsx'
import Stepper from '@/components/Stepper.tsx'
import Header from '@/components/Header'
import Docs from '@/components/Docs.tsx'

function App() {
  const location = useLocation();
  // 仅在 /table 和 /diagram（含子路径）下显示 ZoneSelecter
  const showZoneSelector =
    location.pathname.startsWith('/table') ||
    location.pathname.startsWith('/diagram');

  return (
    <>
      <Toaster position="top-center" richColors expand={false} closeButton />
      <Header />
      {showZoneSelector && <ZoneSelecter />}
      {/* <AppNav /> */}
      <Stepper />
      <Routes>
        <Route path="/" element={<Navigate to="/diagram" replace />} />
        <Route path="/table" element={<EditableNestedTable />} />
        <Route path="/diagram" element={<Diagram />} />
        <Route path="/fta" element={<FtaPage />} />
        <Route path="/docs" element={<Docs />} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
  </StrictMode>
)
