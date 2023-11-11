import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import ObsidianAPI, { Link } from './ObsidianAPI'

export type State = {
  links: Record<string, Link>
  showForward: boolean
  showBack: boolean
  search: string
  current?: string
  obsidianAPI?: ObsidianAPI
}

export type Actions = {
  setState: (newState: Partial<State>) => void
  setLinks: (links: Record<string, Link>) => void
}

export const useStore = create(
  immer<State & Actions>((set) => {
    const state: State = {
      links: {},
      search: '',
      showForward: true,
      showBack: true,
    }
    const actions: Actions = {
      setState: (newState) => {
        set((state) => {
          for (let key of Object.keys(newState)) {
            state[key] = newState[key]
          }
        })
      },
      setLinks: (newLinks) => {
        set((state) => {
          state.links = { ...state.links, ...newLinks }
        })
      },
    }
    return { ...state, ...actions }
  })
)

export const getStore = <T extends keyof (State & Actions)>(
  action: T
): (State & Actions)[T] => useStore.getState()[action]

export const getLink = (link: string) => getStore('links')[link]

export const getObsidianAPI = () => getStore('obsidianAPI') as ObsidianAPI
