/**
 * Hook para verificar permissões de ações CRUD.
 * Regra de negócio: apenas admins podem deletar dados.
 */

import { useUserRole } from "./useUserRole";

export function usePermissions() {
  const { isAdmin, role } = useUserRole();

  return {
    canCreate: !!role, // Qualquer usuário autenticado pode criar
    canEdit: !!role, // Qualquer usuário autenticado pode editar
    canDelete: isAdmin, // Apenas admin pode deletar
    isAdmin,
    role,
  };
}
