import { Notice, Plugin } from 'obsidian'
import { getAPI } from 'obsidian-dataview'
import LinkTreeView from './LinkTreeView'

type FoldableListSettings = {}
const DEFAULT_SETTINGS: FoldableListSettings = {}
export const LINK_TREE_VIEW = 'link-tree'

export default class FoldableList extends Plugin {
  settings: FoldableListSettings

  async onload() {
    const dv = getAPI()
    if (!dv) {
      new Notice('Please install Dataview to use Foldable List')
      return
    }

    this.registerView(LINK_TREE_VIEW, (leaf) => new LinkTreeView(leaf))
    this.addCommand({
      icon: 'list-tree',
      callback: () => this.activateView(),
      id: 'activate-view',
      name: 'View Link Tree',
    })

    await this.loadSettings()
  }

  async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  async getDataView() {
    let dataViewPlugin = getAPI(this.app)
    if (!dataViewPlugin) {
      // wait for Dataview plugin to load (usually <100ms)
      dataViewPlugin = await new Promise((resolve) => {
        setTimeout(() => resolve(getAPI(this.app)), 350)
      })
      if (!dataViewPlugin) {
        new Notice('Please enable the DataView plugin for Link Tree to work.')
        this.app.workspace.detachLeavesOfType(LINK_TREE_VIEW)
        throw new Error('no Dataview')
      }
    }
  }

  async activateView() {
    await this.getDataView()
    const leaf =
      this.app.workspace.getLeavesOfType(LINK_TREE_VIEW)?.[0] ??
      this.app.workspace.getRightLeaf(false)

    await leaf.setViewState({
      type: LINK_TREE_VIEW,
      active: true,
    })
    // this.app.workspace.revealLeaf(this.app.workspace.getRightLeaf(false))
  }
}
