import type { User } from "@prisma/client";
import { defineConfig, defineRowAction, Schema, Badge } from "@fascia/web";
import ms from "ms";

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

const User: Schema<User> = {
  where: (document) => ({ id: document.id }),
  rowActions: [forgotPassword, paymentHistory],
  columns: [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Created at",
      accessor: "createdAt",
      render: (row) => ms(Date.now() - new Date(row.createdAt).getTime()) + " ago",
    },
    {
      header: "Type",
      accessor: "type",
      render: (row) => <Badge>{row.type}</Badge>,
    },
  ],
};

export default defineConfig({
  schemas: {
    User,
    Organization: {
      where: (document) => ({ id: document.id }),
      columns: [{ accessor: "name", header: "Name" }],
    },
  },
});
