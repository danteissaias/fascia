import { ColumnDef } from '@tanstack/react-table';

export type HeaderAction<T> = (props: {
  documents: T[];
  removeDocuments: () => Promise<void>;
}) => {
  label: string;
  onHandle: () => void | Promise<void>;
  type?: 'default' | 'danger' | 'success';
  icon?: React.ElementType;
};

export type DocumentAction<T> = (props: {
  document: T;
  removeDocument: () => Promise<void>;
}) => {
  label: string;
  onHandle: () => void | Promise<void>;
  type?: 'default' | 'danger';
  icon?: React.ElementType;
};

export function defineAction<T>(action: DocumentAction<T>): DocumentAction<T> {
  return action;
}

export interface Schema<T> {
  // TODO: Infer this from the model
  where: (document: T) => Record<string, any>;
  rowActions: DocumentAction<T>[];
  columns: ColumnDef<T, any>[];
}

export interface Config {
  schemas: Record<string, Schema<any>>;
}

export function defineConfig(config: Config): Config {
  return config;
}
