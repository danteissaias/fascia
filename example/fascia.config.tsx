import type { User } from "@prisma/client";
import { defineConfig, defineRowAction } from "@fascia/studio";
import { Badge } from "@danteissaias/ds";

const forgotPassword = defineRowAction<User>(({ document, toast }) => ({
  name: "Send password recovery",
  onAction: async () => {
    // await fetch('/api/forgot-password', {
    //   method: 'POST',
    //   body: JSON.stringify({ email: document.email }),
    // });
    toast.success("Password recovery email sent");
  },
}));

const paymentHistory = defineRowAction<User>(({ document }) => ({
  name: "View payment history",
  onAction: async () => {
    // const href =
    //   'https://dashboard.stripe.com/customers/' + document.customerId;
    window.open("https://example.com");
  },
}));

export default defineConfig({
  schemas: {
    User: {
      where: (document) => ({ id: document.id }),
      rowActions: [forgotPassword, paymentHistory],
      columns: [
        { header: "Name", accessorKey: "name" },
        { header: "Email", accessorKey: "email" },
        { header: "Created at", accessorKey: "createdAt" },
        {
          header: "Type",
          accessorKey: "type",
          cell: ({ renderValue }) => <Badge>{renderValue()}</Badge>,
        },
      ],
    },

    Organization: {
      where: (document) => ({ id: document.id }),
      columns: [{ accessorKey: "name", header: "Name" }],
    },
  },
});
