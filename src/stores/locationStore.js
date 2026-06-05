import { create } from 'zustand';

export const useLocationStore = create((set) => ({
  currentLocation: null,
  sharingEnabled: false,
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setSharingEnabled: (sharingEnabled) => set({ sharingEnabled }),
}));
