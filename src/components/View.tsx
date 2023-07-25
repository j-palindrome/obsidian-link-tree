import _ from 'lodash'
import { useStore } from '../services/store'
import Link from './Link'
import Search from './Search'
import Button from 'packages/obsidian-components/Button'
import { Fragment } from 'react'

export default function View() {
  const current = useStore((state) => state.current)
  const currentLink = useStore((state) =>
    current ? state.links[current] : undefined
  )
  const showForward = useStore((state) => state.showForward)
  const showBack = useStore((state) => state.showBack)
  const setState = useStore((state) => state.setState)

  const segments = current ? current.split('/').slice(0, -1) : []
  const currentParents =
    current && currentLink
      ? [current, ...currentLink.children.map((child) => child.link)]
      : []

  return (
    <div id='link-tree' style={{ height: '100%', width: '100%' }}>
      <Search />

      {current && currentLink && (
        <div className='h-full w-full overflow-y-auto'>
          <div className='my-2 pl-2'>
            <div
              className='selectable flex flex-wrap items-center space-x-1 rounded-lg'
              onClick={() => {
                app.commands.executeCommandById(
                  'file-explorer:reveal-active-file'
                )
              }}
            >
              {segments.map((segment, i) => {
                const pathSegment = segments.slice(0, i + 1).join('/')
                return (
                  <Fragment key={segments.slice(0, i + 1).join('/')}>
                    <div className='text-muted'>{segment}</div>
                    {i < segments.length - 1 && (
                      <div className='text-faint'>/</div>
                    )}
                  </Fragment>
                )
              })}
            </div>
            <div className='text-lg font-bold'>
              {current.includes('/')
                ? current.slice(current.lastIndexOf('/') + 1)
                : current}
            </div>
          </div>
          <div className='flex space-x-2 pb-2'>
            <Button
              src='arrow-left'
              className={`w-1/2 ${
                showBack
                  ? 'border border-solid border-faint bg-primary-alt'
                  : ''
              }`}
              onClick={() => setState({ showBack: !showBack })}
            />
            <Button
              src='arrow-right'
              className={`w-1/2 ${
                showForward
                  ? 'border border-solid border-faint bg-primary-alt'
                  : ''
              }`}
              onClick={() => setState({ showForward: !showForward })}
            />
          </div>
          {currentLink.children
            .filter(
              ({ forward, back }) =>
                (forward && showForward) || (back && showBack)
            )
            .map(({ link, forward, back }) => (
              <Link
                key={link}
                link={link}
                forward={forward}
                back={back}
                parents={new Set(currentParents)}
                backlinkTo={current}
              />
            ))}
        </div>
      )}
    </div>
  )
}
