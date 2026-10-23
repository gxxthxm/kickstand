import { toast } from 'sonner';
import { useGarage, type EntryKind, type Removed } from '@/store/garage';

/** Toast with an Undo action that puts deleted records back. */
export function undoToast(message: string, removed: Removed) {
  toast(message, {
    action: { label: 'Undo', onClick: () => useGarage.getState().restore(removed) },
  });
}

/** Delete an entry and offer undo. */
export function deleteWithUndo(kind: EntryKind, id: string, message: string) {
  const removed = useGarage.getState().remove(kind, id);
  undoToast(message, removed);
}

/** Toast after creating something; Undo deletes it again. */
export function createdToast(message: string, kind: EntryKind, id: string, description?: string) {
  toast.success(message, {
    description,
    action: { label: 'Undo', onClick: () => useGarage.getState().remove(kind, id) },
  });
}
