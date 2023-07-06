import { Component, Editor } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'
import { Actions, State, getStore } from './store'
import _ from 'lodash'
import { link } from 'fs'

let dv: DataviewApi
export type Link = {
  children: string[]
}
export default class ObsidianAPI extends Component {
  setState: Actions['setState']
  setLinks: Actions['setLinks']

  constructor() {
    super()
    dv = getAPI() as DataviewApi
    this.setState = getStore('setState')
    this.setLinks = getStore('setLinks')
    this.load()
  }

  onload() {
    let indexReady = { current: false }

    this.registerEvent(
      // @ts-ignore
      app.metadataCache.on('dataview:metadata-change', () => {
        if (!indexReady.current) return
        this.loadLinks()
      })
    )

    this.registerEvent(
      // @ts-ignore
      app.metadataCache.on('dataview:index-ready', () => {
        indexReady.current = true
        this.loadLinks()
      })
    )

    this.registerEvent(
      app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf?.getViewState()?.type === 'markdown' && indexReady.current)
          this.loadLinks()
      })
    )
  }

  loadLinks() {
    const currentEditor = app.workspace.activeEditor
    if (!currentEditor) {
      console.log('no current editor')
      return
    }
    const current = currentEditor.file?.path.replace('.md', '')
    if (!current) {
      console.log('no current file')
      return
    }

    this.loadLink('link', current)
    this.loadLink('backlink', current)
    this.setState({ current, search: '' })
  }

  loadLink(type: 'link' | 'backlink', link: string) {
    try {
      const childLinks: string[] = dv
        .pages(type === 'backlink' ? `[[${link}]]` : `outgoing([[${link}]])`)
        ['file']['path'].map((link) => link.replace('.md', ''))
        .filter((childLink) => childLink !== link)
      const newLinks: Record<string, Link> = {
        [link]: { children: childLinks },
      }

      for (let childLink of childLinks) {
        const pages = dv
          .pages(
            type === 'backlink'
              ? `[[${childLink}]]`
              : `outgoing([[${childLink}]])`
          )
          ['file']['path'].map((link) => link.replace('.md', ''))
          .filter((subChildLink) => subChildLink !== childLink)
        newLinks[childLink] = { children: pages }
      }

      this.setLinks(type, newLinks)
    } catch (err) {
      return
    }
  }
}
