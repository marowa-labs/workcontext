"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link,
  ImageIcon,
  Columns,
  Layout,
  ChevronDown,
  Undo,
  Footprints,
  BookOpen,
  Edit3,
  FileText,
  Redo,
  Type,
  Table as TableIcon,
  Trash2,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Eraser,
  Sigma,
  MessageSquare,
  Search,
  Omega,
  Merge,
  Split,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import AIService from "../../lib/utils/aiService";

const EQUATIONS = [
  {
    category: "Built-In",
    items: [
      {
        name: "Area of Circle",
        latex: "A = \\pi r^2",
      },
      {
        name: "Binomial Theorem",
        latex: "(x+a)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^k a^{n-k}",
      },
      {
        name: "Expansion of a Sum",
        latex: "(1+x)^n = 1 + \\frac{nx}{1!} + \\frac{n(n-1)x^2}{2!} + \\dots",
      },
      {
        name: "Fourier Series",
        latex:
          "f(x) = a_0 + \\sum_{n=1}^{\\infty} \\left( a_n \\cos \\frac{n\\pi x}{L} + b_n \\sin \\frac{n\\pi x}{L} \\right)",
      },
      {
        name: "Pythagorean Theorem",
        latex: "a^2 + b^2 = c^2",
      },
      {
        name: "Quadratic Formula",
        latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      },
    ],
  },
  {
    category: "Common Formulas",
    items: [
      {
        name: "Accelerated Motion",
        latex:
          "\\mathbf{r} = \\frac{1}{2}\\mathbf{a}t^2 + \\mathbf{v}_0t + \\mathbf{r}_0",
      },
      {
        name: "Compound Interest",
        latex: "A = P\\left(1 + \\frac{r}{n}\\right)^{nt}",
      },
      {
        name: "Gaussian Integral",
        latex: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
      },
      {
        name: "Euler's Identity",
        latex: "e^{i\\pi} + 1 = 0",
      },
    ],
  },
  {
    category: "Trigonometry",
    items: [
      {
        name: "Trig Identity 1",
        latex:
          "\\sin \\alpha \\pm \\sin \\beta = 2 \\sin \\frac{1}{2}(\\alpha \\pm \\beta) \\cos \\frac{1}{2}(\\alpha \\mp \\beta)",
      },
      {
        name: "Trig Identity 2",
        latex:
          "\\cos \\alpha + \\cos \\beta = 2 \\cos \\frac{1}{2}(\\alpha + \\beta) \\cos \\frac{1}{2}(\\alpha - \\beta)",
      },
    ],
  },
  {
    category: "Basic Math",
    items: [
      {
        name: "Absolute Value",
        latex:
          "|x| = \\begin{cases} -x, & x < 0 \\\\ x, & x \\geq 0 \\end{cases}",
      },
      {
        name: "Distributive Law",
        latex: "a(b+c) = ab + ac",
      },
      {
        name: "Fraction Addition",
        latex: "\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}",
      },
      {
        name: "Fraction Multiplication",
        latex: "\\frac{a}{b} \\times \\frac{c}{d} = \\frac{ac}{bd}",
      },
    ],
  },
];

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenImageModal?: () => void;
  onOpenCitationsModal?: () => void;
  onOpenPlagiarismModal?: () => void;
  onInsertCitation?: () => void;
  onEditCitation?: () => void;
  onInsertReferenceList?: () => void;
  onInsertFootnote?: () => void;
  onFindAndReplace?: () => void;
  userCanEdit?: boolean;
}

export function EditorToolbar({
  editor,
  onOpenImageModal,
  onInsertCitation,
  onEditCitation,
  onInsertReferenceList,
  onInsertFootnote,
  onFindAndReplace,
  userCanEdit = true,
}: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [isGeneratingEquation, setIsGeneratingEquation] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
    }
  };

  const addImage = () => {
    if (onOpenImageModal) {
      onOpenImageModal();
    } else {
      const url = window.prompt("Enter image URL");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  };

  const addMath = async () => {
    const input = window.prompt(
      "Enter equation description (e.g. 'Standard Deviation') or LaTeX code:",
    );
    if (!input) return;

    // Check if it's already pure LaTeX (rough check: contains ^, _, \, or no spaces)
    const isLatex =
      input.includes("\\") ||
      input.includes("^") ||
      input.includes("_") ||
      !input.includes(" ");

    if (isLatex) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "math", attrs: { latex: input } })
        .run();
      return;
    }

    // Otherwise, use AI to generate LaTeX
    setIsGeneratingEquation(true);
    try {
      const result = await AIService.processAIRequest(
        "generate",
        `Generate a LaTeX equation for: ${input}. 
         Provide ONLY the LaTeX code, no text or markdown wrappers like \`\`\`latex.`,
        null,
        { tone: "academic" },
      );

      // Clean up AI response (remove any $ or markdown)
      const cleanLatex = result.replace(/^(\$|`)+|(\$|`)+$/g, "").trim();

      if (cleanLatex) {
        editor
          .chain()
          .focus()
          .insertContent({ type: "math", attrs: { latex: cleanLatex } })
          .run();
      }
    } catch (error) {
      console.error("AI Equation Error:", error);
      alert(
        "Failed to generate equation with AI. Please try entering LaTeX directly.",
      );
    } finally {
      setIsGeneratingEquation(false);
    }
  };

  const headingLevels = [
    { level: 1, label: "Heading 1", size: "text-2xl" },
    { level: 2, label: "Heading 2", size: "text-xl" },
    { level: 3, label: "Heading 3", size: "text-lg" },
    { level: 4, label: "Heading 4", size: "text-base" },
  ] as const;

  const currentHeading = headingLevels.find((h) =>
    editor.isActive("heading", { level: h.level }),
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border border-gray-200 bg-white px-2 py-1.5 sticky top-0 z-10 shadow-sm">
      <Toggle
        size="sm"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo() || !userCanEdit}
        title="Undo">
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo() || !userCanEdit}
        title="Redo">
        <Redo className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Toggle size="sm" className="h-8 gap-1 px-2" title="Text Style">
            <Type className="h-4 w-4" />
            <span className="text-xs w-16 truncate text-left">
              {currentHeading?.label ?? "Normal"}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Toggle>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border border-gray-200">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            disabled={!userCanEdit}>
            <span className="text-sm">Paragraph</span>
          </DropdownMenuItem>
          {headingLevels.map((heading) => (
            <DropdownMenuItem
              key={heading.level}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: heading.level })
                  .run()
              }
              disabled={!userCanEdit}>
              <span className={heading.size}>{heading.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Formatting Group */}
      <div className="flex items-center gap-0.5">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          disabled={!userCanEdit}
          title="Bold (Cmd+B)">
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          disabled={!userCanEdit}
          title="Italic (Cmd+I)">
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!userCanEdit}
          title="Underline (Cmd+U)">
          <Underline className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          disabled={!userCanEdit}
          title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("subscript")}
          onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
          disabled={!userCanEdit}
          title="Subscript">
          <SubscriptIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("superscript")}
          onPressedChange={() =>
            editor.chain().focus().toggleSuperscript().run()
          }
          disabled={!userCanEdit}
          title="Superscript">
          <SuperscriptIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          disabled={!userCanEdit}
          title="Clear Formatting">
          <Eraser className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment & Lists */}
      <div className="flex items-center gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Toggle size="sm" className="h-8 w-8" title="Alignment">
              <AlignLeft className="h-4 w-4" />
            </Toggle>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setTextAlign("left").run()}>
              <AlignLeft className="h-4 w-4 mr-2" /> Left
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }>
              <AlignCenter className="h-4 w-4 mr-2" /> Center
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().setTextAlign("right").run()
              }>
              <AlignRight className="h-4 w-4 mr-2" /> Right
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }>
              <AlignJustify className="h-4 w-4 mr-2" /> Justify
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          disabled={!userCanEdit}
          title="Bullet List">
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          disabled={!userCanEdit}
          title="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Insert Group */}
      <div className="flex items-center gap-0.5">
        {/* Table Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Toggle
              size="sm"
              className="h-8 w-8"
              title="Table Controls"
              pressed={editor.isActive("table")}>
              <TableIcon className="h-4 w-4" />
            </Toggle>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border border-gray-200">
            <DropdownMenuItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }>
              <TableIcon className="h-4 w-4 mr-2" /> Insert Table (3x3)
            </DropdownMenuItem>

            <Separator className="my-1" />

            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Add Column Before
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}>
              <ArrowRight className="h-4 w-4 mr-2" /> Add Column After
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
              className="text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Column
            </DropdownMenuItem>

            <Separator className="my-1" />

            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}>
              <ArrowUp className="h-4 w-4 mr-2" /> Add Row Before
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}>
              <ArrowDown className="h-4 w-4 mr-2" /> Add Row After
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
              className="text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Row
            </DropdownMenuItem>

            <Separator className="my-1" />

            <DropdownMenuItem
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells()}>
              <Merge className="h-4 w-4 mr-2" /> Merge Cells
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!editor.can().splitCell()}>
              <Split className="h-4 w-4 mr-2" /> Split Cell
            </DropdownMenuItem>

            <Separator className="my-1" />

            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              className="text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={!userCanEdit}
          title="Code Block">
          <Code className="h-4 w-4" />
        </Toggle>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Toggle
              size="sm"
              className="h-8 w-8"
              disabled={!userCanEdit}
              title="Column Layout">
              <Columns className="h-4 w-4" />
            </Toggle>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-white border border-gray-200 p-1 shadow-xl">
            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-gray-100 mb-1">
              Layout Options
            </div>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().unsetColumns().run()}
              className="flex items-center gap-2 p-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer rounded-md">
              <Layout className="h-4 w-4" />
              <span>Normal Layout</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setColumns(2).run()}
              className="flex items-center gap-2 p-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer rounded-md">
              <div className="flex gap-0.5">
                <div className="w-2 h-4 border border-slate-400 rounded-sm"></div>
                <div className="w-2 h-4 border border-slate-400 rounded-sm"></div>
              </div>
              <span>2 Columns</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setColumns(3).run()}
              className="flex items-center gap-2 p-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer rounded-md">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-4 border border-slate-400 rounded-sm"></div>
                <div className="w-1.5 h-4 border border-slate-400 rounded-sm"></div>
                <div className="w-1.5 h-4 border border-slate-400 rounded-sm"></div>
              </div>
              <span>3 Columns</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          disabled={!userCanEdit}
          title="Quote">
          <Quote className="h-4 w-4" />
        </Toggle>

        <Popover>
          <PopoverTrigger asChild>
            <Toggle size="sm" pressed={editor.isActive("link")} title="Link">
              <Link className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="Enter URL..."
                className="bg-gray-200 border border-gray-200"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setLink()}
              />
              <Button
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={setLink}
                disabled={!userCanEdit}>
                Add
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Toggle
          size="sm"
          className="h-8 w-8"
          onClick={addImage}
          disabled={!userCanEdit}
          title="Insert Image">
          <ImageIcon className="h-4 w-4" />
        </Toggle>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Toggle
              size="sm"
              className="h-8 w-8"
              disabled={!userCanEdit || isGeneratingEquation}
              title="Insert Math Equation">
              {isGeneratingEquation ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Sigma className="h-4 w-4" />
              )}
            </Toggle>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-white border border-gray-200 p-0 shadow-xl overflow-hidden">
            <ScrollArea className="h-[450px]">
              <div className="flex flex-col">
                {EQUATIONS.map((category) => (
                  <div key={category.category}>
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-gray-100 bg-slate-50/50">
                      {category.category}
                    </div>
                    <div className="flex flex-col">
                      {category.items.map((eq) => (
                        <DropdownMenuItem
                          key={eq.name}
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .insertContent({
                                type: "math",
                                attrs: { latex: eq.latex },
                              })
                              .run()
                          }
                          className="flex flex-col items-start p-3 gap-1 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 rounded-none focus:bg-blue-50 outline-none">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {eq.name}
                          </span>
                          <div className="bg-white border border-gray-100 rounded p-2 w-full text-center font-serif text-sm italic py-4 text-slate-800 shadow-sm group-hover:bg-slate-50">
                            {eq.latex}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-1 border-t border-gray-100 bg-slate-50">
              <DropdownMenuItem
                onClick={addMath}
                className="flex items-center gap-2 p-2 text-sm text-slate-700 font-medium hover:bg-blue-100 cursor-pointer rounded-md">
                <Plus className="h-4 w-4" />
                <span>Insert New Equation...</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => alert("Ink Equation coming soon!")}
                className="flex items-center gap-2 p-2 text-sm text-slate-700 font-medium hover:bg-blue-100 cursor-pointer rounded-md">
                <Edit3 className="h-4 w-4" />
                <span>Ink Equation</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Tools Group */}
      <div className="flex items-center gap-0.5 ml-1">
        <Toggle size="sm" onClick={onFindAndReplace} title="Find & Replace">
          <Search className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          onClick={() => {
            const symbol = window.prompt(
              "Enter symbol to insert (e.g. α, β, →):",
            );
            if (symbol && editor)
              editor.chain().focus().insertContent(symbol).run();
          }}
          title="Insert Symbol"
          disabled={!userCanEdit}>
          <Omega className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          title="Page Break (Hard Break)"
          disabled={!userCanEdit}>
          <Minus className="h-4 w-4 rotate-90" />
        </Toggle>

        <Toggle
          size="sm"
          onClick={() => alert("Comment feature coming soon!")}
          title="Add Comment"
          disabled={!userCanEdit}>
          <MessageSquare className="h-4 w-4" />
        </Toggle>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 font-bold"
              title="Cortex AI Functions"
              disabled={!userCanEdit}>
              <Zap className="h-3.5 w-3.5 fill-violet-500" />
              <span className="text-xs">Tx</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border border-gray-200 w-48">
            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-gray-100 mb-1">
              Cortex Functions
            </div>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().run()}
              className="gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span>Smart Summarize</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().run()}
              className="gap-2">
              <Type className="h-4 w-4 text-violet-500" />
              <span>Academic Rewrite</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().run()}
              className="gap-2">
              <List className="h-4 w-4 text-violet-500" />
              <span>Extract Key Points</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().run()}
              className="gap-2">
              <MessageSquare className="h-4 w-4 text-violet-500" />
              <span>Explain Selection</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Academic Group */}
      <div className="flex items-center gap-0.5 bg-blue-50/50 rounded-md p-0.5 border border-blue-100">
        <Toggle
          className="hover:bg-blue-100 data-[state=on]:bg-blue-200"
          size="sm"
          title="Add Citation (Cmd+Shift+A)"
          onClick={onInsertCitation}
          disabled={!userCanEdit}>
          <BookOpen className="h-3.5 w-3.5 text-blue-700" />
        </Toggle>

        <Toggle
          className="hover:bg-blue-100 data-[state=on]:bg-blue-200"
          size="sm"
          title="Edit Citation (Cmd+Shift+E)"
          onClick={onEditCitation}
          disabled={!userCanEdit}>
          <Edit3 className="h-3.5 w-3.5 text-blue-700" />
        </Toggle>

        <Toggle
          className="hover:bg-blue-100 data-[state=on]:bg-blue-200"
          size="sm"
          title="Insert Reference List (Cmd+Shift+R)"
          onClick={onInsertReferenceList}
          disabled={!userCanEdit}>
          <FileText className="h-3.5 w-3.5 text-blue-700" />
        </Toggle>

        <Toggle
          className="hover:bg-blue-100 data-[state=on]:bg-blue-200"
          size="sm"
          title="Add Footnote (Cmd+Shift+F)"
          onClick={onInsertFootnote}
          disabled={!userCanEdit}>
          <Footprints className="h-3.5 w-3.5 text-blue-700" />
        </Toggle>
      </div>
    </div>
  );
}
