import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create investments table
  await knex.schema.createTable('investments', (table) => {
    table.increments('id').primary();
    table.enum('country', ['BR', 'US']).notNullable();
    table.string('account').notNullable();
    table.string('description').notNullable();
    table.string('type').notNullable();
    table.string('codigo').unique(); // Brazilian investment code
    table.enum('status', ['ACTIVE', 'DONE', 'SOLD', 'TRANSFERRED']).defaultTo('ACTIVE');
    
    // Purchase/Initial Investment Data
    table.date('purchase_date');
    table.decimal('purchase_value_original', 15, 2);
    table.string('purchase_currency', 3);
    table.decimal('purchase_exchange_rate', 10, 4);
    table.decimal('purchase_value_usd', 15, 2);
    
    // Maturity/Sale Data
    table.date('maturity_date');
    table.date('sale_date');
    table.decimal('final_value_original', 15, 2);
    table.decimal('final_exchange_rate', 10, 4);
    table.decimal('final_value_usd', 15, 2);
    
    // Tax Information
    table.decimal('earnings_original', 15, 2);
    table.decimal('earnings_usd', 15, 2);
    table.decimal('tax_paid_brazil', 15, 2);
    table.decimal('tax_rate_brazil', 5, 2);
    table.decimal('tax_to_be_paid', 15, 2);
    
    table.text('notes');
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['country', 'status']);
    table.index(['account']);
    table.index(['type']);
    table.index(['status']);
    table.index(['purchase_date']);
    table.index(['maturity_date']);
  });

  // Create portfolio_snapshots table
  await knex.schema.createTable('portfolio_snapshots', (table) => {
    table.increments('id').primary();
    table.integer('investment_id').unsigned().notNullable();
    table.date('snapshot_date').notNullable();
    table.decimal('value_original', 15, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.string('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('investment_id').references('investments.id').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate snapshots
    table.unique(['investment_id', 'snapshot_date']);
    
    // Indexes
    table.index(['investment_id']);
    table.index(['snapshot_date']);
  });

  // Create exchange_rates table
  await knex.schema.createTable('exchange_rates', (table) => {
    table.increments('id').primary();
    table.date('date').notNullable();
    table.decimal('rate', 10, 4).notNullable();
    table.enum('type', ['OFFICIAL', 'PESSIMISTIC', 'OPTIMISTIC']).defaultTo('OFFICIAL');
    table.string('source');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Unique constraint for date and type
    table.unique(['date', 'type']);
    
    // Index
    table.index(['date']);
  });

  // Create transactions table
  await knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table.integer('investment_id').unsigned().notNullable();
    table.enum('type', ['BUY', 'SELL', 'DIVIDEND', 'INTEREST']).notNullable();
    table.date('date').notNullable();
    table.decimal('amount_original', 15, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.decimal('exchange_rate', 10, 4);
    table.decimal('amount_usd', 15, 2);
    table.decimal('tax_paid', 15, 2);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('investment_id').references('investments.id').onDelete('CASCADE');
    
    // Indexes
    table.index(['investment_id']);
    table.index(['date']);
    table.index(['type']);
  });

  // Create monthly_summaries table
  await knex.schema.createTable('monthly_summaries', (table) => {
    table.increments('id').primary();
    table.date('month').notNullable().unique();
    table.decimal('total_br_brl', 15, 2);
    table.decimal('total_us_usd', 15, 2);
    table.decimal('total_combined_brl', 15, 2);
    table.decimal('total_combined_usd', 15, 2);
    table.decimal('exchange_rate_used', 10, 4);
    table.decimal('month_over_month_change', 15, 2);
    table.decimal('month_over_month_change_percent', 8, 2);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Index
    table.index(['month']);
  });

  // Create tax_events table
  await knex.schema.createTable('tax_events', (table) => {
    table.increments('id').primary();
    table.integer('year').notNullable();
    table.integer('investment_id').unsigned().notNullable();
    table.enum('event_type', ['MATURED', 'SOLD', 'INTEREST_PAID', 'DIVIDEND']).notNullable();
    table.date('event_date').notNullable();
    table.string('description').notNullable();
    table.decimal('value_brl', 15, 2);
    table.decimal('exchange_rate', 10, 4);
    table.decimal('value_usd', 15, 2);
    table.decimal('gain_loss_usd', 15, 2);
    table.decimal('tax_paid_brazil', 15, 2);
    table.decimal('foreign_tax_credit_eligible', 15, 2);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('investment_id').references('investments.id').onDelete('CASCADE');
    
    // Indexes
    table.index(['year']);
    table.index(['investment_id']);
    table.index(['event_date']);
  });

  // Create users table (for future multi-user support)
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.enum('role', ['USER', 'ADMIN']).defaultTo('USER');
    table.timestamp('last_login');
    table.timestamps(true, true);
    
    // Index
    table.index(['email']);
  });

  // Add user_id to investments table for future multi-user support
  // For now it's nullable, will be required when auth is implemented
  await knex.schema.alterTable('investments', (table) => {
    table.integer('user_id').unsigned().nullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('tax_events');
  await knex.schema.dropTableIfExists('monthly_summaries');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('exchange_rates');
  await knex.schema.dropTableIfExists('portfolio_snapshots');
  await knex.schema.dropTableIfExists('investments');
  await knex.schema.dropTableIfExists('users');
}
