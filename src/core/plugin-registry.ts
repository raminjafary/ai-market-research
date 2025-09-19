import { EventBus, eventBus } from './event-bus.js';

export interface PluginManifest {
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

export interface PluginInfo {
  manifest: PluginManifest;
  instance: any;
  status: PluginStatus;
  loadTime: Date;
  lastUsed: Date;
  errorCount: number;
  lastError?: string;
}

export type PluginStatus = 'loading' | 'active' | 'error' | 'disabled' | 'unloaded';

export interface PluginLoadOptions {
  forceReload?: boolean;
  config?: Record<string, any>;
  dependencies?: Record<string, any>;
}

export class PluginRegistry {
  private plugins: Map<string, PluginInfo> = new Map();
  private pluginLoaders: Map<string, PluginLoader> = new Map();
  private eventBus: EventBus;
  private pluginDirectory: string;
  private configDirectory: string;

  constructor(eventBus: EventBus, pluginDirectory: string = './plugins', configDirectory: string = './config') {
    this.eventBus = eventBus;
    this.pluginDirectory = pluginDirectory;
    this.configDirectory = configDirectory;
    this.registerDefaultLoaders();
  }

  registerLoader(fileExtension: string, loader: PluginLoader): void {
    this.pluginLoaders.set(fileExtension, loader);
  }

  async discoverPlugins(): Promise<string[]> {
    const discoveredPlugins: string[] = [];

    try {
      await this.eventBus.publish({
        type: 'plugin.discovery.started',
        data: { directory: this.pluginDirectory },
        source: 'plugin-registry'
      });

      await this.eventBus.publish({
        type: 'plugin.discovery.completed',
        data: { discovered: discoveredPlugins },
        source: 'plugin-registry'
      });

      return discoveredPlugins;
    } catch (error) {
      await this.eventBus.publish({
        type: 'plugin.discovery.error',
        data: { error: error instanceof Error ? error.message : String(error) },
        source: 'plugin-registry'
      });
      throw error;
    }
  }

  async loadPlugin(manifest: PluginManifest, options: PluginLoadOptions = {}): Promise<PluginInfo> {
    const pluginId = manifest.id;

    if (this.plugins.has(pluginId) && !options.forceReload) {
      const existing = this.plugins.get(pluginId)!;
      if (existing.status === 'active') {
        return existing;
      }
    }

    try {
      await this.eventBus.publish({
        type: 'plugin.loading',
        data: { pluginId, manifest },
        source: 'plugin-registry'
      });

      await this.validateDependencies(manifest.dependencies);

      const instance = await this.loadPluginInstance(manifest, options);

      const pluginInfo: PluginInfo = {
        manifest,
        instance,
        status: 'active',
        loadTime: new Date(),
        lastUsed: new Date(),
        errorCount: 0
      };

      this.plugins.set(pluginId, pluginInfo);

      if (typeof instance.init === 'function') {
        await instance.init(options.config || {});
      }

      await this.eventBus.publish({
        type: 'plugin.loaded',
        data: { pluginId, manifest },
        source: 'plugin-registry'
      });

      return pluginInfo;
    } catch (error) {
      await this.eventBus.publish({
        type: 'plugin.load.error',
        data: { pluginId, error: error instanceof Error ? error.message : String(error) },
        source: 'plugin-registry'
      });

      const errorInfo: PluginInfo = {
        manifest,
        instance: null,
        status: 'error',
        loadTime: new Date(),
        lastUsed: new Date(),
        errorCount: 1,
        lastError: error instanceof Error ? error.message : String(error)
      };

      this.plugins.set(pluginId, errorInfo);
      throw error;
    }
  }

  async registerPlugin(pluginInstance: any, options: PluginLoadOptions = {}): Promise<PluginInfo> {
    const manifest = pluginInstance.manifest;
    const pluginId = manifest.id;

    if (this.plugins.has(pluginId) && !options.forceReload) {
      const existing = this.plugins.get(pluginId)!;
      if (existing.status === 'active') {
        return existing;
      }
    }

    try {
      await this.eventBus.publish({
        type: 'plugin.registering',
        data: { pluginId, manifest },
        source: 'plugin-registry'
      });

      await this.validateDependencies(manifest.dependencies);

      const pluginInfo: PluginInfo = {
        manifest,
        instance: pluginInstance,
        status: 'active',
        loadTime: new Date(),
        lastUsed: new Date(),
        errorCount: 0
      };

      this.plugins.set(pluginId, pluginInfo);

      if (typeof pluginInstance.init === 'function') {
        const context = {
          eventBus: this.eventBus
        };
        await pluginInstance.init(context, options.config || {});
      }

      await this.eventBus.publish({
        type: 'plugin.registered',
        data: { pluginId, manifest },
        source: 'plugin-registry'
      });

      return pluginInfo;
    } catch (error) {
      await this.eventBus.publish({
        type: 'plugin.register.error',
        data: { pluginId, error: error instanceof Error ? error.message : String(error) },
        source: 'plugin-registry'
      });

      const errorInfo: PluginInfo = {
        manifest,
        instance: null,
        status: 'error',
        loadTime: new Date(),
        lastUsed: new Date(),
        errorCount: 1,
        lastError: error instanceof Error ? error.message : String(error)
      };

      this.plugins.set(pluginId, errorInfo);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    try {
      await this.eventBus.publish({
        type: 'plugin.unloading',
        data: { pluginId },
        source: 'plugin-registry'
      });

      if (plugin.instance && typeof plugin.instance.cleanup === 'function') {
        await plugin.instance.cleanup();
      }

      plugin.status = 'unloaded';
      plugin.instance = null;

      await this.eventBus.publish({
        type: 'plugin.unloaded',
        data: { pluginId },
        source: 'plugin-registry'
      });

      return true;
    } catch (error) {
      await this.eventBus.publish({
        type: 'plugin.unload.error',
        data: { pluginId, error: error instanceof Error ? error.message : String(error) },
        source: 'plugin-registry'
      });
      throw error;
    }
  }

  getPlugin(pluginId: string): PluginInfo | undefined {
    const plugin = this.plugins.get(pluginId);
    if (plugin && plugin.status === 'active') {
      plugin.lastUsed = new Date();
    }
    return plugin;
  }

  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByCategory(category: PluginCategory): PluginInfo[] {
    return this.getAllPlugins().filter(plugin => 
      plugin.manifest.category === category && plugin.status === 'active'
    );
  }

  getPluginsByTag(tag: string): PluginInfo[] {
    return this.getAllPlugins().filter(plugin => 
      plugin.manifest.tags.includes(tag) && plugin.status === 'active'
    );
  }

  async setPluginStatus(pluginId: string, status: PluginStatus): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    const oldStatus = plugin.status;
    plugin.status = status;

    await this.eventBus.publish({
      type: 'plugin.status.changed',
      data: { pluginId, oldStatus, newStatus: status },
      source: 'plugin-registry'
    });

    return true;
  }

  async reloadPlugin(pluginId: string): Promise<PluginInfo> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    await this.unloadPlugin(pluginId);
    return this.loadPlugin(plugin.manifest, { forceReload: true });
  }

  private async validateDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      const plugin = this.plugins.get(dep);
      if (!plugin || plugin.status !== 'active') {
        throw new Error(`Dependency ${dep} is not available or not active`);
      }
    }
  }

  private async loadPluginInstance(manifest: PluginManifest, options: PluginLoadOptions): Promise<any> {

    throw new Error('Plugin loading not implemented yet - this will be implemented when we create actual plugins');
  }

  private registerDefaultLoaders(): void {

  }

  getStatistics(): {
    total: number;
    active: number;
    error: number;
    disabled: number;
    byCategory: Record<PluginCategory, number>;
  } {
    const plugins = this.getAllPlugins();
    const stats = {
      total: plugins.length,
      active: plugins.filter(p => p.status === 'active').length,
      error: plugins.filter(p => p.status === 'error').length,
      disabled: plugins.filter(p => p.status === 'disabled').length,
      byCategory: {} as Record<PluginCategory, number>
    };

    for (const plugin of plugins) {
      const category = plugin.manifest.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }

    return stats;
  }
}

export interface PluginLoader {
  canLoad(filePath: string): boolean;
  load(filePath: string, options?: any): Promise<any>;
}
