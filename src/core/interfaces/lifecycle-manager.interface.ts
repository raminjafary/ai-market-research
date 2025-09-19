export interface ILifecyclePhase {
  name: string;
  order: number;
  description: string;
  dependencies: string[];
}

export interface ILifecycleHook {
  id: string;
  phase: string;
  pluginId: string;
  handler: () => Promise<void> | void;
  priority: number;
  enabled: boolean;
}

export interface ILifecycleStatus {
  phase: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  hooks: ILifecycleHook[];
}

export interface ILifecycleManager {

  registerPhase(phase: ILifecyclePhase): void;

  registerHook(hook: Omit<ILifecycleHook, 'id'>): string;

  unregisterHook(hookId: string): boolean;

  start(): Promise<void>;

  stop(): Promise<void>;

  executePhase(phase: ILifecyclePhase, reverse?: boolean): Promise<void>;

  getStatus(): ILifecycleStatus[];

  getPhaseStatus(phaseName: string): ILifecycleStatus | undefined;

  getPhases(): ILifecyclePhase[];

  getHooks(phaseName: string): ILifecycleHook[];

  setHookEnabled(hookId: string, enabled: boolean): boolean;

  isLifecycleRunning(): boolean;

  getStatistics(): LifecycleManagerStatistics;
}

export interface LifecycleManagerStatistics {
  phases: number;
  hooks: number;
  enabledHooks: number;
  running: boolean;
}
