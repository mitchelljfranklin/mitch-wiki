import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// In-process queue service that uses EventEmitter2 for async processing.
// Replaces BullMQ queue-based job processing when Redis is not available.
// Each call to add() emits an event matching the pattern `${queueName}:${jobName}`,
// allowing @OnEvent-decorated listeners to handle jobs synchronously within the
// same process. This provides a single-instance fallback for queue-dependent
// features without requiring a Redis deployment.
@Injectable()
export class InProcessQueueService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  add(queueName: string, jobName: string, data: unknown): void {
    this.eventEmitter.emit(`${queueName}:${jobName}`, data);
  }
}
