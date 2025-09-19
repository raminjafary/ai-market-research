import { EventBus, eventBus } from './event-bus.js';

export interface ServiceDefinition<T = any> {
  id: string;
  factory: () => T | Promise<T>;
  singleton: boolean;
  dependencies: string[];
  instance?: T;
  metadata?: Record<string, any>;
}

export interface ServiceMetadata {
  id: string;
  singleton: boolean;
  dependencies: string[];
  resolved: boolean;
  metadata?: Record<string, any>;
}

export class ServiceContainer {
  private services: Map<string, ServiceDefinition> = new Map();
  private eventBus: EventBus;
  private resolving: Set<string> = new Set();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  register<T>(
    id: string,
    factory: () => T | Promise<T>,
    options: {
      singleton?: boolean;
      dependencies?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const { singleton = true, dependencies = [], metadata = {} } = options;

    if (this.services.has(id)) {
      throw new Error(`Service ${id} is already registered`);
    }

    const serviceDef: ServiceDefinition<T> = {
      id,
      factory,
      singleton,
      dependencies,
      metadata
    };

    this.services.set(id, serviceDef);

    this.eventBus.publish({
      type: 'service.registered',
      data: { serviceId: id, singleton, dependencies },
      source: 'service-container'
    });
  }

  registerSingleton<T>(
    id: string,
    factory: () => T | Promise<T>,
    dependencies: string[] = []
  ): void {
    this.register(id, factory, { singleton: true, dependencies });
  }

  registerTransient<T>(
    id: string,
    factory: () => T | Promise<T>,
    dependencies: string[] = []
  ): void {
    this.register(id, factory, { singleton: false, dependencies });
  }

  registerInstance<T>(id: string, instance: T): void {
    this.register(id, () => instance, { singleton: true });
  }

  async resolve<T>(id: string): Promise<T> {
    const serviceDef = this.services.get(id);
    if (!serviceDef) {
      throw new Error(`Service ${id} is not registered`);
    }

    if (this.resolving.has(id)) {
      throw new Error(`Circular dependency detected for service ${id}`);
    }

    if (serviceDef.singleton && serviceDef.instance) {
      return serviceDef.instance;
    }

    try {
      this.resolving.add(id);

      const resolvedDependencies = await this.resolveDependencies(serviceDef.dependencies);

      const instance = await serviceDef.factory();

      if (serviceDef.singleton) {
        serviceDef.instance = instance;
      }

      this.eventBus.publish({
        type: 'service.resolved',
        data: { serviceId: id, singleton: serviceDef.singleton },
        source: 'service-container'
      });

      return instance;
    } finally {
      this.resolving.delete(id);
    }
  }

  async resolveAll<T>(ids: string[]): Promise<T[]> {
    const instances: T[] = [];
    for (const id of ids) {
      instances.push(await this.resolve<T>(id));
    }
    return instances;
  }

  isRegistered(id: string): boolean {
    return this.services.has(id);
  }

  isResolved(id: string): boolean {
    const serviceDef = this.services.get(id);
    return serviceDef?.singleton === true && serviceDef.instance !== undefined;
  }

  unregister(id: string): boolean {
    const serviceDef = this.services.get(id);
    if (!serviceDef) {
      return false;
    }

    const dependents = this.getDependents(id);
    if (dependents.length > 0) {
      throw new Error(`Cannot unregister service ${id} - it has dependents: ${dependents.join(', ')}`);
    }

    this.services.delete(id);

    this.eventBus.publish({
      type: 'service.unregistered',
      data: { serviceId: id },
      source: 'service-container'
    });

    return true;
  }

  getAllServices(): ServiceMetadata[] {
    return Array.from(this.services.values()).map(def => ({
      id: def.id,
      singleton: def.singleton,
      dependencies: def.dependencies,
      resolved: def.singleton && def.instance !== undefined,
      metadata: def.metadata || {}
    }));
  }

  getServicesByMetadata(key: string, value: any): ServiceMetadata[] {
    return this.getAllServices().filter(service => 
      service.metadata?.[key] === value
    );
  }

  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    for (const [id, serviceDef] of this.services.entries()) {
      graph[id] = [...serviceDef.dependencies];
    }
    return graph;
  }

  getDependents(serviceId: string): string[] {
    const dependents: string[] = [];
    for (const [id, serviceDef] of this.services.entries()) {
      if (serviceDef.dependencies.includes(serviceId)) {
        dependents.push(id);
      }
    }
    return dependents;
  }

  clear(): void {
    this.services.clear();
    this.resolving.clear();

    this.eventBus.publish({
      type: 'service.container.cleared',
      data: {},
      source: 'service-container'
    });
  }

  private async resolveDependencies(dependencies: string[]): Promise<any[]> {
    const resolved: any[] = [];
    for (const dep of dependencies) {
      resolved.push(await this.resolve(dep));
    }
    return resolved;
  }

  validateDependencies(): { valid: boolean; cycles: string[][] } {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {

        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const serviceDef = this.services.get(node);
      if (serviceDef) {
        for (const dep of serviceDef.dependencies) {
          dfs(dep, [...path, node]);
        }
      }

      recursionStack.delete(node);
    };

    for (const [id] of this.services) {
      if (!visited.has(id)) {
        dfs(id, []);
      }
    }

    return {
      valid: cycles.length === 0,
      cycles
    };
  }

  getStatistics(): {
    total: number;
    singletons: number;
    resolved: number;
    withDependencies: number;
  } {
    const services = Array.from(this.services.values());
    return {
      total: services.length,
      singletons: services.filter(s => s.singleton).length,
      resolved: services.filter(s => s.singleton && s.instance !== undefined).length,
      withDependencies: services.filter(s => s.dependencies.length > 0).length
    };
  }
}

export const serviceContainer = new ServiceContainer(eventBus);
