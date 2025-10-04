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
  private eventBus: EventBus;
  private pluginDirectory: string;
  private configDirectory: string;

  constructor(eventBus: EventBus, pluginDirectory: string = './plugins', configDirectory: string = './config') {
    this.eventBus = eventBus;
    this.pluginDirectory = pluginDirectory;
    this.configDirectory = configDirectory;
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

      const instance = null; // Plugin loading not implemented

      const pluginInfo: PluginInfo = {
        manifest,
        instance,
        status: 'active',
        loadTime: new Date(),
        lastUsed: new Date(),
        errorCount: 0
      };

      this.plugins.set(pluginId, pluginInfo);

      if (instance && typeof (instance as any).init === 'function') {
        await (instance as any).init(options.config || {});
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

      if (pluginInstance && typeof pluginInstance.init === 'function') {
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


  private async validateDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      const plugin = this.plugins.get(dep);
      if (!plugin || plugin.status !== 'active') {
        throw new Error(`Dependency ${dep} is not available or not active`);
      }
    }
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

