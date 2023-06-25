import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import ObsidianAPI, { Link } from './ObsidianAPI'
import invariant from 'tiny-invariant'

export type State = {
  links: Record<string, Link>
  backlinks: Record<string, Link>
  current?: string
  obsidianAPI?: ObsidianAPI
}

export type Actions = {
  setState: (newState: Partial<State>) => void
  setLinks: (type: 'link' | 'backlink', links: Record<string, Link>) => void
}

export const useStore = create(
  immer<State & Actions>((set) => {
    const state: State = {
      links: {},
      backlinks: {},
    }
    const actions: Actions = {
      setState: (newState) => {
        set((state) => {
          for (let key of Object.keys(newState)) {
            state[key] = newState[key]
          }
        })
      },
      setLinks: (type, newLinks) => {
        set((state) => {
          switch (type) {
            case 'backlink':
              state.backlinks = { ...state.backlinks, ...newLinks }
              break
            case 'link':
              state.links = { ...state.links, ...newLinks }
              break
          }
        })
      },
    }
    return { ...state, ...actions }
  })
)

export const getStore = <T extends keyof (State & Actions)>(
  action: T
): (State & Actions)[T] => useStore.getState()[action]
