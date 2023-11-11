import { getStore, useStore } from '../services/store'
import Logo from '../../../../../packages/obsidian-components/Logo'

export default function Search() {
  const search = useStore((state) => state.search)

  return (
    <div className='flex w-full items-center'>
      <div className='flex w-6 flex-none justify-center'>
        <Logo src='search' className=' h-3 w-3' />
      </div>
      <input
        placeholder='search...'
        className='w-full rounded-lg border-none bg-transparent font-menu shadow-none'
        value={search}
        onChange={(ev) => {
          const setState = getStore('setState')
          setState({ search: ev.target.value })
        }}
      ></input>
    </div>
  )
}
