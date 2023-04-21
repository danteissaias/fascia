import type { User } from "@prisma/client";
import { formatDate, defineConfig, defineRowAction, Schema, Badge } from "@fascia/web";
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
  rowActions: [forgotPassword, paymentHistory],
  filters: [
    {
      id: "type",
      type: "picker",
      options: [
        { label: "All", value: "all" },
        { label: "Customer", value: "customer" },
        { label: "Subuser", value: "subuser" },
      ],
      defaultValue: "all",
      filter: (value) => (rows) => {
        return rows.filter((row) => {
          if (value === "all") return true;
          else return row.type === value;
        });
      },
    },

    {
      id: "recent",
      type: "picker",
      options: [
        { label: "All", value: "all" },
        { label: "Recent", value: "recent" },
      ],
      defaultValue: "all",
      show: (ctx) => ctx.type === "customer",
      filter: (value) => (rows) => {
        return rows.filter((r) => {
          if (value === "all") return true;
          const daysAgo = Date.now() - ms("2 days");
          return r.createdAt.getTime() <= daysAgo;
        });
      },
    },
  ],
  columns: [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Created at",
      accessor: "createdAt",
      render: (row) => formatDate(row.createdAt),
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
      columns: [{ accessor: "name", header: "Name" }],
    },
  },
});
