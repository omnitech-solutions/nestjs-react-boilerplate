import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationsService {
  constructor(@InjectRepository(Organization) private repo: Repository<Organization>) {}

  findAll(): Promise<Organization[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Organization> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Organization not found');
    return entity;
  }

  create(dto: CreateOrganizationDto): Promise<Organization> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateOrganizationDto): Promise<Organization> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }
}
