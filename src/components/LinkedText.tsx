import { Fragment, type ReactNode } from 'react'

const urlPattern = /(https?:\/\/[^\s<]+)/g

export function LinkedText({ children }: { children: string }) {
  const parts = children.split(urlPattern)
  return <>{parts.map((part, index): ReactNode => {
    if (!part.match(/^https?:\/\//)) return part
    const [, url, punctuation = ''] = part.match(/^(.*?)([),.;!?，。！？）]*)$/) ?? []
    return <Fragment key={`${part}-${index}`}><a href={url} target="_blank" rel="noreferrer">{url}</a>{punctuation}</Fragment>
  })}</>
}
