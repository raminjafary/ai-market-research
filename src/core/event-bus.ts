export interface Event {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  source?: string;
  target?: string;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  (event: Event): Promise<void> | void;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  priority: number;
  active: boolean;
}

export class EventBus {
  private handlers: Map<string, EventSubscription[]> = new Map();
  private globalHandlers: EventSubscription[] = [];
  private eventHistory: Event[] = [];
  private maxHistorySize: number = 1000;
  private isProcessing = false;
  private pendingEvents: Event[] = [];

  subscribe(
    eventType: string,
    handler: EventHandler,
    priority: number = 0,
    subscriptionId?: string
  ): string {
    const id = subscriptionId || this.generateId();
    const subscription: EventSubscription = {
      id,
      eventType,
      handler,
      priority,
      active: true,
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(subscription);
    this.handlers.get(eventType)!.sort((a, b) => b.priority - a.priority);

    return id;
  }

  subscribeToAll(handler: EventHandler, priority: number = 0): string {
    const id = this.generateId();
    const subscription: EventSubscription = {
      id,
      eventType: '*',
      handler,
      priority,
      active: true,
    };

    this.globalHandlers.push(subscription);
    this.globalHandlers.sort((a, b) => b.priority - a.priority);

    return id;
  }

  unsubscribe(subscriptionId: string): boolean {

    for (const [eventType, subscriptions] of this.handlers.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        return true;
      }
    }

    const globalIndex = this.globalHandlers.findIndex(sub => sub.id === subscriptionId);
    if (globalIndex !== -1) {
      this.globalHandlers.splice(globalIndex, 1);
      return true;
    }

    return false;
  }

  async publish(event: Omit<Event, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: Event = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.addToHistory(fullEvent);

    if (this.isProcessing) {
      this.pendingEvents.push(fullEvent);
      return;
    }

    await this.processEvent(fullEvent);
  }

  private async processEvent(event: Event): Promise<void> {
    this.isProcessing = true;

    try {

      for (const subscription of this.globalHandlers) {
        if (subscription.active) {
          try {
            await subscription.handler(event);
          } catch (error) {
            console.error(`Error in global event handler ${subscription.id}:`, error);
          }
        }
      }

      const handlers = this.handlers.get(event.type) || [];
      for (const subscription of handlers) {
        if (subscription.active) {
          try {
            await subscription.handler(event);
          } catch (error) {
            console.error(`Error in event handler ${subscription.id} for event ${event.type}:`, error);
          }
        }
      }
    } finally {
      this.isProcessing = false;

      if (this.pendingEvents.length > 0) {
        const pending = [...this.pendingEvents];
        this.pendingEvents = [];
        for (const pendingEvent of pending) {
          await this.processEvent(pendingEvent);
        }
      }
    }
  }

  getHistory(limit?: number): Event[] {
    const events = [...this.eventHistory];
    return limit ? events.slice(-limit) : events;
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  getSubscriptions(): EventSubscription[] {
    const subscriptions: EventSubscription[] = [];

    for (const [, handlers] of this.handlers.entries()) {
      subscriptions.push(...handlers);
    }

    subscriptions.push(...this.globalHandlers);

    return subscriptions;
  }

  getSubscriptionCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  private addToHistory(event: Event): void {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;

    if (this.eventHistory.length > size) {
      this.eventHistory = this.eventHistory.slice(-size);
    }
  }
}

export const eventBus = new EventBus();
