import { App, ItemView, WorkspaceLeaf } from 'obsidian'
import ObsidianAPI from './services/ObsidianAPI'
import * as React from 'react'
import { Root, createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import View from './components/View'
import { getStore } from './services/store'

export default class LinkTreeView extends ItemView {
  obsidianAPI: ObsidianAPI
  root: Root

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
    this.icon = 'list-tree'
    this.navigation = false
    this.obsidianAPI = new ObsidianAPI()
    getStore('setState')({ obsidianAPI: this.obsidianAPI })
  }

  getDisplayText(): string {
    return 'Link Tree'
  }

  getViewType(): string {
    return 'link-tree'
  }

  async onOpen() {
    console.log(this.containerEl.children)

    this.root = createRoot(this.containerEl.children[1])
    console.log(this.root)

    this.root.render(<View />)
  }

  async onClose() {
    this.root.unmount()
  }
}
