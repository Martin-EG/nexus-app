

const Table = ({ columns, data }: { columns: string[]; data: any[] }) => {
  return (
    <table className="w-full table-auto border-collapse border border-zinc-200">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col}
              scope="col"
              className="border border-zinc-200 bg-zinc-100 px-4 py-2 text-left text-sm font-medium text-zinc-700"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="even:bg-zinc-50">
            {columns.map((col) => (
              <td
                key={col}
                className="border border-zinc-200 px-4 py-2 text-sm text-zinc-900"
              >
                {row[col] ?? '-'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;