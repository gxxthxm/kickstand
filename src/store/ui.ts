import { create } from 'zustand';

/** What the shared editor sheet is showing. `id` set = edit, otherwise create for `bikeId`. */
export type EditorTarget =
  | { kind: 'fuel' | 'ride' | 'service' | 'reading'; id: string }
  | { kind: 'doc'; id?: string; bikeId: string }
  | { kind: 'item'; id?: string; bikeId: string };

interface UIState {
  /** Ids (items, docs, bikes) that just became due, mapped to when — they pulse once. */
  pulses: Record<string, number>;
  pulse(ids: string[]): void;
  editor: EditorTarget | null;
  openEditor(t: EditorTarget): void;
  closeEditor(): void;
}

const PULSE_MS = 2500;

export const useUI = create<UIState>()((set) => ({
  pulses: {},
  pulse(ids) {
    const at = Date.now();
    set((s) => ({ pulses: { ...s.pulses, ...Object.fromEntries(ids.map((id) => [id, at])) } }));
    setTimeout(() => {
      set((s) => {
        const next = { ...s.pulses };
        for (const id of ids) if (next[id] === at) delete next[id];
        return { pulses: next };
      });
    }, PULSE_MS);
  },
  editor: null,
  openEditor: (editor) => set({ editor }),
  closeEditor: () => set({ editor: null }),
}));

/** True while an element should play its one-off "newly due" pulse. */
export const usePulse = (id: string): boolean => useUI((s) => id in s.pulses);
