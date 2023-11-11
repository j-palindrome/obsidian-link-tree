import { useRef, useState, useMemo } from 'react'
import { getObsidianAPI, getStore, useStore } from '../services/store'
import invariant from 'tiny-invariant'
import { Transition } from 'react-transition-group'
import {
  TransitionActions,
  TransitionStatus,
} from 'react-transition-group/Transition'
import _ from 'lodash'
import { Link } from '../services/ObsidianAPI'
import $ from 'jquery'
import Logo from 'packages/obsidian-components/Logo'
import Button from 'packages/obsidian-components/Button'
import Note from './Note'

export default function Link({
  link,
  forward,
  back,
  parents,
  backlinkTo,
}: {
  link: string
  forward: boolean
  back: boolean
  parents: Set<string>
  backlinkTo: string
}) {
  const showForward = useStore((state) => state.showForward)
  const showBack = useStore((state) => state.showBack)

  const thisLink = useStore((state) => state.links[link] as Link | undefined)

  const [collapsed, setCollapsed] = useState(true)
  const [loadedChildren, setLoadedChildren] = useState(false)

  const shownChildren = thisLink?.children.filter(
    ({ forward, back, link: childLink }) =>
      ((forward && showForward) || (back && showBack)) &&
      childLink !== link &&
      !parents.has(childLink)
  )

  const nodeRef = useRef<HTMLDivElement>(null)

  const matchedSearch = useStore(
    (state) =>
      !state.search || new RegExp(_.escapeRegExp(state.search), 'i').test(link)
  )

  const childrenHeight = !nodeRef.current
    ? thisLink?.children.length ?? 0 * 20
    : $(nodeRef.current)
        .children()
        .toArray()
        .reduce((total, el) => total + el.getBoundingClientRect().height, 0)
  const transitionStyles: Partial<
    Record<TransitionStatus, React.CSSProperties>
  > = {
    entering: {
      maxHeight: !thisLink?.children ? 0 : childrenHeight,
    },
    entered: { maxHeight: '' },
    exiting: {
      maxHeight: !thisLink?.children ? 0 : childrenHeight,
    },
    exited: { maxHeight: 0 },
  }

  const newParents = new Set(parents)
  newParents.add(link)
  if (thisLink)
    thisLink.children
      .map((child) => child.link)
      .forEach((child) => newParents.add(child))

  const [showingNotes, setShowingNotes] = useState<'one' | 'all' | 'none'>(
    'none'
  )

  const shownNotes = useMemo(() => {
    const linkTest = new RegExp(
      `\\[\\[(.*?\\/)?${_.escapeRegExp(
        backlinkTo.slice(
          backlinkTo.includes('/') ? backlinkTo.lastIndexOf('/') + 1 : 0
        )
      )}(#.*?)?(\\|.*?)?\\]\\]`
    )
    return showingNotes === 'none'
      ? []
      : showingNotes === 'all'
      ? thisLink?.notes
      : !back
      ? thisLink?.notes?.slice(0, 1)
      : thisLink?.notes?.filter((note) => {
          return linkTest.test(note.text)
        })
  }, [backlinkTo, thisLink?.notes, showingNotes])

  return (
    <div>
      {matchedSearch && (
        <>
          <div className='flex'>
            <div
              className='flex w-6 flex-none items-center pl-1'
              onClick={() => {
                if (!loadedChildren) {
                  getObsidianAPI().loadLinkChildren(link)
                  setLoadedChildren(true)
                  setTimeout(() => setCollapsed(!collapsed))
                } else setCollapsed(!collapsed)
              }}
            >
              <div className='relative h-4 w-4'>
                {shownChildren && shownChildren.length > 0 && (
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
              className={`w-full cursor-pointer hover:underline ${
                !thisLink ? 'text-faint line-through' : ''
              }`}
              onClick={() =>
                app.workspace.openLinkText(
                  link,
                  getStore('current') ?? '/',
                  false
                )
              }
            >
              {link.includes('/')
                ? link.slice(link.lastIndexOf('/') + 1)
                : link}
              {!thisLink ? ' [not loaded]' : ''}
            </div>
            <div
              onClick={async () => {
                if (showingNotes === 'none')
                  await getObsidianAPI().loadNotes(link)
                setShowingNotes(
                  showingNotes === 'none'
                    ? 'one'
                    : showingNotes === 'one'
                    ? 'all'
                    : 'none'
                )
              }}
              className='mx-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-faint mouse:hover:border mouse:hover:border-solid'
            >
              <Logo
                src={
                  showingNotes === 'none'
                    ? 'more-horizontal'
                    : showingNotes === 'one'
                    ? 'chevron-down'
                    : 'chevron-up'
                }
                className='h-full w-full text-faint'
              />
            </div>
            {back && (
              <Logo src='arrow-left' className='h-3 w-3 flex-none opacity-75' />
            )}
            {forward && (
              <Logo
                src='arrow-right'
                className='h-3 w-3 flex-none opacity-75'
              />
            )}
          </div>
          {showingNotes && shownNotes && (
            <div className='pl-6'>
              {shownNotes.map((note) => (
                <Note key={note.line} {...{ note, link }} />
              ))}
            </div>
          )}
        </>
      )}
      {shownChildren && shownChildren.length > 0 && loadedChildren && (
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
              {shownChildren.map(({ link: childLink, forward, back }) => (
                <Link
                  key={childLink}
                  {...{ link: childLink, forward, back }}
                  parents={newParents}
                  backlinkTo={link}
                />
              ))}
            </div>
          )}
        </Transition>
      )}
    </div>
  )
}
