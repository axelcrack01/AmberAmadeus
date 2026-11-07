BEGIN;
CREATE TABLE IF NOT EXISTS inventario (
 producto_id integer PRIMARY KEY REFERENCES productos(id), sku varchar(40) NOT NULL UNIQUE,
 unidad varchar(10) NOT NULL CHECK(unidad IN ('unidad','g','ml')),
 minimo integer NOT NULL CHECK(minimo>=0), stock integer NOT NULL DEFAULT 0 CHECK(stock>=0),
 activo boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS kardex (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 producto_id integer NOT NULL REFERENCES inventario(producto_id),
 fecha_hora timestamptz NOT NULL DEFAULT clock_timestamp(), tipo varchar(20) NOT NULL,
 cantidad integer NOT NULL CHECK(cantidad>0), anterior integer NOT NULL CHECK(anterior>=0),
 saldo integer NOT NULL CHECK(saldo>=0), solicitud_id uuid NOT NULL,
 referencia varchar(100) NOT NULL, motivo varchar(200) NOT NULL,
 usuario_id integer NOT NULL REFERENCES usuarios(id),
 UNIQUE(solicitud_id,producto_id),
 CHECK ((tipo IN ('ENTRADA','AJUSTE_ENTRADA') AND saldo=anterior+cantidad)
 OR (tipo IN ('SALIDA','AJUSTE_SALIDA','VENTA') AND saldo=anterior-cantidad))
);
CREATE INDEX IF NOT EXISTS kardex_producto_fecha ON kardex(producto_id,fecha_hora,id);
CREATE TABLE IF NOT EXISTS inventario_auditoria (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, fecha_hora timestamptz NOT NULL DEFAULT clock_timestamp(),
 producto_id integer NOT NULL REFERENCES productos(id), usuario_id integer NOT NULL REFERENCES usuarios(id),
 antes jsonb, despues jsonb NOT NULL
);
CREATE OR REPLACE FUNCTION impedir_cambio_kardex() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Histórico inmutable; registre un movimiento compensatorio'; END $$;
DROP TRIGGER IF EXISTS kardex_inmutable ON kardex;
CREATE TRIGGER kardex_inmutable BEFORE UPDATE OR DELETE ON kardex FOR EACH ROW EXECUTE FUNCTION impedir_cambio_kardex();
COMMIT;
