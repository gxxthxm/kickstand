import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { useGarage, type EntryKind } from '@/store/garage';
import { useUI, type EditorTarget } from '@/store/ui';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BikeSwatch } from './BikeSwatch';
import { deleteWithUndo } from './toasts';
import { DocForm } from './forms/DocForm';
import { FuelForm } from './forms/FuelForm';
import { ItemForm } from './forms/ItemForm';
import { OdometerForm } from './forms/OdometerForm';
import { RideForm } from './forms/RideForm';
import { ServiceForm } from './forms/ServiceForm';

/** One sheet for editing any log, adding documents and schedule items. */
export function EditorHost() {
  const target = useUI((s) => s.editor);
  const close = useUI((s) => s.closeEditor);
  return (
    <Sheet open={target !== null} onOpenChange={(o) => !o && close()}>
      {target && <EditorBody key={JSON.stringify(target)} target={target} onDone={close} />}
    </Sheet>
  );
}

function EditorBody({ target, onDone }: { target: EditorTarget; onDone(): void }) {
  const s = useGarage();
  const find = <T extends { id: string }>(xs: T[], id?: string) =>
    id ? xs.find((x) => x.id === id) : undefined;

  let title = '';
  let bikeId = '';
  let body: ReactNode = null;
  let del: { kind: EntryKind; id: string; message: string } | undefined;

  switch (target.kind) {
    case 'fuel': {
      const e = find(s.fuel, target.id);
      if (!e) return null;
      title = 'Edit fill-up';
      bikeId = e.bikeId;
      body = <FuelForm bikeId={e.bikeId} entry={e} onDone={onDone} />;
      del = { kind: 'fuel', id: e.id, message: 'Fill-up deleted' };
      break;
    }
    case 'ride': {
      const e = find(s.rides, target.id);
      if (!e) return null;
      title = 'Edit ride';
      bikeId = e.bikeId;
      body = <RideForm bikeId={e.bikeId} entry={e} onDone={onDone} />;
      del = { kind: 'ride', id: e.id, message: `“${e.title}” deleted` };
      break;
    }
    case 'service': {
      const e = find(s.services, target.id);
      if (!e) return null;
      title = 'Edit service';
      bikeId = e.bikeId;
      body = <ServiceForm bikeId={e.bikeId} entry={e} onDone={onDone} />;
      del = { kind: 'service', id: e.id, message: 'Service deleted' };
      break;
    }
    case 'reading': {
      const e = find(s.readings, target.id);
      if (!e) return null;
      title = 'Edit odometer reading';
      bikeId = e.bikeId;
      body = <OdometerForm bikeId={e.bikeId} entry={e} onDone={onDone} />;
      del = { kind: 'reading', id: e.id, message: 'Reading deleted' };
      break;
    }
    case 'doc': {
      const e = find(s.docs, target.id);
      title = e ? `Edit ${e.type}` : 'Add document';
      bikeId = target.bikeId;
      body = <DocForm bikeId={target.bikeId} entry={e} onDone={onDone} />;
      if (e) del = { kind: 'doc', id: e.id, message: `${e.type} deleted` };
      break;
    }
    case 'item': {
      const e = find(s.schedule, target.id);
      title = e ? `Edit ${e.name}` : 'Add schedule item';
      bikeId = target.bikeId;
      body = <ItemForm bikeId={target.bikeId} entry={e} onDone={onDone} />;
      if (e) del = { kind: 'item', id: e.id, message: `${e.name} removed from schedule` };
      break;
    }
  }
  const bike = s.bikes.find((b) => b.id === bikeId);

  return (
    <SheetContent
      title={title}
      description={
        bike && (
          <span className="inline-flex items-center gap-1.5">
            <BikeSwatch colour={bike.colour} className="size-2.5" />
            {bike.nickname}
          </span>
        )
      }
      headerExtra={
        del && (
          <button
            type="button"
            onClick={() => {
              deleteWithUndo(del.kind, del.id, del.message);
              onDone();
            }}
            className="-mt-1 grid grid-cols-1 size-11 shrink-0 cursor-pointer place-items-center rounded-full text-overdue hover:bg-well"
          >
            <Trash2 className="size-5" />
            <span className="sr-only">Delete</span>
          </button>
        )
      }
    >
      {body}
    </SheetContent>
  );
}
