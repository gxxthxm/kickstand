import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { useGarage } from '@/store/garage';
import { EditorHost } from './EditorHost';
import { BottomNav, Sidebar } from './Nav';

export function AppShell() {
  const theme = useGarage((s) => s.settings.theme);
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f1f0ec' : '#141518');
  }, [theme]);

  // New screen → start at the top (the quick-log sheet keeps its background in place).
  useEffect(() => {
    if (pathname !== '/log') window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15.5rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <main id="main" tabIndex={-1} className="min-w-0 pb-32 outline-none md:pb-12">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
      <EditorHost />
      <Toaster
        theme={theme}
        position="bottom-center"
        offset={24}
        mobileOffset={{ bottom: 96 }}
        closeButton={false}
        toastOptions={{
          style: {
            background: 'var(--bg-raised)',
            color: 'var(--fg)',
            borderColor: 'var(--line-strong)',
            borderRadius: '1rem',
            fontFamily: 'var(--font-sans)',
          },
          classNames: {
            title: 'font-display! text-lg! font-semibold! tracking-wide',
            description: 'text-muted! num',
            actionButton: 'bg-accent! text-on-accent! font-semibold! h-9! px-3! rounded-full!',
          },
        }}
      />
    </div>
  );
}

function PageFallback() {
  return (
    <div className="flex h-[60dvh] items-center justify-center" role="status" aria-live="polite">
      <span className="label-caps">Loading…</span>
    </div>
  );
}
