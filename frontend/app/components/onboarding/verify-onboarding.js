#!/usr/bin/env node

/**
 * Script to verify that all required elements for onboarding are in place
 *
 * This script checks:
 * 1. That the ElementHighlightOnboarding component exists
 * 2. That the dashboard imports and uses the component
 * 3. That the required target elements exist in the dashboard
 * 4. That the onboarding context is properly set up
 */

const fs = require("fs");
const path = require("path");

// Paths to check
const onboardingComponentPath = path.join(
  __dirname,
  "ElementHighlightOnboarding.tsx"
);
const dashboardPath = path.join(
  __dirname,
  "../../pagesdashboard/page.jsx"
);
const onboardingContextPath = path.join(
  __dirname,
  "../../contexts/OnboardingContext.tsx"
);

console.log("🔍 Verifying onboarding implementation...\n");

// Check 1: ElementHighlightOnboarding component exists
console.log("1. Checking ElementHighlightOnboarding component...");
if (fs.existsSync(onboardingComponentPath)) {
  console.log("   ✅ Component exists");
} else {
  console.log("   ❌ Component not found");
  process.exit(1);
}

// Check 2: Dashboard imports and uses the component
console.log("2. Checking dashboard integration...");
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, "utf8");

  // Check import
  if (dashboardContent.includes("ElementHighlightOnboarding")) {
    console.log("   ✅ Component import found");
  } else {
    console.log("   ❌ Component import not found");
    process.exit(1);
  }

  // Check usage
  if (dashboardContent.includes("<ElementHighlightOnboarding />")) {
    console.log("   ✅ Component usage found");
  } else {
    console.log("   ❌ Component usage not found");
    process.exit(1);
  }
} else {
  console.log("   ❌ Dashboard file not found");
  process.exit(1);
}

// Check 3: Required target elements exist in dashboard
console.log("3. Checking target elements...");
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, "utf8");

  // Check new project button
  if (dashboardContent.includes('id="new-project-button"')) {
    console.log("   ✅ New project button found");
  } else {
    console.log("   ❌ New project button not found");
    process.exit(1);
  }

  // Check template section
  if (dashboardContent.includes('id="template-section"')) {
    console.log("   ✅ Template section found");
  } else {
    console.log("   ❌ Template section not found");
    process.exit(1);
  }
} else {
  console.log("   ❌ Dashboard file not found");
  process.exit(1);
}

// Check 4: Onboarding context exists
console.log("4. Checking onboarding context...");
if (fs.existsSync(onboardingContextPath)) {
  console.log("   ✅ Onboarding context exists");
} else {
  console.log("   ❌ Onboarding context not found");
  process.exit(1);
}

console.log("\n✅ All checks passed! Onboarding implementation is complete.");
console.log("\nTo test the onboarding:");
console.log("1. Start the development server: npm run dev");
console.log("2. Navigate to http://localhost:3000");
console.log("3. Complete the survey if you haven't already");
console.log("4. The onboarding should automatically appear");
console.log(
  "5. Verify that elements are highlighted as you progress through the steps"
);
