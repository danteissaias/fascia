import { Badge, toast } from '@danteissaias/ds';
import { User } from '@prisma/client';
import { Mail, ShoppingCart } from 'react-feather';
import { defineAction, defineConfig, Schema } from '../src';

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
    User: {
      where: (document) => ({ id: document.id }),
      rowActions: [forgotPassword, paymentHistory],
      columns: [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'createdAt', header: 'Created at' },
        {
          accessorKey: 'type',
          header: 'Type',
          cell: ({ getValue }) => <Badge>{getValue()}</Badge>,
        },
      ],
    },
  },
});
