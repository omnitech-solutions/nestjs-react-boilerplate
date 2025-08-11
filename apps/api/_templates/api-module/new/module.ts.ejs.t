---
to: src/<%= plural %>/<%= plural %>.module.ts
---
import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {<%= name %>sService} from './<%= plural %>.service';
import {<%= name %>sController} from './<%= plural %>.controller';
import { <%= name %> } from './<%= lower %>.entity';

@Module({
    imports: [TypeOrmModule.forFeature([<%= name %>])],
    controllers: [<%= name %>sController],
    providers: [<%= name %>sService],
    exports: [<%= name %>sService],
})
export class <%= name %>sModule {
}