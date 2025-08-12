import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateMetricsTable1754966733321 implements MigrationInterface {
  name = 'CreateMetricsTable1754966733321'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'metrics',
        columns: [
          {
            name: 'uuid',
            type: 'char',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 18,
            scale: 6,
            isNullable: false
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '32',
            isNullable: true
          },
          {
            name: 'recorded_at',
            type: 'datetime',
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('metrics')
  }
}
