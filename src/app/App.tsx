import { Button, toast } from '@danteissaias/ds';
import type { Config } from '../config';

interface AppProps {
  config: Config;
}

export default function App(props: AppProps) {
  console.log(props);

  return (
    <main>
      <Button onClick={() => toast.success('This is a success toast.')}>
        Toast
      </Button>
    </main>
  );
}
