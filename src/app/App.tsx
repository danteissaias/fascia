import './app.css';
import {
  Button,
  Checkbox,
  DataTable,
  IconButton,
  Stack,
  Text,
  toast,
} from '@danteissaias/ds';
import objectHash from 'object-hash';
import { useEffect, useState } from 'react';
import { RotateCw, Trash } from 'react-feather';
import { Buffer } from 'buffer';
import type { Config, DocumentAction, HeaderAction, Schema } from '../config';

interface AppProps {
  config: Config;
}

export default function App({ config }: AppProps) {
  return (
    <Stack align="center" mx="24" mt="40">
      {Object.entries(config.schemas).map(([key, schema], i) => (
        <ModelView key={key} modelName={key} schema={schema} />
      ))}
    </Stack>
  );
}

const deleteAction: DocumentAction<any> = ({ document, removeDocument }) => ({
  label: 'Delete record',
  icon: Trash,
  type: 'danger',
  onHandle: async () => {
    await removeDocument();
    toast.success(`Deleted record ${document.id}`);
  },
});

const batchDelete: HeaderAction<any> = ({ documents, removeDocuments }) => ({
  label:
    documents.length == 1
      ? `Delete 1 record`
      : `Delete ${documents.length} records`,
  type: 'danger',
  // Internal
  clearSelection: true,
  onHandle: async () => {
    await removeDocuments();
    toast.success(`Deleted ${documents.length} records`);
  },
});

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
    rpc(modelName, 'findMany', {}).then((data) => setData(data));
  }, [refetch]);

  const removeDocument = (document: T) => async () => {
    setRemovedIds((ids) => [...ids, getRowId(document)]);

    rpc(modelName, 'delete', {
      where: schema.where(document),
    }).then((res) => console.log(res));
  };

  const removeDocuments = (documents: T[]) => async () => {
    console.log(documents);
    setRemovedIds((ids) => [...ids, ...documents.map(getRowId)]);

    rpc(modelName, 'deleteMany', {
      where: { OR: [...documents.map(schema.where)] },
    }).then((res) => console.log(res));
  };

  return (
    <Stack gap="12" style={{ maxWidth: 1000, width: '100%' }}>
      <Text size="20" mb="12">
        {modelName}
      </Text>

      <DataTable
        fixed
        enableRowSelection
        columns={schema.columns}
        data={data.filter((d) => !removedIds.includes(getRowId(d)))}
        getRowId={getRowId}
        headerActions={(documents) =>
          [batchDelete].map((action) =>
            action({
              documents,
              removeDocuments: removeDocuments(documents),
              toast,
            })
          )
        }
        rowActions={(document) =>
          schema.rowActions.concat([deleteAction]).map((action) =>
            action({
              document,
              removeDocument: removeDocument(document),
              toast,
            })
          )
        }
      >
        <IconButton
          size="1"
          onClick={() => {
            setData([]);
            setRefetch((r) => r + 1);
          }}
        >
          <RotateCw />
        </IconButton>
        <Button size="1">Add record</Button>
      </DataTable>
    </Stack>
  );
}
