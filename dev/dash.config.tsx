import { Badge, toast } from '@danteissaias/ds';
import { User } from '@prisma/client';
import { defineConfig, defineRowAction } from '../src';

const forgotPassword = defineRowAction<User>(({ document }) => ({
  name: 'Send password recovery',
  onAction: async () => {
    // await fetch('/api/forgot-password', {
    //   method: 'POST',
    //   body: JSON.stringify({ email: document.email }),
    // });
    toast.success('Password recovery email sent');
  },
}));

const paymentHistory = defineRowAction<User>(({ document }) => ({
  name: 'View payment history',
  onAction: async () => {
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

    Organization: {
      where: (document) => ({ id: document.id }),
      columns: [{ accessorKey: 'name', header: 'Name' }],
    },
  },
});
