import { z } from 'zod';

export interface IConfigSource {
  name: string;
  priority: number;
  load(): Promise<Record<string, any>>;
  save?(config: Record<string, any>): Promise<void>;
}

export interface IConfigValidation {
  schema: z.ZodSchema;
  required?: boolean;
}

export interface IConfigMetadata {
  key: string;
  value: any;
  source: string;
  priority: number;
  lastModified: Date;
  validation?: IConfigValidation;
}

export interface IConfigManager {

  addSource(source: IConfigSource): void;

  load(): Promise<void>;

  get<T = any>(key: string, defaultValue?: T): T;

  getNested<T = any>(path: string, defaultValue?: T): T;

  set(key: string, value: any, source?: string): Promise<void>;

  setNested(path: string, value: any, source?: string): Promise<void>;

  has(key: string): boolean;

  delete(key: string): Promise<boolean>;

  keys(): string[];

  values(): any[];

  entries(): [string, any][];

  getMetadata(key: string): IConfigMetadata | undefined;

  getAllMetadata(): IConfigMetadata[];

  addValidation(key: string, validation: IConfigValidation): void;

  watch(key: string, callback: (value: any, oldValue: any) => void): () => void;

  save(sourceName?: string): Promise<void>;

  reload(): Promise<void>;

  toObject(): Record<string, any>;

  getStatistics(): ConfigManagerStatistics;
}

export interface ConfigManagerStatistics {
  totalKeys: number;
  sources: number;
  validations: number;
  watchers: number;
}
