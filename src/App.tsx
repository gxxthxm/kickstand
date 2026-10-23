import { lazy } from 'react';
import { MotionConfig } from 'framer-motion';
import { HashRouter, Route, Routes, useLocation } from 'react-router';
import { AppShell } from '@/components/AppShell';
import Garage from '@/routes/Garage';
import { QuickLog } from '@/routes/QuickLog';
import type { ModalState } from '@/store/useOpenLog';

const BikeDetail = lazy(() => import('@/routes/BikeDetail'));
const BikeFormPage = lazy(() => import('@/routes/BikeFormPage'));
const Costs = lazy(() => import('@/routes/Costs'));
const Logbook = lazy(() => import('@/routes/Logbook'));
const Settings = lazy(() => import('@/routes/Settings'));
const NotFound = lazy(() => import('@/routes/NotFound'));

function AppRoutes() {
  const location = useLocation();
  // When the quick-log sheet is open, keep rendering the screen underneath it.
  const background = (location.state as ModalState | null)?.background;
  return (
    <>
      <Routes location={background ?? location}>
        <Route element={<AppShell />}>
          <Route index element={<Garage />} />
          <Route path="log" element={<Garage />} />
          <Route path="bikes/new" element={<BikeFormPage />} />
          <Route path="bikes/:id/edit" element={<BikeFormPage />} />
          <Route path="bikes/:id/:tab?" element={<BikeDetail />} />
          <Route path="logbook" element={<Logbook />} />
          <Route path="costs" element={<Costs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <QuickLog />
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </MotionConfig>
  );
}
