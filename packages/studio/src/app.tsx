import "./app.css";

import { Button, ScrollArea, Select, SelectItem, Stack, Text, toast } from "@danteissaias/ds";
import objectHash from "object-hash";
import { useEffect, useState } from "react";

import type { Config, Schema } from "./config";
import { Action, Actions, ActionSeperator, DataView } from "./table";

interface StudioProps {
  config: Config;
  getBearerToken?: () => Promise<string>;
}

export function Studio({ config, getBearerToken }: StudioProps) {
  const keys = Object.keys(config.schemas);
  const [active, setActive] = useState<keyof typeof config.schemas>(keys[0]);
  const schema = config.schemas[active];

  return (
    <Stack align="center" mx="24" mt="40" gap="56">
      <Stack gap="12" style={{ maxWidth: 1000, width: "100%" }}>
        <Stack direction="row" justify="between" align="center">
          <Select value={active} onValueChange={setActive}>
            {keys.map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </Select>

          {/* <Button size="1">Add record</Button> */}
        </Stack>

        <ModelView modelName={active} schema={schema} />
      </Stack>
    </Stack>
  );
}

const rpc = async (modelName: string, operation: string, args: any, getBearerToken?: () => Promise<string>) => {
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
  getBearerToken?: () => Promise<string>;
}

function ModelView<T>({ modelName, schema, getBearerToken }: ModelViewProps<T>) {
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
    <DataView
      columns={schema.columns}
      data={data.filter((d) => !removedIds.includes(getRowId(d)))}
      getRowId={getRowId}
      headerActions={({ rows, table, count }) => (
        <Actions>
          <Action
            danger
            disabled={count < 1}
            confirm={{
              title: "Are you sure?",
              description: (
                <>
                  You are about to delete the following {count > 1 ? `${count} records` : "record"}. This action cannot
                  be undone.
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
                </>
              ),
              action: {
                text: count > 1 ? `Delete ${count} records` : "Delete record",
                color: "red",
              },
            }}
            onAction={async () => {
              table.resetRowSelection();
              await removeDocuments(rows)();
              toast.success(`Deleted ${count} records`);
            }}
          >
            Delete records ({count})
          </Action>
        </Actions>
      )}
      rowActions={({ row }) => {
        const actions = rowActions(row);

        return (
          <Actions>
            {actions.map(({ name, ...action }, i) => (
              <Action key={i} {...action}>
                {name}
              </Action>
            ))}

            {actions.length > 0 ? <ActionSeperator /> : null}

            <Action
              danger
              confirm={{
                title: "Are you sure?",
                description: (
                  <>
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
                  </>
                ),
                action: {
                  text: "Delete record",
                  color: "red",
                },
              }}
              onAction={async () => {
                await removeDocument(row)();
                toast.success(`Deleted record`);
              }}
            >
              Delete record
            </Action>
          </Actions>
        );
      }}
    />
  );
}
