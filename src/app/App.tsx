import { Button, DataTable, toast } from '@danteissaias/ds';
import { useEffect, useState } from 'react';
import type { Config } from '../config';

interface AppProps {
  config: Config;
}

export default function App({ config }: AppProps) {
  const [data, setData] = useState<Record<string, any[]>>();

  useEffect(() => {
    fetch('/api')
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);

  return data ? (
    <main className="p-24">
      {Object.entries(config.schemas).map(([key, schema], i) => (
        <div key={i} style={{ maxWidth: 800 }}>
          <h3>{schema.name}</h3>
          <DataTable
            columns={schema.columns}
            data={data[key]}
            rowActions={(document) =>
              schema.actions.map((action) => action({ document }))
            }
          />
        </div>
      ))}
    </main>
  ) : (
    <main>Loading...</main>
  );
}
