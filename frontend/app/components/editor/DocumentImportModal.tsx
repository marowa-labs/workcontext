"use client";

import React, { useState, useRef } from "react";
import { X, FileText, Loader2, CheckCircle, HardDrive } from "lucide-react";
import { importDocument } from "../../lib/utils/editorService";
import offlineService from "../../lib/utils/offlineService";

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: any) => void;
}

const DocumentImportModal: React.FC<DocumentImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Validate file type
    const validTypes = [
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
    ];

    if (!validTypes.includes(file.type)) {
      setError(
        "Unsupported file type. Please upload a TXT, DOC, DOCX, or PDF file.",
      );
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setFile(file);
    setError(null);
    setIsImported(false);
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      // For all file types, we'll send them as base64 to the backend for proper processing
      const content = await readFileAsBase64(file);
      const wordCount = 0; // Will be calculated on the backend

      // Prepare file data for import
      const fileData = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension from filename
        content: content,
        fileType: file.type,
        fileName: file.name, // Include the original file name
        wordCount: wordCount,
      };

      // Check online status
      const isOnline = navigator.onLine;

      if (isOnline) {
        // Online: Import document through proper API endpoint
        const importedProject = await importDocument(fileData);

        // Notify parent component of successful import
        onImport(importedProject); // Pass the entire imported project to editor
      } else {
        // Offline: Save to offline storage
        await offlineService.createOfflineChange(
          "document_import",
          "temp-project-id",
          "import",
          fileData,
        );

        // Notify parent component of successful import (offline)
        onImport({ content: content }); // Pass base64 content to editor for now
      }

      // Show success state
      setIsImported(true);

      // Close modal and reset state after a delay
      setTimeout(() => {
        onClose();
        setFile(null);
        setIsImported(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error importing document:", err);
      setError(err.message || "Failed to import document. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
          const base64Content = content.split(",")[1] || content;
          resolve(base64Content);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      // Read as data URL for binary files
      reader.readAsDataURL(file);
    });
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Import Document</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-black hover:bg-cw-light-gray hover:text-black">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols- gap-3 mb-4">
            <button
              type="button"
              onClick={triggerFileSelect}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <HardDrive className="h-8 w-8 text-black mb-2" />
              <span className="text-sm font-medium text-black">Local File</span>
            </button>
          </div>

          {file && (
            <div className="mb-4 flex items-center justify-between rounded-md bg-cw-light-gray p-3">
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-black" />
                <div>
                  <p className="text-sm font-medium text-black">{file.name}</p>
                  <p className="text-xs text-black">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-black hover:text-black">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {isImported && (
            <div className="mb-4 rounded-md bg-green-50 p-3">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-400" />
                <p className="text-sm text-green-700">
                  Document imported successfully!
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-black hover:bg-cw-light-gray">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || isImporting}
              className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Document"
              )}
            </button>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.doc,.docx,.pdf"
        className="hidden"
      />
    </>
  );
};

export default DocumentImportModal;
