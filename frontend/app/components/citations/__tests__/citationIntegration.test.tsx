import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CitationsDashboardPage from "../../../pagescitations/page";
import AddCitationModal from "../AddCitationModal";
import { CitationsModal } from "../../editor/citations-modal";

// Mock the necessary modules
jest.mock("../../../lib/utils/billingService", () => ({
  __esModule: true,
  default: {
    getCurrentSubscription: jest.fn(),
  },
}));

jest.mock("../../../lib/utils/citationService", () => ({
  __esModule: true,
  default: {
    getCitations: jest.fn(),
    createCitation: jest.fn(),
    updateCitation: jest.fn(),
    deleteCitation: jest.fn(),
    searchExternal: jest.fn(),
    formatCitation: jest.fn(),
  },
}));

jest.mock("../../../lib/utils/projectService", () => ({
  __esModule: true,
  default: {
    getProjectById: jest.fn(),
  },
}));

jest.mock("../../../lib/utils/apiClient", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock React Router DOM
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

describe("Citation Access Control Integration", () => {
  const mockCitations = [
    {
      id: "1",
      type: "article",
      title: "Test Article",
      authors: [{ firstName: "John", lastName: "Doe" }],
      year: 2023,
      journal: "Test Journal",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses
    const apiClient = require("../../../lib/utils/apiClient").default;
    apiClient.get.mockResolvedValue({ data: mockCitations });
    apiClient.post.mockResolvedValue({ data: { success: true } });

    const ProjectService = require("../../../lib/utils/projectService").default;
    ProjectService.getProjectById.mockResolvedValue({
      id: "test-project",
      title: "Test Project",
    });
  });

  describe("Citations Dashboard Page", () => {
    it("should show access restriction message for free users", async () => {
      const BillingService =
        require("../../../lib/utils/billingService").default;
      BillingService.getCurrentSubscription.mockResolvedValue({
        plan: { id: "free", name: "Free Plan" },
      });

      render(<CitationsDashboardPage />);

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText("Citations")).toBeInTheDocument();
      });

      // Check for access restriction message
      await waitFor(() => {
        expect(screen.getByText(/Limited to 5 formats/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Upgrade to access more citation formats/i),
        ).toBeInTheDocument();
      });
    });

    it("should not show access restriction message for paid users", async () => {
      const BillingService =
        require("../../../lib/utils/billingService").default;
      BillingService.getCurrentSubscription.mockResolvedValue({
        plan: { id: "student", name: "Student Plan" },
      });

      render(<CitationsDashboardPage />);

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText("Citations")).toBeInTheDocument();
      });

      // Check that no restriction message is shown
      expect(
        screen.queryByText(/Limited to 5 formats/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Add Citation Modal", () => {
    it("should show access information for free users", async () => {
      const BillingService =
        require("../../../lib/utils/billingService").default;
      BillingService.getCurrentSubscription.mockResolvedValue({
        plan: { id: "free", name: "Free Plan" },
      });

      const { container } = render(
        <AddCitationModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="test-project"
          onCitationAdded={jest.fn()}
        />,
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText("Add Citation")).toBeInTheDocument();
      });

      // Check for access information
      await waitFor(() => {
        expect(
          screen.getByText(/Upgrade to access more citation formats/i),
        ).toBeInTheDocument();
      });
    });

    it("should not show access information for paid users", async () => {
      const BillingService =
        require("../../../lib/utils/billingService").default;
      BillingService.getCurrentSubscription.mockResolvedValue({
        plan: { id: "student", name: "Student Plan" },
      });

      render(
        <AddCitationModal
          isOpen={true}
          onClose={jest.fn()}
          projectId="test-project"
          onCitationAdded={jest.fn()}
        />,
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText("Add Citation")).toBeInTheDocument();
      });

      // Check that no access information is shown
      expect(
        screen.queryByText(/Upgrade to access more citation formats/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Citations Modal", () => {
    it("should show access information for free users", async () => {
      const BillingService =
        require("../../../lib/utils/billingService").default;
      BillingService.getCurrentSubscription.mockResolvedValue({
        plan: { id: "free", name: "Free Plan" },
      });

      render(
        <CitationsModal
          isOpen={true}
          onClose={jest.fn()}
          editor={null}
          projectId="test-project"
        />,
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText("Citation Manager")).toBeInTheDocument();
      });

      // Check for access information
      await waitFor(() => {
        expect(
          screen.getByText(/Upgrade to access more citation formats/i),
        ).toBeInTheDocument();
      });
    });

    it("should not show access information for paid users", async () => {
      const BillingService =
        require("../../../lib/utils/billingService").default;
      BillingService.getCurrentSubscription.mockResolvedValue({
        plan: { id: "student", name: "Student Plan" },
      });

      render(
        <CitationsModal
          isOpen={true}
          onClose={jest.fn()}
          editor={null}
          projectId="test-project"
        />,
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText("Citation Manager")).toBeInTheDocument();
      });

      // Check that no access information is shown
      expect(
        screen.queryByText(/Upgrade to access more citation formats/i),
      ).not.toBeInTheDocument();
    });
  });
});
