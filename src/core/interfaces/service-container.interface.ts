export interface IServiceDefinition<T = any> {
  id: string;
  factory: () => T | Promise<T>;
  singleton: boolean;
  dependencies: string[];
  instance?: T;
  metadata?: Record<string, any>;
}

export interface IServiceMetadata {
  id: string;
  singleton: boolean;
  dependencies: string[];
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface IServiceContainer {

  register<T>(
    id: string,
    factory: () => T | Promise<T>,
    options?: {
      singleton?: boolean;
      dependencies?: string[];
      metadata?: Record<string, any>;
    }
  ): void;

  registerSingleton<T>(
    id: string,
    factory: () => T | Promise<T>,
    dependencies?: string[]
  ): void;

  registerTransient<T>(
    id: string,
    factory: () => T | Promise<T>,
    dependencies?: string[]
  ): void;

  registerInstance<T>(id: string, instance: T): void;

  resolve<T>(id: string): Promise<T>;

  resolveAll<T>(ids: string[]): Promise<T[]>;

  isRegistered(id: string): boolean;

  isResolved(id: string): boolean;

  unregister(id: string): boolean;

  getAllServices(): IServiceMetadata[];

  getServicesByMetadata(key: string, value: any): IServiceMetadata[];

  getDependencyGraph(): Record<string, string[]>;

  getDependents(serviceId: string): string[];

  clear(): void;

  validateDependencies(): { valid: boolean; cycles: string[][] };

  getStatistics(): ServiceContainerStatistics;
}

export interface ServiceContainerStatistics {
  total: number;
  singletons: number;
  resolved: number;
  withDependencies: number;
}
