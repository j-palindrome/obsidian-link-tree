import _ from 'lodash'
import { useStore } from '../services/store'
import Link from './Link'
import Search from './Search'

export default function View() {
  const current = useStore((state) => state.current)
  const links = useStore((state) =>
    current ? state.links[current]?.children ?? [] : []
  )
  const backlinks = useStore((state) =>
    current ? state.backlinks[current]?.children ?? [] : []
  )

  const sortedLinks = links.sort()
  const sortedBacklinks = backlinks.sort()

  return (
    <div id='link-tree' style={{ height: '100%', width: '100%' }}>
      <Search />
      {current && (
        <div className='h-full w-full'>
          <div className='pl-6 font-menu text-sm text-faint'>backlinks</div>
          {sortedBacklinks.map((link) => (
            <Link key={link} link={link} type='backlink' />
          ))}
          <div className='my-2 pl-2 text-lg font-bold'>
            {current.includes('/')
              ? current.slice(current.lastIndexOf('/') + 1)
              : current}
          </div>
          <div className='pl-6 font-menu text-sm text-faint'>links</div>
          {sortedLinks.map((link) => (
            <Link key={link} link={link} type='link' />
          ))}
        </div>
      )}
    </div>
  )
}
