import { EventBus, eventBus } from './event-bus.js';
import { z } from 'zod';

export interface ConfigSource {
  name: string;
  priority: number;
  load(): Promise<Record<string, any>>;
  save?(config: Record<string, any>): Promise<void>;
}

export interface ConfigValidation {
  schema: z.ZodSchema;
  required?: boolean;
}

export interface ConfigMetadata {
  key: string;
  value: any;
  source: string;
  priority: number;
  lastModified: Date;
  validation?: ConfigValidation;
}

export class ConfigManager {
  private config: Map<string, any> = new Map();
  private metadata: Map<string, ConfigMetadata> = new Map();
  private sources: ConfigSource[] = [];
  private eventBus: EventBus;
  private validations: Map<string, ConfigValidation> = new Map();
  private watchers: Map<string, Set<(value: any, oldValue: any) => void>> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  addSource(source: ConfigSource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => b.priority - a.priority); 

    this.eventBus.publish({
      type: 'config.source.added',
      data: { sourceName: source.name, priority: source.priority },
      source: 'config-manager'
    });
  }

  async load(): Promise<void> {
    try {
      await this.eventBus.publish({
        type: 'config.loading.started',
        data: { sources: this.sources.map(s => s.name) },
        source: 'config-manager'
      });

      for (const source of this.sources) {
        try {
          const config = await source.load();
          this.mergeConfig(config, source.name, source.priority);
        } catch (error) {
          await this.eventBus.publish({
            type: 'config.source.error',
            data: { sourceName: source.name, error: error instanceof Error ? error.message : String(error) },
            source: 'config-manager'
          });
        }
      }

      await this.validateAll();

      await this.eventBus.publish({
        type: 'config.loading.completed',
        data: { totalKeys: this.config.size },
        source: 'config-manager'
      });
    } catch (error) {
      await this.eventBus.publish({
        type: 'config.loading.error',
        data: { error: error instanceof Error ? error.message : String(error) },
        source: 'config-manager'
      });
      throw error;
    }
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const value = this.config.get(key);
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Configuration key '${key}' not found`);
    }
    return value as T;
  }

  getNested<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new Error(`Configuration path '${path}' not found`);
      }
    }

    return value as T;
  }

  async set(key: string, value: any, source: string = 'manual'): Promise<void> {
    const oldValue = this.config.get(key);

    this.config.set(key, value);

    const validation = this.validations.get(key);
    const metadata: ConfigMetadata = {
      key,
      value,
      source,
      priority: 1000, 
      lastModified: new Date(),
      ...(validation && { validation })
    };

    this.metadata.set(key, metadata);

    await this.validateKey(key, value);

    this.notifyWatchers(key, value, oldValue);

    await this.eventBus.publish({
      type: 'config.value.changed',
      data: { key, value, oldValue, source },
      source: 'config-manager'
    });
  }

  async setNested(path: string, value: any, source: string = 'manual'): Promise<void> {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    let current: any = Object.fromEntries(this.config.entries());
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const oldValue = current[lastKey];
    current[lastKey] = value;

    if (keys.length > 0) {
      const topLevelKey = keys[0]!;
      const configObject = Object.fromEntries(this.config.entries());
      const topLevelValue = configObject[topLevelKey];
      this.config.set(topLevelKey, topLevelValue);
    }

    const validation = this.validations.get(path);
    const metadata: ConfigMetadata = {
      key: path,
      value,
      source,
      priority: 1000,
      lastModified: new Date(),
      ...(validation && { validation })
    };

    this.metadata.set(path, metadata);

    await this.validateKey(path, value);

    this.notifyWatchers(path, value, oldValue);

    await this.eventBus.publish({
      type: 'config.value.changed',
      data: { key: path, value, oldValue, source },
      source: 'config-manager'
    });
  }

  has(key: string): boolean {
    return this.config.has(key);
  }

  async delete(key: string): Promise<boolean> {
    const oldValue = this.config.get(key);
    const deleted = this.config.delete(key);

    if (deleted) {
      this.metadata.delete(key);

      this.notifyWatchers(key, undefined, oldValue);

      await this.eventBus.publish({
        type: 'config.value.deleted',
        data: { key, oldValue },
        source: 'config-manager'
      });
    }

    return deleted;
  }

  keys(): string[] {
    return Array.from(this.config.keys());
  }

  values(): any[] {
    return Array.from(this.config.values());
  }

  entries(): [string, any][] {
    return Array.from(this.config.entries());
  }

  getMetadata(key: string): ConfigMetadata | undefined {
    return this.metadata.get(key);
  }

  getAllMetadata(): ConfigMetadata[] {
    return Array.from(this.metadata.values());
  }

  addValidation(key: string, validation: ConfigValidation): void {
    this.validations.set(key, validation);

    if (this.config.has(key)) {
      this.validateKey(key, this.config.get(key));
    }
  }

  watch(key: string, callback: (value: any, oldValue: any) => void): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }

    this.watchers.get(key)!.add(callback);

    return () => {
      this.watchers.get(key)?.delete(callback);
    };
  }

  async save(sourceName?: string): Promise<void> {
    const config = Object.fromEntries(this.config.entries());

    if (sourceName) {
      const source = this.sources.find(s => s.name === sourceName);
      if (source && source.save) {
        await source.save(config);
      } else {
        throw new Error(`Source '${sourceName}' not found or doesn't support saving`);
      }
    } else {
      for (const source of this.sources) {
        if (source.save) {
          try {
            await source.save(config);
          } catch (error) {
            await this.eventBus.publish({
              type: 'config.save.error',
              data: { sourceName: source.name, error: error instanceof Error ? error.message : String(error) },
              source: 'config-manager'
            });
          }
        }
      }
    }

    await this.eventBus.publish({
      type: 'config.saved',
      data: { sourceName },
      source: 'config-manager'
    });
  }

  async reload(): Promise<void> {
    this.config.clear();
    this.metadata.clear();
    await this.load();
  }

  toObject(): Record<string, any> {
    return Object.fromEntries(this.config.entries());
  }

  private mergeConfig(config: Record<string, any>, sourceName: string, priority: number): void {
    for (const [key, value] of Object.entries(config)) {
      const existing = this.metadata.get(key);

      if (!existing || priority >= existing.priority) {
        this.config.set(key, value);

        const validation = this.validations.get(key);
        const metadata: ConfigMetadata = {
          key,
          value,
          source: sourceName,
          priority,
          lastModified: new Date(),
          ...(validation && { validation })
        };

        this.metadata.set(key, metadata);
      }
    }
  }

  private async validateKey(key: string, value: any): Promise<void> {
    const validation = this.validations.get(key);
    if (validation) {
      try {
        validation.schema.parse(value);
      } catch (error) {
        await this.eventBus.publish({
          type: 'config.validation.error',
          data: { key, value, error: error instanceof Error ? error.message : String(error) },
          source: 'config-manager'
        });

        if (validation.required) {
          throw new Error(`Configuration validation failed for '${key}': ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  private async validateAll(): Promise<void> {
    for (const [key, value] of this.config.entries()) {
      await this.validateKey(key, value);
    }
  }

  private notifyWatchers(key: string, value: any, oldValue: any): void {
    const watchers = this.watchers.get(key);
    if (watchers) {
      for (const callback of watchers) {
        try {
          callback(value, oldValue);
        } catch (error) {
          console.error(`Error in config watcher for key '${key}':`, error);
        }
      }
    }
  }

  getStatistics(): {
    totalKeys: number;
    sources: number;
    validations: number;
    watchers: number;
  } {
    return {
      totalKeys: this.config.size,
      sources: this.sources.length,
      validations: this.validations.size,
      watchers: Array.from(this.watchers.values()).reduce((sum, set) => sum + set.size, 0)
    };
  }
}

export const configManager = new ConfigManager(eventBus);
