import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MetricsService } from './metrics.service'
import { MetricsController } from './metrics.controller'
import { Metric } from './metric.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Metric])],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService]
})
export class MetricsModule {}
