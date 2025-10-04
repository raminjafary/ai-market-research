import { EventBus, eventBus } from './event-bus.js';
import { PluginRegistry } from './plugin-registry.js';
import type { PluginInfo, PluginStatus } from './plugin-registry.js';
import { ServiceContainer, serviceContainer } from './service-container.js';
import { ConfigManager, configManager } from './config-manager.js';

export interface LifecyclePhase {
  name: string;
  order: number;
  description: string;
  dependencies: string[];
}

export interface LifecycleHook {
  id: string;
  phase: string;
  pluginId: string;
  handler: () => Promise<void> | void;
  priority: number;
  enabled: boolean;
}

export interface LifecycleStatus {
  phase: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  hooks: LifecycleHook[];
}

export class LifecycleManager {
  private phases: Map<string, LifecyclePhase> = new Map();
  private hooks: Map<string, LifecycleHook[]> = new Map();
  private status: Map<string, LifecycleStatus> = new Map();
  private eventBus: EventBus;
  private pluginRegistry: PluginRegistry;
  private serviceContainer: ServiceContainer;
  private configManager: ConfigManager;
  private isRunning = false;

  constructor(
    eventBus: EventBus,
    pluginRegistry: PluginRegistry,
    serviceContainer: ServiceContainer,
    configManager: ConfigManager
  ) {
    this.eventBus = eventBus;
    this.pluginRegistry = pluginRegistry;
    this.serviceContainer = serviceContainer;
    this.configManager = configManager;
    this.initializeDefaultPhases();
  }

  registerPhase(phase: LifecyclePhase): void {
    this.phases.set(phase.name, phase);

    this.eventBus.publish({
      type: 'lifecycle.phase.registered',
      data: { phase: phase.name, order: phase.order },
      source: 'lifecycle-manager'
    });
  }

  registerHook(hook: Omit<LifecycleHook, 'id'>): string {
    const id = this.generateId();
    const fullHook: LifecycleHook = { ...hook, id };

    if (!this.hooks.has(hook.phase)) {
      this.hooks.set(hook.phase, []);
    }

    this.hooks.get(hook.phase)!.push(fullHook);
    this.hooks.get(hook.phase)!.sort((a, b) => b.priority - a.priority);

    this.eventBus.publish({
      type: 'lifecycle.hook.registered',
      data: { hookId: id, phase: hook.phase, pluginId: hook.pluginId },
      source: 'lifecycle-manager'
    });

    return id;
  }

  unregisterHook(hookId: string): boolean {
    for (const [phase, hooks] of this.hooks.entries()) {
      const index = hooks.findIndex(h => h.id === hookId);
      if (index !== -1) {
        hooks.splice(index, 1);

        this.eventBus.publish({
          type: 'lifecycle.hook.unregistered',
          data: { hookId, phase },
          source: 'lifecycle-manager'
        });

        return true;
      }
    }
    return false;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Lifecycle manager is already running');
    }

    this.isRunning = true;

    try {
      await this.eventBus.publish({
        type: 'lifecycle.starting',
        data: {},
        source: 'lifecycle-manager'
      });

      const phases = Array.from(this.phases.values()).sort((a, b) => a.order - b.order);

      for (const phase of phases) {
        await this.executePhase(phase);
      }

      await this.eventBus.publish({
        type: 'lifecycle.started',
        data: {},
        source: 'lifecycle-manager'
      });
    } catch (error) {
      this.isRunning = false;

      await this.eventBus.publish({
        type: 'lifecycle.start.error',
        data: { error: error instanceof Error ? error.message : String(error) },
        source: 'lifecycle-manager'
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
        type: 'lifecycle.stopping',
        data: {},
        source: 'lifecycle-manager'
      });

      const phases = Array.from(this.phases.values()).sort((a, b) => b.order - a.order);

      for (const phase of phases) {
        await this.executePhase(phase, true);
      }

      this.isRunning = false;

      await this.eventBus.publish({
        type: 'lifecycle.stopped',
        data: {},
        source: 'lifecycle-manager'
      });
    } catch (error) {
      this.isRunning = false;

      await this.eventBus.publish({
        type: 'lifecycle.stop.error',
        data: { error: error instanceof Error ? error.message : String(error) },
        source: 'lifecycle-manager'
      });

      throw error;
    }
  }

  async executePhase(phase: LifecyclePhase, reverse: boolean = false): Promise<void> {
    const status: LifecycleStatus = {
      phase: phase.name,
      status: 'running',
      startTime: new Date(),
      hooks: this.hooks.get(phase.name) || []
    };

    this.status.set(phase.name, status);

    try {
      await this.eventBus.publish({
        type: 'lifecycle.phase.starting',
        data: { phase: phase.name },
        source: 'lifecycle-manager'
      });

      const hooks = this.hooks.get(phase.name) || [];
      const enabledHooks = hooks.filter(h => h.enabled);

      if (reverse) {
        enabledHooks.reverse();
      }

      for (const hook of enabledHooks) {
        try {
          await hook.handler();

          await this.eventBus.publish({
            type: 'lifecycle.hook.completed',
            data: { hookId: hook.id, phase: phase.name, pluginId: hook.pluginId },
            source: 'lifecycle-manager'
          });
        } catch (error) {
          await this.eventBus.publish({
            type: 'lifecycle.hook.error',
            data: { 
              hookId: hook.id, 
              phase: phase.name, 
              pluginId: hook.pluginId, 
              error: error instanceof Error ? error.message : String(error)
            },
            source: 'lifecycle-manager'
          });

          if (phase.name === 'critical') {
            throw error;
          }
        }
      }

      status.status = 'completed';
      status.endTime = new Date();

      await this.eventBus.publish({
        type: 'lifecycle.phase.completed',
        data: { phase: phase.name },
        source: 'lifecycle-manager'
      });
    } catch (error) {
      status.status = 'error';
      status.endTime = new Date();
      status.error = error instanceof Error ? error.message : String(error);

      await this.eventBus.publish({
        type: 'lifecycle.phase.error',
        data: { phase: phase.name, error: error instanceof Error ? error.message : String(error) },
        source: 'lifecycle-manager'
      });

      throw error;
    }
  }

  getStatus(): LifecycleStatus[] {
    return Array.from(this.status.values());
  }

  getPhaseStatus(phaseName: string): LifecycleStatus | undefined {
    return this.status.get(phaseName);
  }

  getPhases(): LifecyclePhase[] {
    return Array.from(this.phases.values()).sort((a, b) => a.order - b.order);
  }

  getHooks(phaseName: string): LifecycleHook[] {
    return this.hooks.get(phaseName) || [];
  }

  setHookEnabled(hookId: string, enabled: boolean): boolean {
    for (const hooks of this.hooks.values()) {
      const hook = hooks.find(h => h.id === hookId);
      if (hook) {
        hook.enabled = enabled;

        this.eventBus.publish({
          type: 'lifecycle.hook.enabled.changed',
          data: { hookId, enabled },
          source: 'lifecycle-manager'
        });

        return true;
      }
    }
    return false;
  }

  isLifecycleRunning(): boolean {
    return this.isRunning;
  }

  private initializeDefaultPhases(): void {
    const defaultPhases: LifecyclePhase[] = [
      {
        name: 'pre-init',
        order: 0,
        description: 'Pre-initialization phase',
        dependencies: []
      },
      {
        name: 'config',
        order: 1,
        description: 'Configuration loading phase',
        dependencies: ['pre-init']
      },
      {
        name: 'services',
        order: 2,
        description: 'Service container initialization',
        dependencies: ['config']
      },
      {
        name: 'plugins',
        order: 3,
        description: 'Plugin discovery and loading',
        dependencies: ['services']
      },
      {
        name: 'post-init',
        order: 4,
        description: 'Post-initialization phase',
        dependencies: ['plugins']
      },
      {
        name: 'ready',
        order: 5,
        description: 'Application ready phase',
        dependencies: ['post-init']
      }
    ];

    for (const phase of defaultPhases) {
      this.registerPhase(phase);
    }
  }

  private generateId(): string {
    return `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatistics(): {
    phases: number;
    hooks: number;
    enabledHooks: number;
    running: boolean;
  } {
    const totalHooks = Array.from(this.hooks.values()).reduce((sum, hooks) => sum + hooks.length, 0);
    const enabledHooks = Array.from(this.hooks.values()).reduce((sum, hooks) => 
      sum + hooks.filter(h => h.enabled).length, 0
    );

    return {
      phases: this.phases.size,
      hooks: totalHooks,
      enabledHooks,
      running: this.isRunning
    };
  }
}

export const lifecycleManager = new LifecycleManager(
  eventBus,
  {} as PluginRegistry, 
  serviceContainer,
  configManager
);
