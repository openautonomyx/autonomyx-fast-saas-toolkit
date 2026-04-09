/*
 * IBM Carbon DataTable — minimal hand-built variant.
 * Carbon specs: https://carbondesignsystem.com/components/data-table/usage/
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: "name", header: "Name" },
 *       { key: "plan", header: "Plan", render: (row) => <Badge>{row.plan}</Badge> },
 *     ]}
 *     rows={tenants}
 *     onRowClick={(row) => router.push(`/tenants/${row.id}`)}
 *   />
 */
import Link from "next/link";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface Props<T extends { id: string | number }> {
  columns: Column<T>[];
  rows: T[];
  rowHref?: (row: T) => string;
  title?: string;
  description?: string;
  toolbarActions?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  rowHref,
  title,
  description,
  toolbarActions,
  emptyMessage = "No data",
}: Props<T>) {
  return (
    <div className="bg-white border border-[#e0e0e0]">
      {(title || toolbarActions) && (
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#e0e0e0]">
          <div>
            {title && (
              <h2 className="type-heading-03 text-[#161616]">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-[#6f6f6f]">{description}</p>
            )}
          </div>
          {toolbarActions && (
            <div className="flex items-center gap-2">{toolbarActions}</div>
          )}
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#e0e0e0]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 h-12 text-xs font-semibold text-[#161616] border-b border-[#c6c6c6]"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center px-4 py-16 text-sm text-[#6f6f6f]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <DataRow
                key={row.id}
                row={row}
                columns={columns}
                href={rowHref?.(row)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function DataRow<T extends { id: string | number }>({
  row,
  columns,
  href,
}: {
  row: T;
  columns: Column<T>[];
  href?: string;
}) {
  const cells = columns.map((col) => (
    <td
      key={col.key}
      className="px-4 h-12 text-sm text-[#393939] border-b border-[#e0e0e0]"
    >
      {col.render ? col.render(row) : String((row as any)[col.key] ?? "")}
    </td>
  ));

  if (href) {
    return (
      <tr className="hover:bg-[#e8e8e8] transition-colors cursor-pointer group">
        {cells.map((cell, i) => (
          <td
            key={i}
            className="p-0 border-b border-[#e0e0e0]"
          >
            <Link href={href} className="block px-4 h-12 flex items-center text-sm text-[#393939]">
              {columns[i].render ? columns[i].render!(row) : String((row as any)[columns[i].key] ?? "")}
            </Link>
          </td>
        ))}
      </tr>
    );
  }

  return <tr className="hover:bg-[#e8e8e8] transition-colors">{cells}</tr>;
}
