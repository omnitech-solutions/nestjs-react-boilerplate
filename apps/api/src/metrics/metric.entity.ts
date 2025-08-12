import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'metrics' })
export class Metric {
  @PrimaryGeneratedColumn('uuid', { name: 'uuid' })
  uuid!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  value!: string

  @Column({ type: 'varchar', length: 32, nullable: true })
  unit?: string | null

  @Column({ type: 'datetime' })
  recorded_at!: Date

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date
}
