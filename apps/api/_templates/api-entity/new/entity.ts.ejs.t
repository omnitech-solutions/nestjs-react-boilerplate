---
        to: src/<%= plural %>/<%= lower %>.entity.ts
---
import { Entity, PrimaryGeneratedColumn, Column<% if (includeTimestamps) { %>, CreateDateColumn, UpdateDateColumn<% } %> } from 'typeorm'

@Entity({ name: '<%= plural %>' })
export class <%= name %> {
  @PrimaryGeneratedColumn('uuid', { name: 'uuid' })
  uuid!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string
  <%_ if (columns && columns.length) { _%>
  <%_ columns.forEach(({ prop, tsType, nullable, optionsCode }) => { _%>

  @Column(<%- optionsCode %>)
  <%= prop %><% if (nullable) { %>?<% } else { %>!<% } %>: <%= tsType %><% if (nullable && !['any','unknown','Record<string, any>'].includes(tsType)) { %> | null<% } %>
  <%_ }) _%>
  <%_ } _%>
  <%_ if (includeTimestamps) { _%>

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date
  <%_ } _%>
}
