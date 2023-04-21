import { toast } from "@reactants/core";

export type ActionDefinition = {
  name: string;
  onAction: () => void | Promise<void>;
  type?: "default" | "danger";
  confirm?: {
    title: string;
    description: React.ReactNode;
    action: string;
  };
};

export type RowAction<T> = (props: {
  document: T;
  removeDocument: () => Promise<void>;
  toast: typeof toast;
}) => ActionDefinition;

export function defineRowAction<T>(action: RowAction<T>): RowAction<T> {
  return action;
}

interface ColumnDef<T> {
  header?: React.ReactNode;
  accessor: (keyof T & string) | ((document: T) => any);
  render?: (document: T) => React.ReactNode;
}

interface Filter<TData, TValue = any> {
  id: string;
  type: "select" | "picker";
  options: { label: string; value: TValue }[];
  filter: (value: TValue) => (data: TData[]) => TData[];
  show?: (ctx: Record<string, any>) => boolean;
  defaultValue?: TValue;
}

export interface Schema<T> {
  // TODO: Infer these from the model
  include?: Record<string, boolean>;
  where?: (document: T) => Record<string, any>;
  filters?: Filter<T>[];
  rowActions?: RowAction<T>[] | ((document: T) => RowAction<T>[]);
  columns: ColumnDef<T>[];
}

export interface Config {
  schemas: Record<string, Schema<any>>;
}

export function defineConfig(config: Config): Config {
  return config;
}
