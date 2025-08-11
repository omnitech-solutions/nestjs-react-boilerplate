---
to: src/<%= plural %>/<%= plural %>.service.ts
---
import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import { <%= name %> } from './<%= lower %>.entity';
import {Create<%= name %>Dto, Update<%= name %>Dto} from './dto';

@Injectable()
export class <%= name %>sService {
    constructor(@InjectRepository(<%= name %>) private readonly repo: Repository<<%= name %>>) {
    }

    findAll() {
        return this.repo.find();
    }

    async findOne(uuid: string) {
        const entity = await this.repo.findOne({where: {uuid}});
        if (!entity) throw new NotFoundException('<%= name %> not found');
        return entity;
    }

    create(dto: Create<%= name %>Dto) {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async update(uuid: string, dto: Update<%= name %>Dto) {
        const entity = await this.findOne(uuid);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async remove(uuid: string) {
        const entity = await this.findOne(uuid);
        await this.repo.remove(entity);
    }
}