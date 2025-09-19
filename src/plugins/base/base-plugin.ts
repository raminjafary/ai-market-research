import type { IPlugin, IPluginContext, PluginStatus } from '../../core/interfaces/plugin.interface.js';

export abstract class BasePlugin implements IPlugin {
  public readonly manifest: any;
  protected context?: IPluginContext;
  protected status: PluginStatus = 'loading';
  protected config: Record<string, any> = {};

  constructor(manifest: any) {
    this.manifest = manifest;
  }

  async init(context: IPluginContext, config?: Record<string, any>): Promise<void> {
    this.context = context;
    this.config = config || {};

    if (this.manifest.configSchema) {
      this.applyDefaults();
    }

    this.status = 'active';

    if (this.manifest.configSchema) {
      const isValid = await this.validateConfig(this.config);
      if (!isValid) {
        this.log(`Configuration validation failed. Plugin ${this.manifest.id} may not work correctly.`, 'warn');

      }
    }

    await this.context.eventBus.publish({
      type: 'plugin.initialized',
      data: { pluginId: this.manifest.id, config: this.config },
      source: this.manifest.id
    });
  }

  async start(): Promise<void> {
    if (this.status !== 'active') {
      throw new Error(`Cannot start plugin ${this.manifest.id} - status is ${this.status}`);
    }

    await this.context?.eventBus.publish({
      type: 'plugin.started',
      data: { pluginId: this.manifest.id },
      source: this.manifest.id
    });
  }

  async stop(): Promise<void> {
    this.status = 'disabled';

    await this.context?.eventBus.publish({
      type: 'plugin.stopped',
      data: { pluginId: this.manifest.id },
      source: this.manifest.id
    });
  }

  async cleanup(): Promise<void> {

    await this.context?.eventBus.publish({
      type: 'plugin.cleanup',
      data: { pluginId: this.manifest.id },
      source: this.manifest.id
    });
  }

  getStatus(): PluginStatus {
    return this.status;
  }

  async isHealthy(): Promise<boolean> {
    return this.status === 'active';
  }

  getCapabilities(): string[] {
    return this.manifest.capabilities || [];
  }

  getConfigSchema(): Record<string, any> | undefined {
    return this.manifest.configSchema;
  }

  private applyDefaults(): void {
    if (!this.manifest.configSchema) {
      return;
    }

    const schema = this.manifest.configSchema;
    for (const [key, value] of Object.entries(schema)) {
      if ((value as any).default !== undefined && !(key in this.config)) {
        this.config[key] = (value as any).default;
      }
    }
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!this.manifest.configSchema) {
      return true;
    }

    try {

      const schema = this.manifest.configSchema;

      for (const [key, value] of Object.entries(schema)) {
        if ((value as any).required && !(key in config) && (value as any).default === undefined) {
          this.log(`Missing required configuration field: ${key}`, 'error');
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  async updateConfig(newConfig: Record<string, any>): Promise<void> {
    const isValid = await this.validateConfig(newConfig);
    if (!isValid) {
      throw new Error(`Invalid configuration for plugin ${this.manifest.id}`);
    }

    this.config = { ...this.config, ...newConfig };

    await this.context?.eventBus.publish({
      type: 'plugin.config.updated',
      data: { pluginId: this.manifest.id, config: this.config },
      source: this.manifest.id
    });
  }

  getContext(): IPluginContext | undefined {
    return this.context;
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const logMessage = `[${this.manifest.id}] ${message}`;

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

    this.context?.eventBus.publish({
      type: 'plugin.log',
      data: { 
        pluginId: this.manifest.id, 
        message, 
        level,
        timestamp: new Date()
      },
      source: this.manifest.id
    });
  }

  protected async publishEvent(type: string, data: any): Promise<void> {
    await this.context?.eventBus.publish({
      type,
      data,
      source: this.manifest.id
    });
  }

  protected subscribeToEvents(eventType: string, handler: (event: any) => void): string {
    return this.context?.eventBus.subscribe(eventType, handler) || '';
  }

  protected async getService<T>(serviceId: string): Promise<T> {
    return this.context?.serviceContainer.resolve<T>(serviceId)!;
  }

  protected getConfigValue<T>(key: string, defaultValue?: T): T {
    return this.config[key] !== undefined ? this.config[key] : defaultValue!;
  }

  protected setConfigValue(key: string, value: any): void {
    this.config[key] = value;
  }
}
