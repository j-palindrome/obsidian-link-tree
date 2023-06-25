import { useState } from 'react'
import { getStore, useStore } from '../services/store'
import invariant from 'tiny-invariant'

export default function Link({
  link,
  type,
}: {
  link: string
  type: 'link' | 'backlink'
}) {
  const thisLink = useStore((state) =>
    type === 'link' ? state.links[link] : state.backlinks[link]
  )

  const [collapsed, setCollapsed] = useState(true)

  const loadChildren = () => {
    const links = getStore(type === 'link' ? 'links' : 'backlinks')
    const obsidianAPI = getStore('obsidianAPI')
    invariant(obsidianAPI)
    for (let child of thisLink.children) {
      if (!links[child]) {
        obsidianAPI.loadLink(type, link)
        return
      }
    }
  }

  if (!thisLink) {
    throw new Error('loading nonexistent link')
  }

  const sortedLinks = thisLink.children?.sort()

  return (
    <div>
      <div className='flex'>
        <div
          className='flex w-6 flex-none items-center pl-1'
          onClick={() => {
            if (collapsed) loadChildren()
            setCollapsed(!collapsed)
          }}
        >
          <div className='relative h-4 w-4'>
            {collapsed && thisLink.children.length > 0 && (
              <div className='absolute left-0 top-0 h-full w-full rounded-full bg-faint opacity-40'></div>
            )}
            <div className='absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted'></div>
          </div>
        </div>
        <div
          className='cursor-pointer hover:underline'
          onClick={() =>
            app.workspace.openLinkText(link, getStore('current') ?? '/', false)
          }
        >
          {link.includes('/') ? link.slice(link.lastIndexOf('/') + 1) : link}
        </div>
      </div>
      {sortedLinks && !collapsed && (
        <div className='pl-6'>
          {sortedLinks.map((link) => (
            <Link type={type} link={link} key={link} />
          ))}
        </div>
      )}
    </div>
  )
}
