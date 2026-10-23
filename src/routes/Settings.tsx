import { useState, type ReactNode } from 'react';
import { Download, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { todayISO } from '@/lib/dates';
import { exportGarage, useGarage } from '@/store/garage';
import { Page, PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';

export default function Settings() {
  const settings = useGarage((s) => s.settings);
  const setSettings = useGarage((s) => s.setSettings);
  const resetDemo = useGarage((s) => s.resetDemo);
  const clearAll = useGarage((s) => s.clearAll);
  const counts = useGarage(
    useShallow((s) => ({
      bikes: s.bikes.length,
      logs: s.fuel.length + s.rides.length + s.services.length,
    })),
  );
  const [confirm, setConfirm] = useState<'reset' | 'clear' | null>(null);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportGarage(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kickstand-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  };

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-6">
        <Group title="Units">
          <Row label="Fuel economy" sub="How mileage is shown everywhere">
            <Segmented
              label="Fuel economy unit"
              value={settings.economyUnit}
              onValueChange={(v) => setSettings({ economyUnit: v })}
              options={[
                { value: 'kmpl', label: 'km/l' },
                { value: 'l100km', label: 'l/100km' },
              ]}
              className="w-56"
            />
          </Row>
          <Row label="Currency" sub="Indian rupee, en-IN grouping">
            <span className="font-display text-2xl font-semibold">₹ INR</span>
          </Row>
        </Group>

        <Group title="Appearance">
          <Row label="Theme" sub="Dark is built for glancing in a parking lot">
            <Segmented
              label="Theme"
              value={settings.theme}
              onValueChange={(v) => setSettings({ theme: v })}
              options={[
                { value: 'dark', label: 'Dark', icon: <Moon /> },
                { value: 'light', label: 'Light', icon: <Sun /> },
              ]}
              className="w-56"
            />
          </Row>
        </Group>

        <Group title="Data">
          <p className="px-4 pt-3 text-sm text-muted sm:px-5">
            Everything lives in this browser only ({counts.bikes} bike
            {counts.bikes === 1 ? '' : 's'}, {counts.logs.toLocaleString('en-IN')} logs). Nothing is
            sent anywhere.
          </p>
          <Row label="Export JSON" sub="A full backup of your garage">
            <Button variant="secondary" onClick={download}>
              <Download /> Export
            </Button>
          </Row>
          <Row label="Reset demo data" sub="Replace everything with the sample garage">
            <Button variant="secondary" onClick={() => setConfirm('reset')}>
              <RotateCcw /> Reset
            </Button>
          </Row>
          <Row label="Clear all data" sub="Start with an empty garage">
            <Button variant="danger-ghost" onClick={() => setConfirm('clear')}>
              <Trash2 /> Clear
            </Button>
          </Row>
        </Group>

        <p className="text-center text-xs text-faint">
          Kickstand · frontend-only demo · works offline once loaded
        </p>
      </div>

      <ConfirmDialog
        open={confirm === 'reset'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Reset to the demo garage?"
        description="Your bikes and logs are replaced with the three sample bikes. Export first if you want to keep them."
        confirmLabel="Reset demo"
        destructive
        onConfirm={() => {
          resetDemo();
          toast.success('Sample garage loaded');
        }}
      />
      <ConfirmDialog
        open={confirm === 'clear'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Clear all data?"
        description="Every bike, log and document is deleted from this browser. This can't be undone."
        confirmLabel="Clear everything"
        destructive
        onConfirm={() => {
          clearAll();
          toast('Garage cleared');
        }}
      />
    </Page>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="label-caps mb-2 px-1">{title}</h2>
      <Card className="divide-y divide-line">{children}</Card>
    </section>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
