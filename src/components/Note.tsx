import ContentEditable from 'react-contenteditable'
import useStateRef from 'react-usestateref'
import { Link } from '../services/ObsidianAPI'
import { getObsidianAPI } from '../services/store'

export default function Note({
  link,
  note,
}: {
  link: string
  note: NonNullable<Link['notes']>[number]
}) {
  const { text, line } = note
  const [thisText, setThisText, thisTextRef] = useStateRef<string>(text)

  const updateText = () => {
    getObsidianAPI().updateText(link, {
      text: thisTextRef.current.replace(/<[^>]+>/g, ''),
      line,
    })
  }

  return (
    <ContentEditable
      suppressContentEditableWarning
      onChange={(ev) => setThisText(ev.target.value)}
      html={thisText}
      className='my-1 w-full font-serif text-sm text-muted'
      onBlur={updateText}
    />
  )
}
