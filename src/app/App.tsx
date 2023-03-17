import { DataTable, Stack, Text, toast } from '@danteissaias/ds';
import { useEffect, useState } from 'react';
import { Trash } from 'react-feather';
import type { Config, DocumentAction, Schema } from '../config';

interface AppProps {
  config: Config;
}

export default function App({ config }: AppProps) {
  return (
    <Stack m="24">
      {Object.entries(config.schemas).map(([key, schema], i) => (
        <ModelView key={key} modelName={key} schema={schema} />
      ))}
    </Stack>
  );
}

const deleteAction: DocumentAction<any> = ({ document, removeDocument }) => ({
  label: 'Delete record',
  icon: Trash,
  danger: true,
  onHandle: async () => {
    await removeDocument();
    toast.success(`Deleted record ${document.id}`);
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
  const [data, setData] = useState<T[]>();

  useEffect(() => {
    rpc(modelName, 'findMany', {}).then((data) => setData(data));
  }, []);

  const removeDocument = (document: T) => async () => {
    if (!data) return;

    const index = data.indexOf(document);
    setData(data.slice(0, index).concat(data.slice(index + 1)));

    rpc(modelName, 'delete', {
      where: schema.where(document),
    }).then((res) => console.log(res));
  };

  return data ? (
    <Stack m="24" gap="12" style={{ maxWidth: 800 }}>
      <Text size="20" mb="16">
        {modelName}
      </Text>

      <DataTable
        selectable
        columns={schema.columns}
        data={data}
        rowActions={(document) =>
          schema.actions
            .concat([deleteAction])
            .map((action) =>
              action({ document, removeDocument: removeDocument(document) })
            )
        }
      />
    </Stack>
  ) : (
    <Stack m="24">
      <Stack style={{ maxWidth: 800 }}>
        <Text size="20" mb="16">
          {modelName}
        </Text>
      </Stack>
    </Stack>
  );
}
