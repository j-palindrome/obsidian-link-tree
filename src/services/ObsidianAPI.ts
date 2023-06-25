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
    this.registerEvent(
      // @ts-ignore
      app.metadataCache.on('dataview:index-ready', () => {
        this.loadLinks()
      })
    )

    this.registerEvent(
      app.workspace.on('active-leaf-change', (leaf) => {
        console.log('editor changed', leaf?.getViewState())
        if (leaf?.getViewState()?.type === 'markdown') this.loadLinks()
      })
    )

    this.loadLinks()
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
    this.setState({ current })
  }

  loadLink(type: 'link' | 'backlink', link: string) {
    console.log('loading children', link)

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
  }
}
