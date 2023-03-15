import { ColumnDef } from '@tanstack/react-table';

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
  return '/Users/dante/repos/dash/dev/dash.config.ts';
}
