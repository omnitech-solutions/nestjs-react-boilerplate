import { render, screen } from '@testing-library/react'
import React from 'react'

import App from './App'

test('renders dashboard title', () => {
  render(<App />)
  expect(screen.getByText(/Organizational Health Dashboard/i)).toBeInTheDocument()
})
