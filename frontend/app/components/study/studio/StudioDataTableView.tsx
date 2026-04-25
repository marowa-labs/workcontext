import React, { useState, useRef } from "react";
import {
  ChevronRight,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Search,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  Filter,
  Trash2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { StudioItem } from "./types";

interface StudioDataTableViewProps {
  item: StudioItem;
  onBack: () => void;
  onDelete?: (id: string) => void;
  onToggleFullscreen?: (item: StudioItem) => void;
  isFullscreen?: boolean;
}

interface DataTable {
  title?: string;
  description?: string;
  columns: string[];
  rows: string[][];
}

export function StudioDataTableView({
  item,
  onBack,
  onDelete,
  onToggleFullscreen,
  isFullscreen,
}: StudioDataTableViewProps) {
  const [tableData, setTableData] = useState<DataTable>(() => {
    try {
      return typeof item.content === "string"
        ? JSON.parse(item.content)
        : item.content;
    } catch {
      return { columns: [], rows: [] };
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const tableRef = useRef<HTMLDivElement>(null);

  // Filtered and sorted data
  const filteredRows = tableData.rows.filter((row) =>
    row.some((cell) => cell.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const sortedRows =
    sortColumn !== null
      ? [...filteredRows].sort((a, b) => {
          const aVal = a[sortColumn] || "";
          const bVal = b[sortColumn] || "";
          const comparison = aVal.localeCompare(bVal);
          return sortDirection === "asc" ? comparison : -comparison;
        })
      : filteredRows;

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnIndex);
      setSortDirection("asc");
    }
  };

  const handleExportPNG = async () => {
    if (!tableRef.current) return;

    try {
      // Dynamic import to avoid build issues
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
      });

      const link = document.createElement("a");
      link.download = `${tableData.title || "data-table"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error exporting PNG:", error);
      alert("Failed to export as PNG. Please try again.");
    }
  };

  const handleExportExcel = async () => {
    try {
      // Dynamic import
      const XLSX = await import("xlsx");

      // Prepare data with title and description if available
      const wsData: any[][] = [];

      if (tableData.title) {
        wsData.push([tableData.title]);
        wsData.push([]); // Empty row
      }

      if (tableData.description) {
        wsData.push([tableData.description]);
        wsData.push([]); // Empty row
      }

      // Add headers and rows
      wsData.push(tableData.columns);
      wsData.push(...tableData.rows);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");

      // Generate file
      XLSX.writeFile(wb, `${tableData.title || "data-table"}.xlsx`);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Failed to export as Excel. Please try again.");
    }
  };

  if (tableData.columns.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>
            Studio
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">Data Table</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No data table available
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-white ${isFullscreen ? "h-full" : "h-full"} animate-in slide-in-from-right-4 duration-200`}>
      {/* Breadcrumbs */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span
          className="cursor-pointer hover:text-gray-600 transition-colors"
          onClick={onBack}>
          Studio
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 truncate max-w-[140px]">Data Table</span>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">
              {sortedRows.length} rows
            </span>
            {searchTerm && (
              <span className="text-xs text-gray-500">
                (filtered from {tableData.rows.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleExportPNG}>
              <ImageIcon className="w-3.5 h-3.5" />
              PNG
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleExportExcel}>
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => onDelete?.(item.id)}
              title="Delete Table">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400"
              onClick={() => onToggleFullscreen?.(item)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        <div ref={tableRef} className="bg-white">
          {/* Title and Description */}
          {(tableData.title || tableData.description) && (
            <div className="mb-6">
              {tableData.title && (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {tableData.title}
                </h1>
              )}
              {tableData.description && (
                <p className="text-sm text-gray-600">{tableData.description}</p>
              )}
            </div>
          )}

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    {tableData.columns.map((column, idx) => (
                      <th
                        key={idx}
                        onClick={() => handleSort(idx)}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors group">
                        <div className="flex items-center gap-2">
                          <span>{column}</span>
                          <ArrowUpDown
                            className={`w-3.5 h-3.5 transition-opacity ${
                              sortColumn === idx
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-50"
                            }`}
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={tableData.columns.length}
                        className="px-4 py-8 text-center text-gray-500">
                        No matching rows found
                      </td>
                    </tr>
                  ) : (
                    sortedRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing {sortedRows.length} of {tableData.rows.length} rows
            </div>
            <div>{tableData.columns.length} columns</div>
          </div>
        </div>
      </div>
    </div>
  );
}
