import { create } from "zustand";

interface UiState {
  savePinId: string | null;
  sharePinId: string | null;
  setSavePinId: (id: string | null) => void;
  setSharePinId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  savePinId: null,
  sharePinId: null,
  setSavePinId: (savePinId) => set({ savePinId }),
  setSharePinId: (sharePinId) => set({ sharePinId }),
}));
