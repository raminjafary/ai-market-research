import type { IEventBus } from './event-bus.interface.js';
import type { IServiceContainer } from './service-container.interface.js';
import type { IConfigManager } from './config-manager.interface.js';

export interface IPluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: PluginCategory;
  dependencies: string[];
  entryPoint: string;
  configSchema?: Record<string, any>;
  permissions: string[];
  tags: string[];
  homepage?: string;
  repository?: string;
  license?: string;
}

export type PluginCategory = 
  | 'data-provider'
  | 'ai-provider'
  | 'analytics'
  | 'output-format'
  | 'ui'
  | 'workflow'
  | 'integration'
  | 'utility';

export interface IPluginInfo {
  manifest: IPluginManifest;
  instance: IPlugin;
  status: PluginStatus;
  loadTime: Date;
  lastUsed: Date;
  errorCount: number;
  lastError?: string;
}

export type PluginStatus = 'loading' | 'active' | 'error' | 'disabled' | 'unloaded';

export interface IPluginContext {
  eventBus: IEventBus;
  serviceContainer: IServiceContainer;
  configManager: IConfigManager;
  pluginId: string;
  pluginDirectory: string;
  configDirectory: string;
}

export interface IPlugin {

  readonly manifest: IPluginManifest;

  init(context: IPluginContext, config?: Record<string, any>): Promise<void>;

  start(): Promise<void>;

  stop(): Promise<void>;

  cleanup(): Promise<void>;

  getStatus(): PluginStatus;

  isHealthy(): Promise<boolean>;

  getCapabilities(): string[];

  getConfigSchema(): Record<string, any> | undefined;

  validateConfig(config: Record<string, any>): Promise<boolean>;
}

export interface IPluginLoader {
  canLoad(filePath: string): boolean;
  load(filePath: string, context: IPluginContext, options?: any): Promise<IPlugin>;
}

export interface IPluginRegistry {

  registerLoader(fileExtension: string, loader: IPluginLoader): void;

  discoverPlugins(): Promise<string[]>;

  loadPlugin(manifest: IPluginManifest, options?: PluginLoadOptions): Promise<IPluginInfo>;

  unloadPlugin(pluginId: string): Promise<boolean>;

  getPlugin(pluginId: string): IPluginInfo | undefined;

  getAllPlugins(): IPluginInfo[];

  getPluginsByCategory(category: PluginCategory): IPluginInfo[];

  getPluginsByTag(tag: string): IPluginInfo[];

  setPluginStatus(pluginId: string, status: PluginStatus): Promise<boolean>;

  reloadPlugin(pluginId: string): Promise<IPluginInfo>;

  getStatistics(): PluginStatistics;
}

export interface PluginLoadOptions {
  forceReload?: boolean;
  config?: Record<string, any>;
  dependencies?: Record<string, any>;
}

export interface PluginStatistics {
  total: number;
  active: number;
  error: number;
  disabled: number;
  byCategory: Record<PluginCategory, number>;
}
