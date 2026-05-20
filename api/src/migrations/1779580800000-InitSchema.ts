import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the schema for the migrated Flask app.
 *
 * The `users` table already exists in Supabase and is intentionally left
 * untouched. This migration creates the remaining 10 tables backing the
 * TypeORM entities. No foreign-key constraints are added because the entities
 * declare plain columns rather than relations — matching the original SQLite
 * schema, which joined on bare integer columns.
 */
export class InitSchema1779580800000 implements MigrationInterface {
  name = 'InitSchema1779580800000';

  private readonly tables = [
    'refunds',
    'notifications',
    'purchase_items',
    'purchases',
    'sale_items',
    'sales',
    'inventory_stock',
    'products',
    'warehouses',
    'suppliers',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statements = [
      `CREATE TABLE "suppliers" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL
      )`,
      `CREATE TABLE "warehouses" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL
      )`,
      `CREATE TABLE "products" (
        "id" SERIAL PRIMARY KEY,
        "sku" character varying NOT NULL,
        "name" character varying NOT NULL,
        "price" double precision NOT NULL,
        "category" character varying NOT NULL,
        "supplier_id" integer,
        "deleted_at" timestamptz
      )`,
      `CREATE TABLE "inventory_stock" (
        "id" SERIAL PRIMARY KEY,
        "product_id" integer NOT NULL,
        "warehouse_id" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 0,
        "last_audit_at" timestamptz
      )`,
      `CREATE TABLE "sales" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "customer_type" character varying NOT NULL,
        "subtotal" double precision NOT NULL,
        "total" double precision NOT NULL,
        "status" character varying NOT NULL,
        "last_touch_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE "sale_items" (
        "id" SERIAL PRIMARY KEY,
        "sale_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "qty" integer NOT NULL,
        "unit_price" double precision NOT NULL
      )`,
      `CREATE TABLE "purchases" (
        "id" SERIAL PRIMARY KEY,
        "supplier_id" integer NOT NULL,
        "total" double precision NOT NULL,
        "received_date" date NOT NULL,
        "status" character varying NOT NULL,
        "bank_ref" character varying
      )`,
      `CREATE TABLE "purchase_items" (
        "id" SERIAL PRIMARY KEY,
        "purchase_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "qty" integer NOT NULL,
        "unit_cost" double precision NOT NULL
      )`,
      `CREATE TABLE "notifications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "message" character varying NOT NULL,
        "kind" character varying NOT NULL,
        "status" character varying NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE "refunds" (
        "id" SERIAL PRIMARY KEY,
        "sale_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "reason" character varying NOT NULL,
        "amount" double precision NOT NULL,
        "status" character varying NOT NULL,
        "approved_by" integer,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`,
      // Indexes on the columns the migrated services join and filter on.
      `CREATE INDEX "idx_products_supplier_id" ON "products" ("supplier_id")`,
      `CREATE INDEX "idx_inventory_stock_product_warehouse" ON "inventory_stock" ("product_id", "warehouse_id")`,
      `CREATE INDEX "idx_sales_user_id" ON "sales" ("user_id")`,
      `CREATE INDEX "idx_sale_items_sale_id" ON "sale_items" ("sale_id")`,
      `CREATE INDEX "idx_sale_items_product_id" ON "sale_items" ("product_id")`,
      `CREATE INDEX "idx_purchases_supplier_id" ON "purchases" ("supplier_id")`,
      `CREATE INDEX "idx_purchase_items_purchase_id" ON "purchase_items" ("purchase_id")`,
      `CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id")`,
      `CREATE INDEX "idx_refunds_user_id" ON "refunds" ("user_id")`,
      `CREATE INDEX "idx_refunds_sale_id" ON "refunds" ("sale_id")`,
    ];

    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
    }
  }
}
