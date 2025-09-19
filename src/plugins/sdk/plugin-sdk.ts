import { BasePlugin } from '../base/base-plugin.js';
import type { IPluginContext, IPluginManifest } from '../../core/interfaces/plugin.interface.js';
import type { IEventBus } from '../../core/interfaces/event-bus.interface.js';
import type { IServiceContainer } from '../../core/interfaces/service-container.interface.js';
import type { IConfigManager } from '../../core/interfaces/config-manager.interface.js';

export interface IPluginSDK {

  getContext(): IPluginContext;

  getEventBus(): IEventBus;

  getServiceContainer(): IServiceContainer;

  getConfigManager(): IConfigManager;

  getManifest(): IPluginManifest;

  getConfig(): Record<string, any>;

  updateConfig(config: Record<string, any>): Promise<void>;

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

  publishEvent(type: string, data: any): Promise<void>;

  subscribeToEvents(eventType: string, handler: (event: any) => void): string;

  unsubscribeFromEvents(subscriptionId: string): boolean;

  log(message: string, level?: 'info' | 'warn' | 'error'): void;

  getConfigValue<T>(key: string, defaultValue?: T): T;

  setConfigValue(key: string, value: any): void;

  validateConfig(config: Record<string, any>): Promise<boolean>;

  getStatus(): string;

  isHealthy(): Promise<boolean>;
}

export class PluginSDK implements IPluginSDK {
  private plugin: BasePlugin;
  private context: IPluginContext;

  constructor(plugin: BasePlugin, context: IPluginContext) {
    this.plugin = plugin;
    this.context = context;
  }

  getContext(): IPluginContext {
    return this.context;
  }

  getEventBus(): IEventBus {
    return this.context.eventBus;
  }

  getServiceContainer(): IServiceContainer {
    return this.context.serviceContainer;
  }

  getConfigManager(): IConfigManager {
    return this.context.configManager;
  }

  getManifest(): IPluginManifest {
    return this.plugin.manifest;
  }

  getConfig(): Record<string, any> {
    return this.plugin.getConfig();
  }

  async updateConfig(config: Record<string, any>): Promise<void> {
    await this.plugin.updateConfig(config);
  }

  async getService<T>(serviceId: string): Promise<T> {
    return this.context.serviceContainer.resolve<T>(serviceId);
  }

  registerService<T>(
    serviceId: string,
    factory: () => T | Promise<T>,
    options?: {
      singleton?: boolean;
      dependencies?: string[];
      metadata?: Record<string, any>;
    }
  ): void {
    this.context.serviceContainer.register(serviceId, factory, options);
  }

  async publishEvent(type: string, data: any): Promise<void> {
    await this.context.eventBus.publish({
      type,
      data,
      source: this.plugin.manifest.id
    });
  }

  subscribeToEvents(eventType: string, handler: (event: any) => void): string {
    return this.context.eventBus.subscribe(eventType, handler);
  }

  unsubscribeFromEvents(subscriptionId: string): boolean {
    return this.context.eventBus.unsubscribe(subscriptionId);
  }

  log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const logMessage = `[${this.plugin.manifest.id}] ${message}`;

    switch (level) {
      case 'info':
        console.log(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }

    this.context.eventBus.publish({
      type: 'plugin.log',
      data: { 
        pluginId: this.plugin.manifest.id, 
        message, 
        level,
        timestamp: new Date()
      },
      source: this.plugin.manifest.id
    });
  }

  getConfigValue<T>(key: string, defaultValue?: T): T {
    const config = this.plugin.getConfig();
    return config[key] !== undefined ? config[key] : defaultValue!;
  }

  setConfigValue(key: string, value: any): void {
    const config = this.plugin.getConfig();
    config[key] = value;
    this.plugin.updateConfig(config);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    return this.plugin.validateConfig(config);
  }

  getStatus(): string {
    return this.plugin.getStatus();
  }

  async isHealthy(): Promise<boolean> {
    return this.plugin.isHealthy();
  }
}

export class PluginUtils {

  static createManifest(manifest: Partial<IPluginManifest>): IPluginManifest {
    return {
      id: manifest.id || '',
      name: manifest.name || '',
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      author: manifest.author || '',
      category: manifest.category || 'utility',
      dependencies: manifest.dependencies || [],
      entryPoint: manifest.entryPoint || '',
      permissions: manifest.permissions || [],
      tags: manifest.tags || [],
      ...manifest
    };
  }

  static validateManifest(manifest: IPluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.id) errors.push('Plugin ID is required');
    if (!manifest.name) errors.push('Plugin name is required');
    if (!manifest.version) errors.push('Plugin version is required');
    if (!manifest.description) errors.push('Plugin description is required');
    if (!manifest.author) errors.push('Plugin author is required');
    if (!manifest.category) errors.push('Plugin category is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static generatePluginId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static createConfigSchema(schema: Record<string, any>): Record<string, any> {
    return schema;
  }

  static validateConfig(config: Record<string, any>, schema: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, value] of Object.entries(schema)) {
      if (value.required && !(key in config)) {
        errors.push(`Required configuration key '${key}' is missing`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
