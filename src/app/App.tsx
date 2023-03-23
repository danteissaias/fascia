import './app.css';

import { Button, Code, ScrollArea, Stack, Text, toast } from '@danteissaias/ds';
import objectHash from 'object-hash';
import { useEffect, useState } from 'react';

import type { Config, Schema } from '../config';
import { Action, Actions, ActionSeperator, DataView } from './components';

interface AppProps {
  config: Config;
}

export default function App({ config }: AppProps) {
  return (
    <Stack align="center" mx="24" mt="40" gap="56">
      {Object.entries(config.schemas).map(([key, schema], i) => (
        <ModelView key={key} modelName={key} schema={schema} />
      ))}
    </Stack>
  );
}

const rpc = async (modelName: string, operation: string, args: any) => {
  return await fetch('/rpc', {
    method: 'POST',
    body: JSON.stringify({ modelName, operation, args }),
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => res.json());
};

interface ModelViewProps<T> {
  modelName: string;
  schema: Schema<T>;
}

function ModelView<T>({ modelName, schema }: ModelViewProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [refetch, setRefetch] = useState(0);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const getRowId = (row: T) => objectHash(schema.where(row));

  useEffect(() => {
    const { include } = schema;
    rpc(modelName, 'findMany', { include }).then((data) => setData(data));
  }, [refetch]);

  const removeDocument = (document: T) => async () => {
    setRemovedIds((ids) => [...ids, getRowId(document)]);

    rpc(modelName, 'delete', {
      where: schema.where(document),
    }).then((res) => console.log(res));
  };

  const removeDocuments = (documents: T[]) => async () => {
    setRemovedIds((ids) => [...ids, ...documents.map(getRowId)]);

    rpc(modelName, 'deleteMany', {
      where: { OR: [...documents.map(schema.where)] },
    }).then((res) => console.log(res));
  };

  const rowActions = (document: T) =>
    (schema.rowActions
      ? typeof schema.rowActions === 'function'
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
    <Stack gap="12" style={{ maxWidth: 1000, width: '100%' }}>
      <Stack direction="row" justify="between">
        <Text size="16" mb="12" weight="700">
          {modelName}
        </Text>

        <Button size="1">Add record</Button>
      </Stack>

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
                title: 'Are you sure?',
                description: (
                  <>
                    You are about to delete the following{' '}
                    {count > 1 ? `${count} records` : 'record'}. This action
                    cannot be undone.
                    <ScrollArea
                      style={{
                        maxHeight: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: 'var(--sp-12)',
                        borderRadius: 'var(--br-4)',
                      }}
                    >
                      <Code pre highlighted>
                        {JSON.stringify(rows, null, 2)}
                      </Code>
                    </ScrollArea>
                  </>
                ),
                action: {
                  text: count > 1 ? `Delete ${count} records` : 'Delete record',
                  color: 'red',
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
                  title: 'Are you sure?',
                  description: (
                    <>
                      You are about to delete the following record. This action
                      cannot be undone.
                      <ScrollArea
                        style={{
                          maxHeight: 200,
                          display: 'flex',
                          flexDirection: 'column',
                          marginTop: 'var(--sp-12)',
                          borderRadius: 'var(--br-4)',
                        }}
                      >
                        <Code pre highlighted>
                          {JSON.stringify(row, null, 2)}
                        </Code>
                      </ScrollArea>
                    </>
                  ),
                  action: {
                    text: 'Delete record',
                    color: 'red',
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
    </Stack>
  );
}
