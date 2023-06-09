import "./app.css";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  CodeBlock,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  InlineCode,
  Picker,
  PickerItem,
  ScrollArea,
  SearchInput,
  Select,
  SelectItem,
  Stack,
  Table,
  TableProps,
  ThemeProvider,
  Toaster,
  toast,
  useTextFilter,
} from "@reactants/core";
import objectHash from "object-hash";
import { useEffect, useState } from "react";
import superjson from "superjson";
import type { ActionDefinition, Config, RowAction, Schema } from "./config";

interface StudioProps {
  config: Config;
  getBearerToken?: () => Promise<string> | string;
}

export function Studio({ config, getBearerToken }: StudioProps) {
  const keys = Object.keys(config.schemas);
  const [active, setActive] = useState<keyof typeof config.schemas>(keys[0]);
  const schema = config.schemas[active];
  const [search, setSearch] = useState("");

  const [filterValues, setFilterValues] = useState<Record<string, any>>(
    schema.filters?.reduce((acc, filter, i) => {
      acc[filter.id] = filter.defaultValue;
      return acc;
    }, {})
  );

  const schemaFilters = schema.filters?.map((filter) => {
    return filter.filter(filterValues[filter.id]);
  });

  return (
    <ThemeProvider>
      <main>
        <Stack align="center" mx="24" mt="40" gap="56">
          <Stack gap="16" style={{ maxWidth: 1400, width: "100%" }}>
            <Stack direction="row" justify="between" align="center">
              <Stack direction="row" gap="16">
                {schema.filters?.map((filter, i) => {
                  if (filter.show && !filter.show(filterValues)) return null;
                  switch (filter.type) {
                    case "picker":
                      return (
                        <Picker
                          key={i}
                          value={filterValues[filter.id]}
                          defaultValue={filter.defaultValue}
                          onValueChange={(value) => setFilterValues((values) => ({ ...values, [filter.id]: value }))}
                        >
                          {filter.options.map((item) => (
                            <PickerItem key={item.value} value={item.value}>
                              {item.label}
                            </PickerItem>
                          ))}
                        </Picker>
                      );
                  }
                })}

                <SearchInput onChange={(e) => setSearch(e.target.value)} value={search} />
              </Stack>

              <Select placeholder="Choose a model" value={active} onValueChange={setActive}>
                {keys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </Select>
            </Stack>

            <ModelView
              key={active}
              modelName={active}
              schema={schema}
              getBearerToken={getBearerToken}
              filters={[useTextFilter(search), ...(schemaFilters || [])]}
            />
          </Stack>
        </Stack>
      </main>
      <Toaster />
    </ThemeProvider>
  );
}

const rpc = async (
  modelName: string,
  operation: string,
  args: any,
  getBearerToken?: () => Promise<string> | string
) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: getBearerToken ? await getBearerToken() : "",
  };

  return await fetch("/api/fascia", {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "clientRequest",
      payload: { modelName, operation, args },
    }),
  })
    .then((res) => res.json())
    .then((res) => superjson.deserialize<any>(res));
};

interface ModelViewProps<T> {
  modelName: string;
  schema: Schema<T>;
  getBearerToken?: () => Promise<string> | string;
  filters: TableProps<T, any>["filters"];
}

function RowAction({ confirm, name, type, onAction }: ActionDefinition) {
  return confirm ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem danger={type === "danger"} onSelect={(e) => e.preventDefault()}>
          {name}
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onAction()} color={type === "danger" ? "red" : "gray"}>
            {confirm.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <DropdownMenuItem onSelect={() => onAction()} danger={type === "danger"}>
      {name}
    </DropdownMenuItem>
  );
}

function DeletePreview({ data }) {
  return (
    <ScrollArea
      style={{
        maxHeight: 200,
        display: "flex",
        flexDirection: "column",
        marginTop: "var(--sp-12)",
        borderRadius: "var(--br-4)",
      }}
    >
      <CodeBlock>{JSON.stringify(data, null, 2)}</CodeBlock>
    </ScrollArea>
  );
}

function ModelView<T>({ modelName, schema, getBearerToken, filters }: ModelViewProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [refetch, setRefetch] = useState(0);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const getRowId = (row: T) => objectHash(schema.where ? schema.where(row) : { id: row["id"] });

  useEffect(() => {
    const { include } = schema;
    rpc(modelName, "findMany", { include }, getBearerToken).then((data) => setData(data));
  }, [refetch, modelName]);

  const removeDocument = (document: T) => async () => {
    setRemovedIds((ids) => [...ids, getRowId(document)]);

    rpc(
      modelName,
      "delete",
      {
        where: schema.where ? schema.where(document) : { id: document["id"] },
      },
      getBearerToken
    ).then((res) => console.log(res));
  };

  const removeDocuments = (documents: T[]) => async () => {
    setRemovedIds((ids) => [...ids, ...documents.map(getRowId)]);

    rpc(
      modelName,
      "deleteMany",
      {
        where: { OR: [...documents.map(schema.where)] },
      },
      getBearerToken
    ).then((res) => console.log(res));
  };

  const rowActions = (document: T) =>
    (schema.rowActions
      ? typeof schema.rowActions === "function"
        ? schema.rowActions(document)
        : schema.rowActions
      : []
    ).map((action) =>
      action({
        document,
        removeDocument: removeDocument(document),
        toast,
      })
    );

  const columns = schema.columns.map(({ header, accessor, render }) => {
    return {
      header: () => header,
      id: typeof accessor === "function" ? accessor.name : accessor,
      ...(typeof accessor === "function" ? { accessorFn: accessor } : { accessorKey: accessor }),
      cell: render ? ({ row }) => render(row.original) : ({ renderValue }) => renderValue(),
    };
  });

  return (
    <Table
      fixed
      sorting
      pagination
      caption={`Table of ${modelName} records`}
      columns={columns}
      data={data.filter((d) => !removedIds.includes(getRowId(d)))}
      filters={filters}
      selectable
      headerActions={(ctx) => {
        const { flatRows } = ctx.table.getSelectedRowModel();
        const rows = flatRows.map((row) => row.original);
        const count = flatRows.length;

        return (
          <DropdownMenuGroup>
            <AlertDialog>
              {count > 0 ? (
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem danger onSelect={(e) => e.preventDefault()}>
                    Delete records ({count})
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              ) : (
                <DropdownMenuItem disabled>Delete records (0)</DropdownMenuItem>
              )}
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to delete the following {count > 1 ? `${count} records` : "record"}. This action
                    cannot be undone.
                    <ScrollArea
                      style={{
                        maxHeight: 200,
                        display: "flex",
                        flexDirection: "column",
                        marginTop: "var(--sp-12)",
                        borderRadius: "var(--br-4)",
                      }}
                    >
                      <InlineCode style={{ whiteSpace: "pre", display: "block" }}>
                        {JSON.stringify(data, null, 2)}
                      </InlineCode>
                    </ScrollArea>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      ctx.table.resetRowSelection();
                      await removeDocuments(rows)();
                      toast.success(`Deleted ${count} records`);
                    }}
                    color="red"
                  >
                    {count > 1 ? `Delete ${count} records` : "Delete record"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuGroup>
        );
      }}
      rowActions={(ctx) => {
        const row = ctx.row.original;
        const actions = rowActions(row);

        return (
          <DropdownMenuGroup>
            {actions.map((props, i) => (
              <RowAction key={i} {...props} />
            ))}

            <DropdownMenuSeparator />

            <RowAction
              type="danger"
              name="Delete record"
              confirm={{
                title: "Are you sure?",
                description: (
                  <>
                    You are about to delete the following record. This action cannot be undone.
                    <DeletePreview data={row} />
                  </>
                ),
                action: "Delete record",
              }}
              onAction={async () => {
                ctx.table.resetRowSelection();
                await removeDocument(row)();
                toast.success(`Deleted record`);
              }}
            />
          </DropdownMenuGroup>
        );
      }}
    />
  );
}
