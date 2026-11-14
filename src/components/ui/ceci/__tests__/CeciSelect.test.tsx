import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciSelect } from '../CeciSelect';

const OPTIONS = [
  { value: 'a', label: 'opção a' },
  { value: 'b', label: 'opção b', hint: 'dica b' },
];

describe('CeciSelect', () => {
  it('mostra o label da opção selecionada no trigger', () => {
    render(<CeciSelect value="a" onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByRole('button', { name: 'opção a' })).toBeInTheDocument();
  });

  it('mostra placeholder quando não há seleção', () => {
    render(<CeciSelect value={null} onChange={() => {}} options={OPTIONS} placeholder="escolher…" />);
    expect(screen.getByRole('button', { name: 'escolher…' })).toBeInTheDocument();
  });

  it('exibe hint da opção selecionada abaixo do trigger', () => {
    render(<CeciSelect value="b" onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByText('dica b')).toBeInTheDocument();
  });

});
