"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const KeyboardShortcutsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="bg-white dark:bg-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-black text-black">
            Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-black dark:text-black">
            This document provides a comprehensive list of keyboard shortcuts
            available in the ScholarForge AIeditor to help you work more
            efficiently.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black text-black">
              Text Formatting
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-white">
                  <TableHead className="w-1/2 text-black text-black font-bold">
                    Shortcut
                  </TableHead>
                  <TableHead className="text-black text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+B (Mac) / Ctrl+B (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle bold formatting
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+I (Mac) / Ctrl+I (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle italic formatting
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+U (Mac) / Ctrl+U (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle underline formatting
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+X (Mac) / Ctrl+Shift+X (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle strikethrough formatting
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+2 (Mac) / Ctrl+Shift+2 (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle superscript formatting
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+S (Mac) / Ctrl+Shift+S (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle subscript formatting
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black text-black">
              Headings
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-white">
                  <TableHead className="w-1/2 text-black text-black font-bold">
                    Shortcut
                  </TableHead>
                  <TableHead className="text-black text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+1 (Mac) / Ctrl+1 (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Apply Heading 1
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+2 (Mac) / Ctrl+2 (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Apply Heading 2
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+3 (Mac) / Ctrl+3 (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Apply Heading 3
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+Q (Mac) / Ctrl+Shift+Q (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle blockquote
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black text-black">
              Lists
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-white">
                  <TableHead className="w-1/2 text-black text-black font-bold">
                    Shortcut
                  </TableHead>
                  <TableHead className="text-black text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+2 (Mac) / Ctrl+Shift+2 (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Create two-column layout
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+3 (Mac) / Ctrl+Shift+3 (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Create three-column layout
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+L (Mac) / Ctrl+Shift+L (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle bullet list
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+O (Mac) / Ctrl+Shift+O (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle ordered/numbered list
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+C (Mac) / Ctrl+Shift+C (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Toggle checklist
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black text-black">
              Text Alignment
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-white">
                  <TableHead className="w-1/2 text-black text-black font-bold">
                    Shortcut
                  </TableHead>
                  <TableHead className="text-black text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+L (Mac) / Ctrl+Shift+L (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Align text left
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+E (Mac) / Ctrl+Shift+E (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Align text center
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Align text right
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+J (Mac) / Ctrl+Shift+J (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Justify text
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black text-black">
              Indentation
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-white">
                  <TableHead className="w-1/2 text-black text-black font-bold">
                    Shortcut
                  </TableHead>
                  <TableHead className="text-black text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+- (Mac) / Ctrl+Shift+- (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Decrease indent
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift++ (Mac) / Ctrl+Shift++ (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Increase indent
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black text-black">
              Insert Elements
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-white">
                  <TableHead className="w-1/2 text-black text-black font-bold">
                    Shortcut
                  </TableHead>
                  <TableHead className="text-black text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+K (Mac) / Ctrl+K (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Insert link
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+I (Mac) / Ctrl+Shift+I (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Insert image
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+G (Mac) / Ctrl+Shift+G (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Search online images
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+T (Mac) / Ctrl+Shift+T (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Insert table
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+C (Mac) / Ctrl+Shift+C (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Insert code block
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+H (Mac) / Ctrl+Shift+H (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Insert horizontal rule
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black text-black">
              Academic Features
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-white">
                  <TableHead className="w-1/2 text-black text-black font-bold">
                    Shortcut
                  </TableHead>
                  <TableHead className="text-black text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+A (Mac) / Ctrl+Shift+A (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Add citation
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+E (Mac) / Ctrl+Shift+E (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Edit citation
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Insert reference list
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+F (Mac) / Ctrl+Shift+F (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Add footnote
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-white">
                  <TableCell className="text-black dark:text-black">
                    Cmd+Shift+I (Mac) / Ctrl+Shift+I (Windows)
                  </TableCell>
                  <TableCell className="text-black dark:text-black">
                    Import document
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-black text-black">
              Note
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-black dark:text-black">
              <li>On Windows/Linux, replace "Cmd" with "Ctrl"</li>
              <li>Some shortcuts may vary depending on your keyboard layout</li>
              <li>
                All shortcuts work in the main editor area when it's focused
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyboardShortcutsPage;
