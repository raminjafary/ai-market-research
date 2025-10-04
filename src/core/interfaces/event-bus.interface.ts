export interface IEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  source?: string;
  target?: string;
  metadata?: Record<string, any>;
}

export interface IEventHandler {
  (event: IEvent): Promise<void> | void;
}

export interface IEventSubscription {
  id: string;
  eventType: string;
  handler: IEventHandler;
  priority: number;
  active: boolean;
}

export interface IEventBus {

  subscribe(
    eventType: string,
    handler: IEventHandler,
    priority?: number,
    subscriptionId?: string
  ): string;

  subscribeToAll(handler: IEventHandler, priority?: number): string;

  unsubscribe(subscriptionId: string): boolean;

  publish(event: Omit<IEvent, 'id' | 'timestamp'>): Promise<void>;

  getHistory(limit?: number): IEvent[];

  clearHistory(): void;

  getSubscriptions(): IEventSubscription[];

  getSubscriptionCount(eventType: string): number;

  setMaxHistorySize(size: number): void;
}
