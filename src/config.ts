import { ColumnDef } from '@tanstack/react-table';
import * as path from 'path';

export type DocumentAction<T> = (props: {
  document: T;
  removeDocument: () => Promise<void>;
}) => {
  label: string;
  onHandle: () => void | Promise<void>;
  danger?: boolean;
  icon?: React.ElementType;
};

export function defineAction<T>(action: DocumentAction<T>): DocumentAction<T> {
  return action;
}

export interface Schema<T> {
  // TODO: Infer this from the model
  where: (document: T) => Record<string, any>;
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
  const configPath =
    typeof window !== 'undefined' ? window.configPath : getConfigPath();
  return await import(/* @vite-ignore */ configPath).then((mod) => mod.default);
}
