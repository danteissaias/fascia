import {
  Badge,
  Checkbox,
  Confirm,
  ConfirmAction,
  ConfirmCancel,
  ConfirmContent,
  ConfirmDescription,
  ConfirmFooter,
  ConfirmHeader,
  ConfirmTitle,
  ConfirmTrigger,
  Menu,
  MenuContent,
  MenuIconButton,
  MenuItem,
  MenuItemGroup,
  MenuItemProps,
  MenuSeparator,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@danteissaias/ds';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Table as ReactTable,
  useReactTable,
} from '@tanstack/react-table';
import { createContext, useContext, useMemo, useState } from 'react';
import { MoreHorizontal } from 'react-feather';

export interface ActionProps
  extends Pick<MenuItemProps, 'type' | 'disabled' | 'children'> {
  onAction: () => void | Promise<void>;
  confirm?: {
    title: string;
    description: JSX.Element | string;
    action: {
      text: string;
      type?: 'default' | 'danger';
    };
  };
}

interface ActionContext {
  onConfirmOpenChange: (isOpen: boolean) => void;
}

const ActionContext = createContext<ActionContext>({
  onConfirmOpenChange: () => {},
});

export const Action = ({ onAction, confirm, ...props }: ActionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { onConfirmOpenChange } = useContext(ActionContext);

  if (!confirm || props.disabled)
    return <MenuItem onSelect={onAction} {...props} />;

  return (
    <Confirm
      open={isOpen}
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen);
        onConfirmOpenChange(isOpen);
      }}
    >
      <ConfirmTrigger asChild>
        <MenuItem onSelect={(e) => e.preventDefault()} {...props} />
      </ConfirmTrigger>
      <ConfirmContent>
        <ConfirmHeader>
          <ConfirmTitle>{confirm.title}</ConfirmTitle>
          <ConfirmDescription>{confirm.description}</ConfirmDescription>
        </ConfirmHeader>
        <ConfirmFooter>
          <ConfirmCancel>Cancel</ConfirmCancel>
          <ConfirmAction onClick={onAction} type={confirm.action.type}>
            {confirm.action.text}
          </ConfirmAction>
        </ConfirmFooter>
      </ConfirmContent>
    </Confirm>
  );
};

export const ActionSeperator = MenuSeparator;
export const Actions = MenuItemGroup;

export interface DataViewProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  rowActions: (data: { row: T; table: ReactTable<T> }) => JSX.Element;
  headerActions: (data: {
    rows: T[];
    count: number;
    table: ReactTable<T>;
  }) => JSX.Element;
  getRowId?: (row: T) => string;
}

export function DataView<T>({
  data,
  columns: defaultColumns,
  headerActions,
  rowActions,
  getRowId,
}: DataViewProps<T>) {
  const columns = useMemo(
    () => [
      {
        id: 'selection',
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomeRowsSelected()
                  ? 'indeterminate'
                  : table.getIsAllRowsSelected()
              }
              onCheckedChange={(checked) =>
                checked === 'indeterminate'
                  ? table.toggleAllRowsSelected(true)
                  : table.toggleAllRowsSelected(checked)
              }
            />
          );
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={
                row.getIsSomeSelected() ? 'indeterminate' : row.getIsSelected()
              }
              disabled={!row.getCanSelect()}
              onCheckedChange={(checked) =>
                checked === 'indeterminate'
                  ? row.toggleSelected(true)
                  : row.toggleSelected(checked)
              }
            />
          );
        },
      },
      ...defaultColumns,
      {
        id: 'actions',
        header: ({ table }) => {
          const rows = table
            .getSelectedRowModel()
            .flatRows.map((row) => row.original);

          const [hideMenu, setHideMenu] = useState(false);

          return (
            <Stack align="center" direction="row">
              {rows.length > 0 ? (
                <Badge
                  style={{
                    position: 'absolute',
                    left: -18,
                    background: 'var(--gray-7)',
                    width: 22,
                    height: 21,
                    lineHeight: '21px',
                    color: 'var(--gray-12)',
                    textAlign: 'center',
                    borderRadius: 'var(--br-6)',
                    boxShadow: 'inset 0 0 0 1px var(--gray-a8)',
                  }}
                >
                  {rows.length}
                </Badge>
              ) : null}
              <Menu>
                <MenuIconButton
                  style={{ float: 'right' }}
                  variant="ghost"
                  size="1"
                >
                  <MoreHorizontal />
                </MenuIconButton>

                <MenuContent hidden={hideMenu} style={{ minWidth: 220 }}>
                  <ActionContext.Provider
                    value={{ onConfirmOpenChange: setHideMenu }}
                  >
                    {headerActions({
                      table,
                      rows,
                      count: rows.length,
                    })}
                  </ActionContext.Provider>
                </MenuContent>
              </Menu>
            </Stack>
          );
        },
        cell: ({ row }) => {
          const [hideMenu, setHideMenu] = useState(false);

          return (
            <Menu>
              <MenuIconButton
                style={{ float: 'right' }}
                variant="ghost"
                size="1"
              >
                <MoreHorizontal />
              </MenuIconButton>

              <MenuContent hidden={hideMenu} style={{ minWidth: 220 }}>
                <ActionContext.Provider
                  value={{ onConfirmOpenChange: setHideMenu }}
                >
                  {rowActions({ row: row.original, table })}
                </ActionContext.Provider>
              </MenuContent>
            </Menu>
          );
        },
      },
    ],
    [defaultColumns, headerActions, rowActions]
  );

  const table = useReactTable({
    data,
    columns,
    getRowId,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table className="DataView">
      <TableHead>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableCell key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>

      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
