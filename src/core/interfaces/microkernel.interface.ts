import type { IEventBus } from './event-bus.interface.js';
import type { IPluginRegistry, IPluginManifest } from './plugin.interface.js';
import type { IServiceContainer } from './service-container.interface.js';
import type { IConfigManager } from './config-manager.interface.js';
import type { ILifecycleManager } from './lifecycle-manager.interface.js';

export interface IMicrokernelOptions {
  pluginDirectory?: string;
  configDirectory?: string;
  enableHotReload?: boolean;
  enableDebugMode?: boolean;
  maxPlugins?: number;
  pluginTimeout?: number;
}

export interface IMicrokernelStatus {
  isRunning: boolean;
  startTime?: Date;
  uptime: number;
  plugins: {
    total: number;
    active: number;
    error: number;
    disabled: number;
  };
  services: {
    total: number;
    resolved: number;
  };
  config: {
    totalKeys: number;
    sources: number;
  };
  lifecycle: {
    phases: number;
    hooks: number;
    currentPhase?: string;
  };
}

export interface IMicrokernel {

  start(): Promise<void>;

  stop(): Promise<void>;

  loadPlugin(manifest: IPluginManifest): Promise<void>;

  unloadPlugin(pluginId: string): Promise<boolean>;

  getService<T>(serviceId: string): Promise<T>;

  registerService<T>(
    serviceId: string,
    factory: () => T | Promise<T>,
    options?: {
      singleton?: boolean;
      dependencies?: string[];
      metadata?: Record<string, any>;
    }
  ): void;

  getConfig<T = any>(key: string, defaultValue?: T): T;

  setConfig(key: string, value: any): Promise<void>;

  publishEvent(event: {
    type: string;
    data: any;
    source?: string;
    target?: string;
    metadata?: Record<string, any>;
  }): Promise<void>;

  subscribeToEvents(
    eventType: string,
    handler: (event: any) => Promise<void> | void,
    priority?: number
  ): string;

  getStatus(): IMicrokernelStatus;

  getPlugins(): any[];

  getPluginsByCategory(category: string): any[];

  getServices(): any[];

  getConfiguration(): Record<string, any>;

  getLifecycleStatus(): any[];

  readonly eventBus: IEventBus;
  readonly pluginRegistry: IPluginRegistry;
  readonly serviceContainer: IServiceContainer;
  readonly configManager: IConfigManager;
  readonly lifecycleManager: ILifecycleManager;
}
