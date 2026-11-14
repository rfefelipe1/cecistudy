import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormGuard } from '../useFormGuard';

const STORAGE_PREFIX = 'cecistudy_';

function limparStorage() {
  localStorage.clear();
}

const inicial = { nome: '', email: '' };
const estaSujo = (v: typeof inicial) => !!v.nome.trim() || !!v.email.trim();

function montar(over: Partial<Parameters<typeof useFormGuard>[0]> = {}) {
  const { aoContinuarRegistro, aoComecarNovo, ...resto } = over;
  return renderHook(() =>
    useFormGuard<typeof inicial>({
      ...resto,
      chave: 'teste-form',
      inicial,
      estaSujo,
      aoContinuarRegistro: aoContinuarRegistro ?? (() => void 0),
      aoComecarNovo: aoComecarNovo ?? (() => void 0),
    }),
  );
}

describe('useFormGuard', () => {
  beforeEach(() => {
    limparStorage();
  });

  afterEach(() => {
    limparStorage();
  });

  it('não está sujo no início', () => {
    const { result } = montar();
    expect(result.current.sujo).toBe(false);
  });

  it('fica sujo quando um campo muda', () => {
    const { result } = montar();
    act(() => {
      result.current.patch({ nome: 'Fulano' });
    });
    expect(result.current.sujo).toBe(true);
  });

  it('volta a não estar sujo quando volta ao valor inicial', () => {
    const { result } = montar();
    act(() => {
      result.current.patch({ nome: 'Fulano' });
      result.current.patch({ nome: '' });
    });
    expect(result.current.sujo).toBe(false);
  });

  it('persiste o rascunho no localStorage a cada mudança', () => {
    const { result } = montar();
    act(() => {
      result.current.patch({ nome: 'Fulano' });
    });
    const salvo = localStorage.getItem(STORAGE_PREFIX + 'wizard_draft_teste-form');
    expect(salvo).toBeTruthy();
    expect(JSON.parse(salvo!).nome).toBe('Fulano');
  });

  it('restaurarOuNovo retorna false quando há rascunho e não decidiu', () => {
    limparStorage();
    localStorage.setItem(
      STORAGE_PREFIX + 'wizard_draft_teste-form',
      JSON.stringify({ nome: 'Fulano', email: '' }),
    );
    const { result } = montar();
    act(() => {
      result.current.restaurarOuNovo();
    });
    expect(result.current.restaurarOuNovo()).toBe(false);
  });

  it('restaurarOuNovo retorna true quando não há rascunho', () => {
    const { result } = montar();
    act(() => {
      result.current.restaurarOuNovo();
    });
    expect(result.current.restaurarOuNovo()).toBe(true);
  });

  it('continuarRegistro chama aoContinuarRegistro com os valores', () => {
    const aoContinuarRegistro = vi.fn();
    const { result } = montar({ aoContinuarRegistro });
    act(() => {
      result.current.patch({ nome: 'Fulano' });
    });
    act(() => {
      result.current.continuarRegistro();
    });
    expect(aoContinuarRegistro).toHaveBeenCalledWith({ nome: 'Fulano', email: '' });
  });

  it('comecarNovo chama aoComecarNovo e limpa valores', () => {
    const aoComecarNovo = vi.fn();
    const { result } = montar({ aoComecarNovo });
    act(() => {
      result.current.patch({ nome: 'Fulano' });
    });
    act(() => {
      result.current.comecarNovo();
    });
    expect(aoComecarNovo).toHaveBeenCalledTimes(1);
    expect(result.current.valores).toEqual(inicial);
    expect(result.current.sujo).toBe(false);
  });

  it('descartar limpa rascunho e reseta valores', () => {
    const { result } = montar();
    act(() => {
      result.current.patch({ nome: 'Fulano' });
    });
    act(() => {
      result.current.descartar();
    });
    expect(result.current.valores).toEqual(inicial);
    expect(result.current.sujo).toBe(false);
  });

  it('requestClose confirma diretamente quando não está sujo', () => {
    const aoConfirmar = vi.fn();
    const { result } = montar();
    act(() => {
      result.current.requestClose(aoConfirmar);
    });
    expect(aoConfirmar).toHaveBeenCalledTimes(1);
    expect(result.current.confirmando).toBe(false);
  });

  it('requestClose abre confirmação quando está sujo', () => {
    const aoConfirmar = vi.fn();
    const { result } = montar();
    act(() => {
      result.current.patch({ nome: 'Fulano' });
    });
    act(() => {
      result.current.requestClose(aoConfirmar);
    });
    expect(aoConfirmar).not.toHaveBeenCalled();
    expect(result.current.confirmando).toBe(true);
  });

  it('setConfirmando fecha a confirmação', () => {
    const aoConfirmar = vi.fn();
    const { result } = montar();
    act(() => {
      result.current.patch({ nome: 'Fulano' });
    });
    act(() => {
      result.current.requestClose(aoConfirmar);
    });
    expect(result.current.confirmando).toBe(true);
    act(() => {
      result.current.setConfirmando(false);
    });
    expect(result.current.confirmando).toBe(false);
  });
});
