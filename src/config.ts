import { ColumnDef } from '@tanstack/react-table';
import * as path from 'path';

export type DocumentAction<T> = (props: { document: T }) => {
  label: string;
  onHandle: () => void | Promise<void>;
  icon?: React.ElementType;
};

export function defineAction<T>(action: DocumentAction<T>): DocumentAction<T> {
  return action;
}

export interface Schema<T> {
  name: string;
  actions: DocumentAction<T>[];
  columns: ColumnDef<T, any>[];
}

export interface Config {
  schemas: Record<string, Schema<any>>;
}

export function defineConfig(config: Config): Config {
  return config;
}

export function getConfigPath() {
  return path.resolve(process.cwd(), 'dash.config.ts');
}

declare global {
  interface Window {
    configPath: string;
  }
}

export async function loadConfig() {
  const dynamicImport = new Function('file', 'return import(file)');
  const configPath =
    typeof window !== 'undefined' ? window.configPath : getConfigPath();
  const config = await dynamicImport(configPath);
  return config.default;
}
