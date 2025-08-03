// UI Store - Manages global UI state

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { UIState, UIActions } from './types'

interface UIStore extends UIState, UIActions {}

export const useUIStore = create<UIStore>()(
  devtools(
    immer((set) => ({
      // Initial state
      isLoading: false,
      globalError: null,
      activeModal: null,
      sidebarOpen: false,
      bottomNavVisible: true,

      // Actions
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading
        }),

      setGlobalError: (error) =>
        set((state) => {
          state.globalError = error
        }),

      openModal: (modalId) =>
        set((state) => {
          state.activeModal = modalId
        }),

      closeModal: () =>
        set((state) => {
          state.activeModal = null
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen
        }),

      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open
        }),

      setBottomNavVisible: (visible) =>
        set((state) => {
          state.bottomNavVisible = visible
        }),
    })),
    {
      name: 'ui-store',
    }
  )
)