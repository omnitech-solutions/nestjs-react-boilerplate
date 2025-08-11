import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid', { name: 'uuid' })
  uuid!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry?: string | null

  @Column({ type: 'varchar', length: 2048, nullable: true })
  website?: string | null

  @Column({ type: 'text', nullable: true })
  notes?: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date
}
