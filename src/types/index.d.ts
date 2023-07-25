import { App } from 'obsidian'
declare module 'obsidian' {
  interface App {
    commands: {
      commands: object
      executeCommandById: (command: string) => void
    }
  }
}
