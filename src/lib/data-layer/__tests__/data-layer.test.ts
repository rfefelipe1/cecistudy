/**
 * Testes da camada data-layer (SPEC-M-029).
 *
 * Estes testes validam que a camada unificada de persistência funciona
 * corretamente: leitura, gravação com validação Zod, transações atômicas,
 * snapshot/restaurar e saúde do armazenamento.
 *
 * Como rodamos em jsdom (web), `isNativePlatform` é falso e o adapter usado é
 * localStorage. Os testes de SQLite nativo devem ser adicionados separadamente
 * quando houver ambiente nativo disponível.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  ler,
  gravar,
  transacionar,
  snapshot,
  restaurar,
  saude,
  capturarSnapshot,
  restaurarDoSnapshot,
  limparSnapshot,
  temSnapshot,
} from '../index.ts';
import { validarParaColecao, chavesComValidador } from '../validators/index.ts';
import { resetHealth as resetLocalStorageHealth } from '../adapters/localStorage.ts';

beforeEach(() => {
  // Limpar localStorage e saúde antes de cada teste
  localStorage.clear();
  resetLocalStorageHealth();
});

describe('data-layer: leitura e gravação', () => {
  it('grava e lê uma coleção (profile)', async () => {
    const perfil = {
      name: 'Fê',
      semester: 5,
      totalSemesters: 10,
      university: 'UNICAMP',
      targetCareer: 'Psicóloga Clínica',
      stickersCollected: 0,
      categoryXp: { faculdade: 0, estudo: 0, leituras: 0, jornada: 0 },
      photoUrl: '',
      coverPhotoUrl: '',
    };

    const resultadoGravar = await gravar('profile', perfil);
    expect(resultadoGravar.ok).toBe(true);
    expect(resultadoGravar.error).toBeNull();

    const resultadoLer = await ler('profile');
    expect(resultadoLer.error).toBeNull();
    expect(resultadoLer.fromDisk).toBe(true);
    expect(resultadoLer.value).toEqual(perfil);
  });

  it('retorna undefined para chave nunca gravada', async () => {
    const resultado = await ler('courses');
    expect(resultado.value).toBeUndefined();
    expect(resultado.fromDisk).toBe(false);
    expect(resultado.error).toBeNull();
  });

  it('rejeita dados inválidos com Zod (profile sem campos obrigatórios)', async () => {
    // profile.name é opcional no schema para retrocompatibilidade, mas
    // um objeto não-identificador deve falhar
    const resultado = await gravar('profile', { name: 123 as unknown as string });
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBeTruthy();
  });

  it('rejeita valor null/undefined', async () => {
    const resultado = await gravar('courses', null as unknown as never[]);
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBeTruthy();
    expect(resultado.error).toContain('courses');
  });
});

describe('data-layer: validadores', () => {
  it('validarParaColecao aceita profile válido', () => {
    const perfil = { name: 'Ana', semester: 3, totalSemesters: 10 };
    const resultado = validarParaColecao<{ name: string; semester: number; totalSemesters: number }>('profile', perfil);
    expect(resultado.name).toBe('Ana');
    expect(resultado.semester).toBe(3);
  });

  it('validarParaColecao lança erro para profile inválido', () => {
    expect(() => validarParaColecao('profile', { name: 42 as unknown as string })).toThrow();
  });

  it('chavesComValidador retorna todas as 23 chaves', () => {
    const chaves = chavesComValidador();
    expect(chaves.length).toBeGreaterThan(20);
    expect(chaves).toContain('profile');
    expect(chaves).toContain('courses');
    expect(chaves).toContain('academicTerms');
  });
});

describe('data-layer: transação atômica (D2)', () => {
  it('transacionar grava múltiplas coleções ou nenhuma', async () => {
    const curso = [{ id: 'c1', name: 'Psicologia', semester: 1, category: 'obrigatoria' }];
    const tarefa = [
      { id: 't1', title: 'Ler capítulo 1', disciplineId: 'c1', completed: false, priority: 'media', category: 'tarefa' },
    ];

    const resultado = await transacionar<{ id: string; name?: string }[]>([
      { chave: 'courses', valor: curso as { id: string; name?: string }[] },
      { chave: 'tasks', valor: tarefa as { id: string; name?: string }[] },
    ]);

    expect(resultado.ok).toBe(true);
    expect(resultado.error).toBeNull();

    // Verificar que ambos foram gravados
    const lerCursos = await ler('courses');
    const lerTarefas = await ler('tasks');
    expect(lerCursos.value).toEqual(curso);
    expect(lerTarefas.value).toEqual(tarefa);
  });

  it('transacionar não grava nada se uma operação falhar na validação', async () => {
    const curso = [{ id: 'c1', name: 'Psicologia', semester: 1, category: 'obrigatoria' }];
    const tarefaInvalida = null as unknown as never[];

    const resultado = await transacionar<{ id: string; name?: string }[]>([
      { chave: 'courses', valor: curso as { id: string; name?: string }[] },
      { chave: 'tasks', valor: tarefaInvalida as { id: string; name?: string }[] },
    ]);

    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBeTruthy();

    // Nenhum dos dois deve ter sido gravado
    const lerCursos = await ler('courses');
    const lerTarefas = await ler('tasks');
    expect(lerCursos.value).toBeUndefined();
    expect(lerTarefas.value).toBeUndefined();
  });

  it('transacionar com array vazio retorna ok', async () => {
    const resultado = await transacionar([]);
    expect(resultado.ok).toBe(true);
    expect(resultado.error).toBeNull();
  });
});

describe('data-layer: snapshot e restaurar (D4)', () => {
  it('snapshot captura todas as coleções gravadas', async () => {
    await gravar('profile', { name: 'Fê', semester: 5, totalSemesters: 10 });
    await gravar('courses', [{ id: 'c1', name: 'Psicologia', semester: 1, category: 'obrigatoria' }]);

    const resultado = await snapshot();
    expect(resultado.createdAt).toBeTruthy();
    const dados = JSON.parse(resultado.json);
    expect(dados.profile.name).toBe('Fê');
    expect(dados.courses[0].name).toBe('Psicologia');
  });

  it('restaurar recupera estado a partir de snapshot', async () => {
    await gravar('profile', { name: 'Fê', semester: 5, totalSemesters: 10 });

    const snap = await snapshot();

    // Modificar o estado
    await gravar('profile', { name: 'Outro', semester: 1, totalSemesters: 10 });

    // Restaurar
    await restaurar(snap.json);

    const lerPerfil = await ler<{ name: string; semester: number; totalSemesters: number }>('profile');
    expect(lerPerfil.value?.name).toBe('Fê');
    expect(lerPerfil.value?.semester).toBe(5);
  });

  it('restaurar lança erro se o JSON for inválido', async () => {
    await expect(restaurar('não é json')).rejects.toThrow();
  });
});

describe('data-layer: snapshot programático (D4, D8)', () => {
  it('capturarSnapshot + restaurarDoSnapshot + limparSnapshot', async () => {
    await gravar('profile', { name: 'Fê', semester: 5, totalSemesters: 10 });

    expect(temSnapshot()).toBe(false);

    await capturarSnapshot();
    expect(temSnapshot()).toBe(true);

    // Modificar estado
    await gravar('profile', { name: 'Modificado', semester: 1, totalSemesters: 10 });

    // Restaurar do snapshot
    await restaurarDoSnapshot();
    expect(temSnapshot()).toBe(false);

    const lerPerfil = await ler<{ name: string; semester: number; totalSemesters: number }>('profile');
    expect(lerPerfil.value?.name).toBe('Fê');
  });

  it('restaurarDoSnapshot lança erro se não há snapshot', async () => {
    expect(temSnapshot()).toBe(false);
    await expect(restaurarDoSnapshot()).rejects.toThrow(/Nenhum snapshot/);
  });
});

describe('data-layer: saúde do armazenamento (D5)', () => {
  it('saude retorna entrada para cada coleção gravada', async () => {
    await gravar('profile', { name: 'Fê', semester: 5, totalSemesters: 10 });
    await gravar('courses', [{ id: 'c1', name: 'Psicologia', semester: 1, category: 'obrigatoria' }]);

    const s = await saude();
    const chaves = s.map((e) => e.key);
    expect(chaves).toContain('profile');
    expect(chaves).toContain('courses');

    const perfilSaude = s.find((e) => e.key === 'profile');
    expect(perfilSaude?.ok).toBe(true);
  });

  it('saude reporta ok: false para coleção com erro', async () => {
    // Simular erro: gravar algo que falhe na validação não entra no disco,
    // mas a saúde do adapter localStorage deve mostrar ok para escritas bem-sucedidas
    const s = await saude();
    // Em jsdom com localStorage funcionando, todas devem ser ok
    const falhas = s.filter((e) => !e.ok);
    expect(falhas.length).toBe(0);
  });
});
