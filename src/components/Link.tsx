import { useRef, useState } from 'react'
import { getStore, useStore } from '../services/store'
import invariant from 'tiny-invariant'
import { Transition } from 'react-transition-group'
import {
  TransitionActions,
  TransitionStatus,
} from 'react-transition-group/Transition'
import _ from 'lodash'

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
  const [loadedChildren, setLoadedChildren] = useState(false)

  const loadChildren = () => {
    const links = getStore(type === 'link' ? 'links' : 'backlinks')
    const obsidianAPI = getStore('obsidianAPI')
    invariant(obsidianAPI)
    for (let child of thisLink.children) {
      if (!links[child]) {
        obsidianAPI.loadLink(type, link)
        break
      }
    }
    setLoadedChildren(true)
  }

  if (!thisLink) {
    throw new Error('loading nonexistent link')
  }

  const sortedLinks = thisLink.children?.sort()

  const nodeRef = useRef<HTMLDivElement>(null)
  const transitionStyles: Partial<
    Record<TransitionStatus, React.CSSProperties>
  > = {
    entering: { maxHeight: sortedLinks.length * 20 },
    entered: { maxHeight: '' },
    exiting: { maxHeight: sortedLinks.length * 20 },
    exited: { maxHeight: 0 },
  }

  const matchedSearch = useStore(
    (state) =>
      !state.search || new RegExp(_.escapeRegExp(state.search), 'i').test(link)
  )

  return (
    <div>
      {matchedSearch && (
        <div className='flex'>
          <div
            className='flex w-6 flex-none items-center pl-1'
            onClick={() => {
              if (collapsed) loadChildren()
              setCollapsed(!collapsed)
            }}
          >
            <div className='relative h-4 w-4'>
              {thisLink.children.length > 0 && (
                <div
                  className={`absolute left-0 top-0 h-full w-full rounded-full bg-faint transition-opacity duration-300 ${
                    !collapsed ? 'opacity-0' : 'opacity-40'
                  }`}
                ></div>
              )}
              <div className='absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted'></div>
            </div>
          </div>
          <div
            className='cursor-pointer hover:underline'
            onClick={() =>
              app.workspace.openLinkText(
                link,
                getStore('current') ?? '/',
                false
              )
            }
          >
            {link.includes('/') ? link.slice(link.lastIndexOf('/') + 1) : link}
          </div>
        </div>
      )}
      {sortedLinks && (
        <Transition nodeRef={nodeRef} in={!collapsed} appear timeout={250}>
          {(state) => (
            <div
              className='pl-6'
              ref={nodeRef}
              style={{
                transition: `max-height ${250}ms ease-in-out`,
                maxHeight: 0,
                overflow: 'hidden',
                ...transitionStyles[state],
              }}
            >
              {loadedChildren &&
                sortedLinks.map((link) => (
                  <Link type={type} link={link} key={link} />
                ))}
            </div>
          )}
        </Transition>
      )}
    </div>
  )
}
