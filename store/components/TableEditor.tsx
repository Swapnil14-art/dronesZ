import React, { useState, useEffect } from 'react';

export interface TableData {
  headers: string[];
  rows: string[][];
}

interface Props {
  value: string; // JSON string
  onChange: (value: string) => void;
}

const DEFAULT_TABLE: TableData = {
  headers: ['Parameter / Feature', 'Specification / Value', 'Notes'],
  rows: [
    ['Stator Diameter', '22 mm', 'Standard dimension'],
    ['Stator Height', '7 mm', 'Precision wound core'],
    ['KV Rating', '1850 KV', 'Optimized for 6S LiPo']
  ]
};

export const TableEditor: React.FC<Props> = ({ value, onChange }) => {
  const [tableData, setTableData] = useState<TableData>(() => {
    try {
      if (value && value.trim()) {
        const parsed = JSON.parse(value);
        if (parsed.headers && Array.isArray(parsed.headers) && parsed.rows && Array.isArray(parsed.rows)) {
          return parsed;
        }
      }
    } catch (e) {
      // Fallback to default
    }
    return DEFAULT_TABLE;
  });

  useEffect(() => {
    try {
      if (value && value.trim()) {
        const parsed = JSON.parse(value);
        if (parsed.headers && Array.isArray(parsed.headers) && parsed.rows && Array.isArray(parsed.rows)) {
          if (JSON.stringify(parsed) !== JSON.stringify(tableData)) {
            setTableData(parsed);
          }
          return;
        }
      }
    } catch (e) {
      // ignore
    }
  }, [value]);

  const updateTable = (newData: TableData) => {
    setTableData(newData);
    onChange(JSON.stringify(newData));
  };

  const handleHeaderChange = (colIndex: number, val: string) => {
    const newHeaders = [...tableData.headers];
    newHeaders[colIndex] = val;
    updateTable({ ...tableData, headers: newHeaders });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = tableData.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      const newRow = [...row];
      newRow[colIndex] = val;
      return newRow;
    });
    updateTable({ ...tableData, rows: newRows });
  };

  const addRow = () => {
    const emptyRow = new Array(tableData.headers.length).fill('');
    updateTable({ ...tableData, rows: [...tableData.rows, emptyRow] });
  };

  const removeRow = (rowIndex: number) => {
    if (tableData.rows.length <= 1) return;
    const newRows = tableData.rows.filter((_, idx) => idx !== rowIndex);
    updateTable({ ...tableData, rows: newRows });
  };

  const addColumn = () => {
    const colNum = tableData.headers.length + 1;
    const newHeaders = [...tableData.headers, `Column ${colNum}`];
    const newRows = tableData.rows.map((row) => [...row, '']);
    updateTable({ headers: newHeaders, rows: newRows });
  };

  const removeColumn = (colIndex: number) => {
    if (tableData.headers.length <= 1) return;
    const newHeaders = tableData.headers.filter((_, idx) => idx !== colIndex);
    const newRows = tableData.rows.map((row) => row.filter((_, idx) => idx !== colIndex));
    updateTable({ headers: newHeaders, rows: newRows });
  };

  return (
    <div style={{
      border: '1px solid var(--color-outline, #cbd5e1)',
      borderRadius: '0.5rem',
      background: '#ffffff',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Table Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#f1f5f9',
        borderBottom: '1px solid var(--color-outline, #e2e8f0)',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e', background: '#ccfbf1', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
            EXCEL TABLE MATRIX
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {tableData.rows.length} rows × {tableData.headers.length} columns
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={addRow}
            style={actionBtnStyle}
          >
            + Add Row
          </button>
          <button
            type="button"
            onClick={addColumn}
            style={actionBtnStyle}
          >
            + Add Column
          </button>
        </div>
      </div>

      {/* Interactive Table Grid */}
      <div style={{ overflowX: 'auto', maxHeight: '320px', padding: '4px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
        }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ width: '36px', padding: '6px 8px', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '11px', textAlign: 'center' }}>
                #
              </th>
              {tableData.headers.map((header, colIdx) => (
                <th key={colIdx} style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'left', minWidth: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                      placeholder={`Header ${colIdx + 1}`}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: '#0f172a',
                        background: '#ffffff',
                      }}
                    />
                    {tableData.headers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(colIdx)}
                        title="Delete Column"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontWeight: 700,
                          padding: '2px 4px',
                          fontSize: '14px',
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th style={{ width: '40px', padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                Del
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? '#ffffff' : '#fcfdfd' }}>
                <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                  {rowIdx + 1}
                </td>
                {row.map((cell, colIdx) => (
                  <td key={colIdx} style={{ padding: '4px 6px', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                      placeholder="Cell value..."
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        border: '1px solid transparent',
                        borderRadius: '3px',
                        fontSize: '13px',
                        color: '#334155',
                        background: 'transparent',
                        outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.background = '#ffffff';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'transparent';
                        e.target.style.background = 'transparent';
                      }}
                    />
                  </td>
                ))}
                <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  {tableData.rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(rowIdx)}
                      title="Delete Row"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '14px',
                        padding: '2px 6px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
  color: '#0f172a',
  display: 'inline-flex',
  alignItems: 'center',
};
