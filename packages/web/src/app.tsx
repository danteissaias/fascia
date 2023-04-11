import "../node_modules/@danteissaias/ds/dist/index.css";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DsProvider,
  ScrollArea,
  SearchInput,
  Select,
  SelectItem,
  Stack,
  Table,
  TableProps,
  Text,
  toast,
  Toaster,
  useTextFilter,
} from "@danteissaias/ds";
import objectHash from "object-hash";
import { useEffect, useState } from "react";

import type { Config, Schema } from "./config";

interface StudioProps {
  config: Config;
  getBearerToken?: () => Promise<string> | string;
}

export function Studio({ config, getBearerToken }: StudioProps) {
  const keys = Object.keys(config.schemas);
  const [active, setActive] = useState<keyof typeof config.schemas>(keys[0]);
  const schema = config.schemas[active];
  const [search, setSearch] = useState("");

  return (
    <DsProvider>
      <main>
        <Stack align="center" mx="24" mt="40" gap="56">
          <Stack gap="12" style={{ maxWidth: 1000, width: "100%" }}>
            <Stack direction="row" justify="between" align="center">
              <Select placeholder="Choose a model" value={active} onValueChange={setActive}>
                {keys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </Select>
              {/* <Button size="1">Add record</Button> */}
              <Stack direction="row">
                <SearchInput onChange={(e) => setSearch(e.target.value)} value={search} />
              </Stack>
            </Stack>

            <ModelView
              modelName={active}
              schema={schema}
              getBearerToken={getBearerToken}
              filters={[[useTextFilter, search]]}
            />
          </Stack>
        </Stack>
      </main>
    </DsProvider>
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
  }).then((res) => res.json());
};

interface ModelViewProps<T> {
  modelName: string;
  schema: Schema<T>;
  getBearerToken?: () => Promise<string> | string;
  filters: TableProps<T, any>["filters"];
}

function ModelView<T>({ modelName, schema, getBearerToken, filters }: ModelViewProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [refetch, setRefetch] = useState(0);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const getRowId = (row: T) => objectHash(schema.where(row));

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
        where: schema.where(document),
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

  return (
    <Table
      sorting
      pagination
      caption={`Table of ${modelName} records`}
      columns={schema.columns}
      data={data.filter((d) => !removedIds.includes(getRowId(d)))}
      filters={filters}
      selectable
      headerActions={(ctx) => {
        const { flatRows } = ctx.table.getSelectedRowModel();
        const rows = flatRows.map((row) => row.original);
        const count = flatRows.length;
        console.log(count);

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
                      <Text whitespace="pre" code block>
                        {JSON.stringify(rows, null, 2)}
                      </Text>
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
            {actions.map(({ name, onAction }, i) => (
              <DropdownMenuItem key={i} onSelect={onAction}>
                {name}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem danger onSelect={(e) => e.preventDefault()}>
                  Delete record
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to delete the following record. This action cannot be undone.
                    <ScrollArea
                      style={{
                        maxHeight: 200,
                        display: "flex",
                        flexDirection: "column",
                        marginTop: "var(--sp-12)",
                        borderRadius: "var(--br-4)",
                      }}
                    >
                      <Text whitespace="pre" code block>
                        {JSON.stringify(row, null, 2)}
                      </Text>
                    </ScrollArea>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      ctx.table.resetRowSelection();
                      await removeDocument(row)();
                      toast.success(`Deleted record`);
                    }}
                    color="red"
                  >
                    Delete record
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuGroup>
        );
      }}
      // rowActions={({ row }) => {
      //   const actions = rowActions(row);

      //   return (
      //     <Actions>
      //       {actions.map(({ name, ...action }, i) => (
      //         <Action key={i} {...action}>
      //           {name}
      //         </Action>
      //       ))}

      //       {actions.length > 0 ? <ActionSeperator /> : null}

      //       <Action
      //         danger
      //         confirm={{
      //           title: "Are you sure?",
      //           description: (
      //             <>
      //               You are about to delete the following record. This action cannot be undone.
      //               <ScrollArea
      //                 style={{
      //                   maxHeight: 200,
      //                   display: "flex",
      //                   flexDirection: "column",
      //                   marginTop: "var(--sp-12)",
      //                   borderRadius: "var(--br-4)",
      //                 }}
      //               >
      //                 <Text whitespace="pre" code block>
      //                   {JSON.stringify(row, null, 2)}
      //                 </Text>
      //               </ScrollArea>
      //             </>
      //           ),
      //           action: {
      //             text: "Delete record",
      //             color: "red",
      //           },
      //         }}
      //         onAction={async () => {
      //           await removeDocument(row)();
      //           toast.success(`Deleted record`);
      //         }}
      //       >
      //         Delete record
      //       </Action>
      //     </Actions>
      //   );
      // }}
    />
  );
}
