import { ColumnDef } from '@tanstack/react-table';
import { toast } from '@danteissaias/ds';

export type HeaderAction<T> = (props: {
  documents: T[];
  removeDocuments: () => Promise<void>;
  toast: typeof toast;
}) => {
  text: string;
  onHandle: () => void | Promise<void>;
  type?: 'default' | 'danger';
};

export type RowAction<T> = (props: {
  document: T;
  removeDocument: () => Promise<void>;
  toast: typeof toast;
}) => {
  name: string;
  onAction: () => void | Promise<void>;
  type?: 'default' | 'danger';
};

export function defineRowAction<T>(action: RowAction<T>): RowAction<T> {
  return action;
}

export interface Schema<T> {
  // TODO: Infer these from the model
  include?: Record<string, boolean>;
  where: (document: T) => Record<string, any>;

  rowActions?: RowAction<T>[] | ((document: T) => RowAction<T>[]);
  columns: ColumnDef<T, any>[];
}

export interface Config {
  schemas: Record<string, Schema<any>>;
}

export function defineConfig(config: Config): Config {
  return config;
}
