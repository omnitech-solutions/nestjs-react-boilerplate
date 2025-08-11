---
to: src/<%= plural %>/<%= plural %>.controller.ts
---
import {Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {<%= name %>sService} from './<%= plural %>.service';
import {Create<%= name %>Dto, Update<%= name %>Dto} from './dto';

@ApiTags('<%= plural %>')
@Controller('<%= plural %>')
export class <%= name %>sController {
    constructor(private readonly service: <%= name %>sService) {
    }

    @Get()
    list() {
        return this.service.findAll();
    }

    @Get(':uuid')
    get(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.service.findOne(uuid);
    }

    @Post()
    create(@Body() dto: Create<%= name %>Dto) {
        return this.service.create(dto);
    }

    @Put(':uuid')
    update(@Param('uuid', ParseUUIDPipe) uuid: string, @Body() dto: Update<%= name %>Dto) {
        return this.service.update(uuid, dto);
    }

    @Delete(':uuid')
    delete(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.service.remove(uuid);
    }
}