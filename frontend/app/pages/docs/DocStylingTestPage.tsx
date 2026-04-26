"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";
import DocumentationViewer from "../../components/docs/DocumentationViewer";

const DocStylingTestPage: React.FC = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const testMarkdown = `
# Documentation Styling Test

This page demonstrates the consistent styling applied to documentation pages based on the user's subscription plan.

## Text Styles

Regular paragraph text with **bold**, *italic*, and ~~strikethrough~~ formatting.

### Code Examples

Inline code: \`const example = "test";\`

Block code:
\`\`\`javascript
function helloWorld() {
  console.log("Hello, world!");
  return true;
}
\`\`\`

### Lists

1. Ordered item 1
2. Ordered item 2
3. Ordered item 3

- Unordered item 1
- Unordered item 2
- Unordered item 3

### Links

[Documentation Home](/docs) | [Quick Start Guide](/docs/quickstart) | [API Documentation](/docs/api)

### Tables

| Feature | Description | Status |
|---------|-------------|--------|
| Plan Styling | Applies consistent colors based on subscription | ✅ Implemented |
| Responsive Design | Works on all device sizes | ✅ Implemented |
| Dark Mode | Supports dark theme | ✅ Implemented |

> This is a blockquote example that might be used for important notes or tips.

---

*This is the end of the styling test.*
`;

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      <div className="mb-6">
        <Link
          href="/docs"
          className={`inline-flex items-center ${planDocLinkClasses}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className={`${planCardClasses} rounded-xl p-6`}>
        <DocumentationViewer content={testMarkdown} />
      </div>

      <div className={`${planCardClasses} mt-8 p-6 rounded-xl`}>
        <h2 className={`text-xl font-bold mb-4 ${planDocHeadingClasses}`}>
          Styling Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
              Current Classes
            </h3>
            <ul className="text-sm space-y-1">
              <li>Content: {planDocContentClasses}</li>
              <li>Headings: {planDocHeadingClasses}</li>
              <li>Links: {planDocLinkClasses}</li>
            </ul>
          </div>
          <div>
            <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
              Implementation
            </h3>
            <p className="text-sm">
              This styling system uses CSS variables and plan-specific classes
              to ensure consistent appearance across all documentation pages,
              matching the styling used in components like the Recycle Bin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocStylingTestPage;
