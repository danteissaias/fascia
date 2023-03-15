import { Mail, ShoppingCart } from 'react-feather';
import { ColumnDef } from '@tanstack/react-table';

type DocumentAction<T> = (props: { document: T }) => {
  label: string;
  onHandle: () => void | Promise<void>;
  icon?: React.ElementType;
};

function defineAction<T>(action: DocumentAction<T>): DocumentAction<T> {
  return action;
}

interface Schema<T> {
  name: string;
  actions: DocumentAction<T>[];
  columns: ColumnDef<T, any>[];
}

interface Config {
  schemas: Record<string, Schema<any>>;
}

function defineConfig(config: Config): Config {
  return config;
}

export interface User {
  name: string;
  email: string;
  createdAt: string;
  type: 'subuser' | 'customer';
  customerId?: string;
}

const forgotPassword = defineAction<User>(({ document }) => ({
  label: 'Send password recovery',
  icon: Mail,
  onHandle: async () => {
    await fetch('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: document.email }),
    });
  },
}));

const paymentHistory = defineAction<User>(({ document }) => ({
  label: 'View payment history',
  icon: ShoppingCart,
  onHandle: async () => {
    const href =
      'https://dashboard.stripe.com/customers/' + document.customerId;
    window.open(href);
  },
}));

export default defineConfig({
  schemas: {
    user: {
      name: 'Users',
      actions: [paymentHistory, forgotPassword],
      columns: [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'createdAt', header: 'Created at' },
      ],
    },
  },
});
