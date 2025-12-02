import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ArcBot Console', () => {
  render(<App />);
  const headingElement = screen.getByText(/ArcBot Console/i);
  expect(headingElement).toBeInTheDocument();
});