---
to: src/<%= plural %>/<%= lower %>.entity.ts
---
import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity('<%= plural %>')
export class <%= name %> {
    @PrimaryGeneratedColumn('uuid')
    uuid!: string;

    @Column({length: 255})
    name!: string;
}