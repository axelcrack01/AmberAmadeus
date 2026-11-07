-- Solo rollback previo a uso. Si existen movimientos, conservar histórico y restaurar backup validado.
BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM kardex) OR EXISTS(SELECT 1 FROM inventario_auditoria) THEN
 RAISE EXCEPTION 'Rollback bloqueado: hay auditoría o movimientos. No se elimina histórico.'; END IF; END $$;
DROP TABLE kardex;
DROP TABLE inventario_auditoria;
DROP TABLE inventario;
DROP FUNCTION impedir_cambio_kardex();
COMMIT;
