import { useMemo } from 'react';
import { BadgeCheck, FileText, IdCard, Leaf, Plus, ShieldCheck } from 'lucide-react';
import { docAsItemStatus } from '@/lib/due';
import { formatDate, formatMoney } from '@/lib/format';
import { bikeDocs } from '@/lib/garage';
import type { Bike, DocType } from '@/lib/types';
import { useData, useToday } from '@/store/hooks';
import { usePulse, useUI } from '@/store/ui';
import { EmptyState } from '@/components/PageHeader';
import { StatusBadge, statusVar } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON: Record<DocType, typeof FileText> = {
  Insurance: ShieldCheck,
  PUC: Leaf,
  Registration: BadgeCheck,
  Licence: IdCard,
};

const LABEL = { Expired: 'Expired', Expiring: 'Expiring in 30 days', Valid: 'Valid' } as const;

export function DocsTab({ bike }: { bike: Bike }) {
  const data = useData();
  const today = useToday();
  const openEditor = useUI((s) => s.openEditor);
  const docs = useMemo(() => bikeDocs(data, bike.id, today), [data, bike.id, today]);
  const add = () => openEditor({ kind: 'doc', bikeId: bike.id });

  if (docs.length === 0) {
    return (
      <EmptyState
        icon={<FileText />}
        title="No documents"
        actions={
          <Button onClick={add}>
            <Plus /> Add document
          </Button>
        }
      >
        Track insurance, PUC, registration and licence expiry so you never ride on lapsed papers.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle>Papers</SectionTitle>
        <Button variant="secondary" size="sm" onClick={add}>
          <Plus /> Add document
        </Button>
      </div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {docs.map((view) => (
          <DocCard
            key={view.doc.id}
            view={view}
            onEdit={() => openEditor({ kind: 'doc', id: view.doc.id, bikeId: bike.id })}
          />
        ))}
      </ul>
    </div>
  );
}

function DocCard({ view, onEdit }: { view: ReturnType<typeof bikeDocs>[number]; onEdit(): void }) {
  const { doc, info, message } = view;
  const pulsing = usePulse(doc.id);
  const Icon = ICON[doc.type];
  const status = docAsItemStatus(info.status);
  return (
    <li
      className={cn('rounded-2xl', pulsing && 'animate-pulse-once')}
      style={{ ['--pulse-colour' as string]: statusVar[status] }}
    >
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-line bg-card p-4 text-left transition-colors hover:border-line-strong"
      >
        <span className="grid grid-cols-1 size-11 shrink-0 place-items-center rounded-xl bg-well text-accent-ink">
          <Icon aria-hidden className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{doc.type}</span>
            <StatusBadge status={status} label={LABEL[info.status]} />
          </span>
          {doc.number && (
            <span className="num mt-0.5 block truncate text-sm text-muted">{doc.number}</span>
          )}
          <span className="num mt-1 block text-xs text-faint">
            {message} · {formatDate(doc.expiresAt)}
            {doc.cost ? ` · ${formatMoney(doc.cost)}` : ''}
          </span>
        </span>
      </button>
    </li>
  );
}
