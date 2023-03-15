import { toast } from '@danteissaias/ds';
import { Mail, ShoppingCart } from 'react-feather';
import { defineAction, defineConfig } from '../src';

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
    // await fetch('/api/forgot-password', {
    //   method: 'POST',
    //   body: JSON.stringify({ email: document.email }),
    // });
    toast.success('Password recovery email sent');
  },
}));

const paymentHistory = defineAction<User>(({ document }) => ({
  label: 'View payment history',
  icon: ShoppingCart,
  onHandle: async () => {
    // const href =
    //   'https://dashboard.stripe.com/customers/' + document.customerId;
    window.open('https://example.com');
  },
}));

export default defineConfig({
  schemas: {
    user: {
      name: 'Users',
      actions: [forgotPassword, paymentHistory],
      columns: [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'createdAt', header: 'Created at' },
      ],
    },
  },
});
