import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LinkedText } from './LinkedText'

describe('LinkedText', () => {
  it('renders pasted web links as safe external links', () => {
    render(<p><LinkedText>会议地址 https://example.com/interview</LinkedText></p>)
    expect(screen.getByRole('link', { name: 'https://example.com/interview' })).toHaveAttribute('href', 'https://example.com/interview')
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noreferrer')
  })
})
