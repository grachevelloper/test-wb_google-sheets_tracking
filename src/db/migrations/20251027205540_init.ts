import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists('tariffs', (table: Knex.TableBuilder) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

        table.date('date').notNullable();
        table.text('warehouse_name').notNullable();
        table.text('geo_name').notNullable();

        table.text('box_delivery_base').notNullable();
        table.text('box_delivery_coef_expr').notNullable();
        table.text('box_delivery_liter').notNullable();

        table.text('box_delivery_marketplace_base').notNullable();
        table.text('box_delivery_marketplace_coef_expr').notNullable();
        table.text('box_delivery_marketplace_liter').notNullable();

        table.text('box_storage_base').notNullable();
        table.text('box_storage_coef_expr').notNullable();
        table.text('box_storage_liter').notNullable();

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.unique(['date', 'warehouse_name', 'geo_name']);
    });

    await knex.schema.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_tariffs_main 
        ON tariffs (date, warehouse_name, geo_name);
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('tariffs');
}
