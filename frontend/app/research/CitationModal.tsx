"use client";

import React, { useState } from "react";
import { Copy, Download, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
}

export function CitationModal({ isOpen, onClose, count }: CitationModalProps) {
  const [format, setFormat] = useState("apa");
  const [copied, setCopied] = useState(false);

  const formats = [
    { id: "apa", label: "APA 7" },
    { id: "mla", label: "MLA 9" },
    { id: "chicago", label: "Chicago" },
    { id: "harvard", label: "Harvard" },
    { id: "bibtex", label: "BibTeX" },
  ];

  // Mock Preview Text
  const getPreview = () => {
    switch (format) {
      case "apa":
        return "Smith, J. (2024). Analysis of AI in Research. Journal of Future Science, 12(3), 45-67.";
      case "mla":
        return 'Smith, John. "Analysis of AI in Research." Journal of Future Science 12.3 (2024): 45-67.';
      case "bibtex":
        return `@article{smith2024,\n  title={Analysis of AI in Research},\n  author={Smith, J.},\n  journal={Journal of Future Science},\n  year={2024}\n}`;
      default:
        return "Smith, J. (2024). Analysis of AI in Research.";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPreview());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-900">
              Export Citations
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Exporting {count} selected papers.
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-wrap gap-2">
            {formats.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setFormat(fmt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  format === fmt.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}>
                {fmt.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 font-mono text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
            {getPreview()}
            <div className="mt-2 text-gray-400 italic text-[10px] border-t border-gray-200 pt-2">
              + {count - 1} more citations...
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCopy} className="text-xs">
            {copied ? (
              <Check className="w-3 h-3 mr-2" />
            ) : (
              <Copy className="w-3 h-3 mr-2" />
            )}
            {copied ? "Copied" : "Copy to Clipboard"}
          </Button>
          <Button
            onClick={onClose}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-3 h-3 mr-2" />
            Download File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
