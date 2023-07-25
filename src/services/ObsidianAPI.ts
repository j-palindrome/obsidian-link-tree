import { Component, Editor, TFile } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'
import { Actions, State, getLink, getStore } from './store'
import _ from 'lodash'
import { link } from 'fs'

let dv: DataviewApi

export type Link = {
  loadedChildren: boolean
  notes?: { text: string; line: number }[]
  children: {
    link: string
    forward: boolean
    back: boolean
  }[]
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

    if (dv.index.initialized) {
      indexReady.current = true
      this.loadLinks()
    }
  }

  loadLinks() {
    const currentEditor = app.workspace.activeEditor
    if (!currentEditor) {
      return
    }
    const current = currentEditor.file?.path.replace('.md', '')
    if (!current) {
      return
    }

    this.loadLink(current, true)
    this.loadLinkChildren(current)
    this.setState({ current })
  }

  async loadNotes(link: string) {
    let thisLink = getLink(link)
    if (!thisLink) {
      this.loadLink(link)
      thisLink = getLink(link)
      if (!thisLink) {
        return
      }
    }

    const file = app.vault.getAbstractFileByPath(link + '.md')
    if (!(file instanceof TFile)) return
    const text = await app.vault.read(file)
    const paragraphs = text.split('\n')

    const notes: Link['notes'] = []
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      notes.push({
        text: paragraph,
        line: i,
      })
    }
    this.setLinks({
      [link]: {
        ...thisLink,
        notes,
      },
    })
  }

  updateText(link: string, note: NonNullable<Link['notes']>[number]) {
    console.log(note)

    const file = app.vault.getAbstractFileByPath(link + '.md')

    if (!(file instanceof TFile)) return
    app.vault.process(file, (text) => {
      const lines = text.split('\n')
      lines[note.line] = note.text
      console.log('new line:', lines)
      return lines.join('\n')
    })
  }

  loadLinkChildren(link: string) {
    let thisLink = getLink(link)
    if (!thisLink) {
      this.loadLink(link)
      thisLink = getLink(link)
      if (!thisLink) {
        return
      }
    } else if (thisLink.loadedChildren) return

    for (let child of thisLink.children) {
      this.loadLink(child.link)
    }
    this.setLinks({ [link]: { ...thisLink, loadedChildren: true } })
  }

  loadLink(link: string, force = false) {
    try {
      if (!force) {
        const alreadyGotLink = getLink(link)
        if (alreadyGotLink) return
      }

      const back: string[] = dv
        .pages(`[[${link}]]`)
        ['file']['path'].map((link) => link.replace('.md', ''))
        .array()
      const forward: string[] = dv
        .pages(`outgoing([[${link}]])`)
        ['file']['path'].map((link) => link.replace('.md', ''))
        .array()

      const children: Link['children'] = _.sortBy(
        _.uniq(forward.concat(back)),
        (link) =>
          link.includes('/') ? link.slice(link.lastIndexOf('/' + 1)) : link
      ).map((link) => ({
        forward: forward.includes(link),
        back: back.includes(link),
        link,
      }))

      this.setLinks({ [link]: { children, loadedChildren: false } })
    } catch (err) {
      return
    }
  }
}
