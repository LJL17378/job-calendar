import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

const signInWithOtp = vi.fn()
const verifyEmailOtp = vi.fn()

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    session: null,
    demoMode: false,
    signInWithOtp,
    verifyEmailOtp,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithOtp.mockReset().mockResolvedValue(null)
    verifyEmailOtp.mockReset().mockResolvedValue(null)
  })

  it('supports manually entering the emailed six-digit code', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'me@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: '发送验证码' }))

    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledWith('me@example.com'))
    const input = await screen.findByLabelText('验证码')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveAttribute('autocomplete', 'one-time-code')

    fireEvent.change(input, { target: { value: '12a3456' } })
    expect(input).toHaveValue('123456')
    fireEvent.click(screen.getByRole('button', { name: '验证并登录' }))

    await waitFor(() => expect(verifyEmailOtp).toHaveBeenCalledWith('me@example.com', '123456'))
  })
})
