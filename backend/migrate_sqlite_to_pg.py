"""
One-time migration: copy all data from assets.db (SQLite) → assetflow (PostgreSQL).
Run once, then delete this file.
"""
import sqlite3
import psycopg2
import psycopg2.extras

SQLITE_PATH = "./assets.db"
PG_DSN = "postgresql://assetflow_user:CavanCredit1!@localhost:5432/assetflow"

BOOL_COLUMNS = {
    "users": {"is_active", "is_superuser"},
    "deployment_steps": {"required"},
    "template_steps": {"required"},
}

TABLES = [
    "clients",
    "users",
    "user_client_access",
    "devices",
    "device_assignments",
    "device_status_logs",
    "repair_logs",
    "qr_labels",
    "checklist_templates",
    "template_steps",
    "deployments",
    "deployment_steps",
    "step_photos",
]

def migrate():
    sq = sqlite3.connect(SQLITE_PATH)
    sq.row_factory = sqlite3.Row
    pg = psycopg2.connect(PG_DSN)
    pg.autocommit = False
    cur_pg = pg.cursor()

    for table in TABLES:
        # Check table exists in SQLite
        row = sq.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
        ).fetchone()
        if not row:
            print(f"  SKIP {table} (not in SQLite)")
            continue

        rows = sq.execute(f"SELECT * FROM {table}").fetchall()
        if not rows:
            print(f"  SKIP {table} (empty)")
            continue

        cols = rows[0].keys()
        col_list = ", ".join(f'"{c}"' for c in cols)
        placeholders = ", ".join(["%s"] * len(cols))

        cur_pg.execute(f"ALTER TABLE {table} DISABLE TRIGGER ALL")
        cur_pg.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")

        bool_cols = BOOL_COLUMNS.get(table, set())
        # also check if the PG table name differs from SQLite
        sqlite_table = "template_steps" if table == "checklist_steps" else table

        def cast_row(r):
            return tuple(
                bool(r[c]) if c in bool_cols else r[c]
                for c in cols
            )

        data = [cast_row(r) for r in rows]
        psycopg2.extras.execute_batch(
            cur_pg,
            f"INSERT INTO {table} ({col_list}) VALUES ({placeholders})",
            data,
            page_size=500,
        )
        print(f"  OK  {table}: {len(data)} rows")

        # Reset sequence to max id if table has one
        if "id" in cols:
            cur_pg.execute(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'id'),
                    COALESCE(MAX(id), 1)
                ) FROM {table}
            """)

    pg.commit()
    pg.close()
    sq.close()
    print("\nMigration complete.")

if __name__ == "__main__":
    migrate()
