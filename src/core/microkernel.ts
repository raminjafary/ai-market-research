import { EventBus, eventBus } from './event-bus.js';
import { PluginRegistry } from './plugin-registry.js';
import type { PluginManifest } from './plugin-registry.js';
import { ServiceContainer, serviceContainer } from './service-container.js';
import { ConfigManager, configManager } from './config-manager.js';
import { LifecycleManager, lifecycleManager } from './lifecycle-manager.js';

export interface MicrokernelOptions {
  pluginDirectory?: string;
  configDirectory?: string;
  enableHotReload?: boolean;
  enableDebugMode?: boolean;
  maxPlugins?: number;
  pluginTimeout?: number;
}

export interface MicrokernelStatus {
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

export class Microkernel {
  private eventBus: EventBus;
  private pluginRegistry: PluginRegistry;
  private serviceContainer: ServiceContainer;
  private configManager: ConfigManager;
  private lifecycleManager: LifecycleManager;
  private options: MicrokernelOptions;
  private startTime?: Date;
  private isRunning = false;

  constructor(options: MicrokernelOptions = {}) {
    this.options = {
      pluginDirectory: './plugins',
      configDirectory: './config',
      enableHotReload: false,
      enableDebugMode: false,
      maxPlugins: 100,
      pluginTimeout: 30000,
      ...options
    };

    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.configManager = configManager;

    this.pluginRegistry = new PluginRegistry(
      this.eventBus,
      this.options.pluginDirectory!,
      this.options.configDirectory!
    );

    this.lifecycleManager = new LifecycleManager(
      this.eventBus,
      this.pluginRegistry,
      this.serviceContainer,
      this.configManager
    );

    this.registerCoreServices();

    this.setupEventListeners();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Microkernel is already running');
    }

    try {
      this.startTime = new Date();
      this.isRunning = true;

      await this.eventBus.publish({
        type: 'microkernel.starting',
        data: { options: this.options },
        source: 'microkernel'
      });

      await this.lifecycleManager.start();

      await this.eventBus.publish({
        type: 'microkernel.started',
        data: { startTime: this.startTime },
        source: 'microkernel'
      });

      console.log('🚀 Microkernel started successfully');
    } catch (error) {
      this.isRunning = false;

      await this.eventBus.publish({
        type: 'microkernel.start.error',
        data: { error: error instanceof Error ? error.message : String(error) },
        source: 'microkernel'
      });

      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.eventBus.publish({
        type: 'microkernel.stopping',
        data: {},
        source: 'microkernel'
      });

      await this.lifecycleManager.stop();

      this.isRunning = false;

      await this.eventBus.publish({
        type: 'microkernel.stopped',
        data: { uptime: this.getUptime() },
        source: 'microkernel'
      });

      console.log('🛑 Microkernel stopped');
    } catch (error) {
      this.isRunning = false;

      await this.eventBus.publish({
        type: 'microkernel.stop.error',
        data: { error: error instanceof Error ? error.message : String(error) },
        source: 'microkernel'
      });

      throw error;
    }
  }

  async loadPlugin(manifest: PluginManifest): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Microkernel is not running');
    }

    try {
      await this.pluginRegistry.loadPlugin(manifest);

      await this.eventBus.publish({
        type: 'microkernel.plugin.loaded',
        data: { pluginId: manifest.id },
        source: 'microkernel'
      });
    } catch (error) {
      await this.eventBus.publish({
        type: 'microkernel.plugin.load.error',
        data: { pluginId: manifest.id, error: error instanceof Error ? error.message : String(error) },
        source: 'microkernel'
      });

      throw error;
    }
  }

  async registerPlugin(pluginInstance: any, options?: { config?: Record<string, any> }): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Microkernel is not running');
    }

    try {
      await this.pluginRegistry.registerPlugin(pluginInstance, options);

      await this.eventBus.publish({
        type: 'microkernel.plugin.registered',
        data: { pluginId: pluginInstance.manifest.id },
        source: 'microkernel'
      });
    } catch (error) {
      await this.eventBus.publish({
        type: 'microkernel.plugin.register.error',
        data: { pluginId: pluginInstance.manifest.id, error: error instanceof Error ? error.message : String(error) },
        source: 'microkernel'
      });

      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<boolean> {
    if (!this.isRunning) {
      throw new Error('Microkernel is not running');
    }

    try {
      const result = await this.pluginRegistry.unloadPlugin(pluginId);

      if (result) {
        await this.eventBus.publish({
          type: 'microkernel.plugin.unloaded',
          data: { pluginId },
          source: 'microkernel'
        });
      }

      return result;
    } catch (error) {
      await this.eventBus.publish({
        type: 'microkernel.plugin.unload.error',
        data: { pluginId, error: error instanceof Error ? error.message : String(error) },
        source: 'microkernel'
      });

      throw error;
    }
  }

  async getService<T>(serviceId: string): Promise<T> {
    return this.serviceContainer.resolve<T>(serviceId);
  }

  registerService<T>(
    serviceId: string,
    factory: () => T | Promise<T>,
    options: {
      singleton?: boolean;
      dependencies?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): void {
    this.serviceContainer.register(serviceId, factory, options);
  }

  getConfig<T = any>(key: string, defaultValue?: T): T {
    return this.configManager.get<T>(key, defaultValue);
  }

  async setConfig(key: string, value: any): Promise<void> {
    await this.configManager.set(key, value);
  }

  async publishEvent(event: {
    type: string;
    data: any;
    source?: string;
    target?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventBus.publish(event);
  }

  subscribeToEvents(
    eventType: string,
    handler: (event: any) => Promise<void> | void,
    priority: number = 0
  ): string {
    return this.eventBus.subscribe(eventType, handler, priority);
  }

  getStatus(): MicrokernelStatus {
    const pluginStats = this.pluginRegistry.getStatistics();
    const serviceStats = this.serviceContainer.getStatistics();
    const configStats = this.configManager.getStatistics();
    const lifecycleStats = this.lifecycleManager.getStatistics();

    return {
      isRunning: this.isRunning,
      ...(this.startTime && { startTime: this.startTime }),
      uptime: this.getUptime(),
      plugins: {
        total: pluginStats.total,
        active: pluginStats.active,
        error: pluginStats.error,
        disabled: pluginStats.disabled
      },
      services: {
        total: serviceStats.total,
        resolved: serviceStats.resolved
      },
      config: {
        totalKeys: configStats.totalKeys,
        sources: configStats.sources
      },
      lifecycle: (() => {
        const currentPhase = this.getCurrentLifecyclePhase();
        return {
          phases: lifecycleStats.phases,
          hooks: lifecycleStats.hooks,
          ...(currentPhase && { currentPhase })
        };
      })()
    };
  }

  getPlugins() {
    return this.pluginRegistry.getAllPlugins();
  }

  getPluginsByCategory(category: string) {
    return this.pluginRegistry.getPluginsByCategory(category as any);
  }

  getServices() {
    return this.serviceContainer.getAllServices();
  }

  getConfiguration() {
    return this.configManager.toObject();
  }

  getLifecycleStatus() {
    return this.lifecycleManager.getStatus();
  }

  private registerCoreServices(): void {

    this.serviceContainer.registerInstance('microkernel', this);

    this.serviceContainer.registerInstance('eventBus', this.eventBus);
    this.serviceContainer.registerInstance('pluginRegistry', this.pluginRegistry);
    this.serviceContainer.registerInstance('serviceContainer', this.serviceContainer);
    this.serviceContainer.registerInstance('configManager', this.configManager);
    this.serviceContainer.registerInstance('lifecycleManager', this.lifecycleManager);

    this.registerConfigurationSources();
  }

  private registerConfigurationSources(): void {

    this.configManager.addSource({
      name: 'environment',
      priority: 100,
      load: async () => {
        const config: Record<string, any> = {};
        for (const [key, value] of Object.entries(process.env)) {
          if (key.startsWith('APP_')) {
            const configKey = key.replace('APP_', '').toLowerCase();
            config[configKey] = value;
          }
        }
        return config;
      }
    });

    this.configManager.addSource({
      name: 'defaults',
      priority: 0,
      load: async () => ({
        app: {
          name: 'Market Research Platform',
          version: '1.0.0',
          environment: process.env['NODE_ENV'] || 'development'
        },
        plugins: {
          directory: this.options.pluginDirectory,
          maxCount: this.options.maxPlugins,
          timeout: this.options.pluginTimeout,
          hotReload: this.options.enableHotReload
        },
        debug: {
          enabled: this.options.enableDebugMode,
          level: 'info'
        }
      })
    });
  }

  private setupEventListeners(): void {

    if (this.options.enableDebugMode) {
      this.eventBus.subscribeToAll(async (event) => {
        console.log(`[DEBUG] Event: ${event.type}`, event.data);
      }, 1000);
    }

    this.eventBus.subscribe('plugin.loaded', async (event) => {
      console.log(`✅ Plugin loaded: ${event.data.pluginId}`);
    });

    this.eventBus.subscribe('plugin.load.error', async (event) => {
      console.error(`❌ Plugin load error: ${event.data.pluginId} - ${event.data.error}`);
    });

    this.eventBus.subscribe('service.registered', async (event) => {
      console.log(`🔧 Service registered: ${event.data.serviceId}`);
    });

    this.eventBus.subscribe('lifecycle.phase.completed', async (event) => {
      console.log(`🔄 Lifecycle phase completed: ${event.data.phase}`);
    });
  }

  private getUptime(): number {
    if (!this.startTime) {
      return 0;
    }
    return Date.now() - this.startTime.getTime();
  }

  private getCurrentLifecyclePhase(): string | undefined {
    const status = this.lifecycleManager.getStatus();
    const currentPhase = status.find(s => s.status === 'running');
    return currentPhase?.phase;
  }
}

export const microkernel = new Microkernel();
