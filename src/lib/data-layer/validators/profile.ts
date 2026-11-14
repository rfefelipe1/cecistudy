/**
 * Schema Zod para a coleção `profile` (SPEC-M-029 D3).
 *
 * Protege contra sobrescrita acidental do nome do usuário (D6) e contra
 * dados corrompidos entrando no disco.
 *
 * Todos os campos são opcionais para permitir leitura de perfis legados
 * (retrocompatível), mas `name` é validado como string quando presente.
 */

import { z } from 'zod';

export const userProfileSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().optional(),
  semester: z.number().int().min(1).max(12).optional(),
  totalSemesters: z.number().int().min(1).max(12).optional(),
  university: z.string().optional(),
  targetCareer: z.string().optional(),
  stickersCollected: z.number().int().min(0).optional(),
  categoryXp: z.record(z.string(), z.number()).optional(),
  photoUrl: z.string().optional(),
  coverPhotoUrl: z.string().optional(),
  nomeAutorizado: z.boolean().optional(),
  internshipGoalHours: z.number().int().min(1).max(5000).optional(),
});

/** Tipo inferido do schema. */
export type UserProfileInput = z.infer<typeof userProfileSchema>;

/**
 * Valida um objeto de profile. Retorna o objeto validado ou lança erro.
 */
export function validarProfile(valor: unknown): UserProfileInput {
  return userProfileSchema.parse(valor);
}
