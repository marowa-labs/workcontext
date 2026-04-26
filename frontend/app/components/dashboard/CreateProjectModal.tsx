"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../lib/utils/useUser";
import { useRouter } from "next/navigation";
import Button from "../auth/Button";
import { useForm } from "react-hook-form";
import FormInput from "../auth/FormInput";
import TemplateService from "../../lib/utils/templateService";
import WorkspaceService from "../../lib/utils/workspaceService";
import {
  X,
  Beaker,
  BookOpen,
  File,
  FileText,
  Crown,
  Rocket,
  Zap,
  AlertCircle,
  Users,
} from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreate: (project: any) => void;
  isFreeUser?: boolean;
  isStudentUser?: boolean;
  isResearcherUser?: boolean;
  maxProjects?: number; // Maximum projects allowed for the user's plan
  currentProjectCount?: number; // Current number of projects user has
  initialWorkspaceId?: string;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreate,
  initialWorkspaceId,
}: CreateProjectModalProps) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "student" | "researcher">(
    "free"
  );
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    initialWorkspaceId || null
  );

  // Load workspaces when the modal opens
  useEffect(() => {
    if (isOpen && user) {
      const fetchWorkspaces = async () => {
        try {
          const userWorkspaces = await WorkspaceService.getWorkspaces();
          setWorkspaces(userWorkspaces);

          // Set the workspace based on initialWorkspaceId if provided
          if (initialWorkspaceId) {
            // Verify the initial workspace exists in the user's workspaces
            const workspaceExists = userWorkspaces.some(
              (ws) => ws.id === initialWorkspaceId
            );
            if (workspaceExists) {
              setSelectedWorkspace(initialWorkspaceId);
            } else {
              // If the initial workspace doesn't exist, set to null
              setSelectedWorkspace(null);
            }
          } else if (userWorkspaces.length > 0 && !selectedWorkspace) {
            // Otherwise, set the first workspace as default only if no workspace is currently selected
            setSelectedWorkspace(userWorkspaces[0].id);
          }
        } catch (err) {
          console.error("Error fetching workspaces:", err);
          // Don't show error to user as workspaces are optional
        }
      };
      fetchWorkspaces();
    }
  }, [isOpen, user, initialWorkspaceId, selectedWorkspace]);

  // Derive user plan flags from the actual user plan state
  const isStudentUser = userPlan === "student";
  const isResearcherUser = userPlan === "researcher";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      type: "research-paper",
      citationStyle: "",
      dueDate: "",
      description: "",
    },
    mode: "onChange", // Add this to enable real-time validation
  });

  const watchedFields = watch();
  // Load user's current plan
  useEffect(() => {
    const loadUserPlan = async () => {
      if (user && !userLoading) {
        try {
          const BillingService = (
            await import("../../lib/utils/billingService")
          ).default;
          const subscriptionData =
            await BillingService.getCurrentSubscription();
          setUserPlan(
            subscriptionData.plan.id as "free" | "student" | "researcher"
          );
        } catch (err) {
          console.error("Failed to load subscription data:", err);
          setUserPlan("free");
        }
      }
    };

    loadUserPlan();
  }, [user, userLoading]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);

      // Refresh subscription data when modal opens
      const refreshSubscriptionData = async () => {
        if (user && !userLoading) {
          try {
            const BillingService = (
              await import("../../lib/utils/billingService")
            ).default;
            const subscriptionData =
              await BillingService.getCurrentSubscription();
            setUserPlan(
              subscriptionData.plan.id as "free" | "student" | "researcher"
            );
          } catch (err) {
            console.error("Failed to refresh subscription data:", err);
            setUserPlan("free");
          }
        }
      };

      refreshSubscriptionData();

      // Reset form to default values when modal opens
      const defaultValues = {
        name: "",
        type: "research-paper", // Default to research paper
        citationStyle: "",
        dueDate: "",
        description: "",
      };
      reset(defaultValues);
    }
  }, [isOpen, reset, user, userLoading]);

  const projectTypes = [
    {
      id: "project-doc",
      label: "Project Doc",
      icon: File,
      description: "Project planning and documentation",
      color: "blue",
    },
    {
      id: "meeting-notes",
      label: "Meeting Notes",
      icon: FileText,
      description: "Meeting agendas and action items",
      color: "purple",
    },
    {
      id: "strategy",
      label: "Strategy",
      icon: Rocket,
      description: "Strategic planning and roadmaps",
      color: "green",
    },
    {
      id: "brainstorm",
      label: "Brainstorm",
      icon: Zap,
      description: "Ideas and creative thinking",
      color: "yellow",
    },
    {
      id: "product-spec",
      label: "Product Spec",
      icon: File,
      description: "Product requirements and specs",
      color: "indigo",
    },
    {
      id: "team-wiki",
      label: "Team Wiki",
      icon: BookOpen,
      description: "Team knowledge and processes",
      color: "blue",
    },
    {
      id: "decision-doc",
      label: "Decision Doc",
      icon: FileText,
      description: "Decision records and rationales",
      color: "purple",
    },
    {
      id: "user-research",
      label: "User Research",
      icon: Users,
      description: "Research findings and insights",
      color: "pink",
    },
    {
      id: "design-doc",
      label: "Design Doc",
      icon: File,
      description: "Design specifications and mocks",
      color: "indigo",
    },
    {
      id: "case-study",
      label: "Case Study",
      icon: File,
      description: "In-depth analysis of a project",
      color: "pink",
    },
    {
      id: "report",
      label: "Report",
      icon: BookOpen,
      description: "Quarterly or annual reports",
      color: "indigo",
    },
    {
      id: "presentation-deck",
      label: "Presentation Deck",
      icon: File,
      description: "Professional presentation deck",
      color: "gray",
    },
    {
      id: "presentation",
      label: "Presentation",
      icon: File,
      description: "Academic presentation or slideshow",
      color: "gray",
    },
    {
      id: "blank",
      label: "Blank Document",
      icon: File,
      description: "Start from scratch with no template",
      color: "gray",
    },
  ];

  // Citation styles
  const citationStyles = [
    { value: "", label: "Select citation style..." },
    {
      value: "ieee",
      label: "IEEE (Institute of Electrical and Electronics Engineers)",
    },
    {
      value: "ama",
      label: "AMA (American Medical Association)",
    },
    {
      value: "asa",
      label: "ASA (American Sociological Association)",
    },
    { value: "apa-7", label: "American Psychological Association 7th edition" },
    { value: "mla-9", label: "Modern Language Association 9th edition" },
    { value: "chicago", label: "Begell House - Chicago Manual of Style" },
    { value: "mla-8", label: "Modern Language Association 8th edition" },
    { value: "amr", label: "Academy of Management Review" },
    { value: "aap", label: "Accident Analysis and Prevention" },
    { value: "acimj", label: "ACI Materials Journal" },
    {
      value: "acm-sig-proceedings-3+",
      label: 'ACM SIG Proceedings ("et al." for 3+ authors)',
    },
    {
      value: "acm-sig-proceedings-15+",
      label: 'ACM SIG Proceedings ("et al." for 15+ authors)',
    },
    { value: "acm-sigchi-2016", label: "ACM SIGCHI Proceedings (2016)" },
    {
      value: "acm-sigchi-extended-abstract",
      label: "ACM SIGCHI Proceedings - Extended Abstract Format",
    },
    { value: "acm-siggraph", label: "ACM SIGGRAPH" },
    {
      value: "acme",
      label: "ACME: An International Journal for Critical Geographies",
    },
    { value: "acta-amazonica", label: "Acta Amazonica" },
    {
      value: "acta-anaesthesiologica-scandinavica",
      label: "Acta Anaesthesiologica Scandinavica",
    },
    {
      value: "acta-anaesthesiologica-taiwanica",
      label: "Acta Anaesthesiologica Taiwanica",
    },
    { value: "acta-botanica-croatica", label: "Acta Botanica Croatica" },
    { value: "acta-chiropterologica", label: "Acta Chiropterologica" },
    {
      value: "acta-chirurgiae-orthopaedicae-et-traumatologiae-cechoslovaca",
      label: "Acta chirurgiae orthopaedicae et traumatologiae Čechoslovaca",
    },
    { value: "acta-hydrotechnica", label: "Acta hydrotechnica" },
    {
      value: "acta-ichthyologica-et-piscatoria",
      label: "Acta Ichthyologica et Piscatoria",
    },
    { value: "acta-medica-peruana", label: "Acta Médica Peruana" },
    { value: "acta-naturae", label: "Acta Naturae" },
    {
      value: "acta-neurobiologiae-experimentalis",
      label: "Acta Neurobiologiae Experimentalis",
    },
    { value: "acta-neurochirurgica", label: "Acta Neurochirurgica" },
    { value: "acta-ophthalmologica", label: "Acta Ophthalmologica" },
    { value: "acta-ornithologica", label: "Acta Ornithologica" },
    { value: "acta-orthopaedica", label: "Acta Orthopaedica" },
    { value: "acta-orthopaedica-belgica", label: "Acta Orthopædica Belgica" },
    { value: "acta-paediatrica", label: "Acta Paediatrica" },
    {
      value: "acta-palaeontologica-polonica",
      label: "Acta Palaeontologica Polonica",
    },
    { value: "acta-pharmaceutica", label: "Acta Pharmaceutica" },
    {
      value: "acta-pharmaceutica-sinica-b",
      label: "Acta Pharmaceutica Sinica B",
    },
    { value: "acta-philosophica", label: "Acta Philosophica" },
    { value: "acta-physica-sinica", label: "Acta Physica Sinica (物理学报)" },
    { value: "acta-physiologica", label: "Acta Physiologica" },
    { value: "acta-polytechnica", label: "Acta Polytechnica" },
    { value: "acta-radiologica", label: "Acta Radiologica" },
    {
      value: "acta-scientiae-veterinariae",
      label: "Acta Scientiae Veterinariae",
    },
    {
      value: "acta-societatis-botanicorum-poloniae",
      label: "Acta Societatis Botanicorum Poloniae",
    },
    {
      value:
        "acta-universitatis-agriculturae-et-silviculturae-mendelianae-brunensis",
      label:
        "Acta Universitatis Agriculturae et Silviculturae Mendelianae Brunensis",
    },
    {
      value: "acta-universitatis-agriculturae-sueciae",
      label:
        "Acta Universitatis Agriculturae Sueciae (Swedish University of Agricultural Sciences)",
    },
    {
      value: "acta-zoologica-academiae-scientiarum-hungaricae",
      label: "Acta Zoologica Academiae Scientiarum Hungaricae",
    },
    {
      value: "administrative-science-quarterly",
      label: "Administrative Science Quarterly",
    },
    {
      value: "advanced-engineering-materials",
      label: "Advanced Engineering Materials",
    },
    {
      value: "advanced-functional-materials",
      label: "Advanced Functional Materials",
    },
    {
      value: "advanced-healthcare-materials",
      label: "Advanced Healthcare Materials",
    },
    { value: "advanced-materials", label: "Advanced Materials" },
    {
      value: "advanced-optical-materials",
      label: "Advanced Optical Materials",
    },
    {
      value: "advanced-pharmaceutical-bulletin",
      label: "Advanced Pharmaceutical Bulletin",
    },
    {
      value: "advances-in-alzheimers-disease",
      label: "Advances in Alzheimer's Disease",
    },
    {
      value: "advances-in-complex-systems",
      label: "Advances in Complex Systems",
    },
    {
      value: "aerosol-and-air-quality-research",
      label: "Aerosol and Air Quality Research",
    },
    {
      value: "aerosol-science-and-technology",
      label: "Aerosol Science and Technology",
    },
    {
      value: "aerospace-medicine-and-human-performance",
      label: "Aerospace Medicine and Human Performance",
    },
    {
      value: "african-journal-of-marine-science",
      label: "African Journal of Marine Science",
    },
    {
      value: "african-online-scientific-information-systems-harvard",
      label: "African Online Scientific Information Systems - Harvard",
    },
    {
      value: "african-online-scientific-information-systems-vancouver",
      label: "African Online Scientific Information Systems - Vancouver",
    },
    { value: "african-zoology", label: "African Zoology" },
    { value: "afro-asia", label: "Afro-Ásia (Português - Brasil)" },
    { value: "age-and-ageing", label: "Age and Ageing" },
    { value: "ageing-society", label: "Ageing & Society" },
    { value: "aging", label: "Aging" },
    { value: "aging-and-disease", label: "Aging and Disease" },
    { value: "aging-cell", label: "Aging Cell" },
    { value: "agora", label: "Agora" },
    {
      value: "agriculturae-conspectus-scientificus",
      label: "Agriculturae Conspectus Scientificus",
    },
    { value: "aib-studi", label: "AIB studi (Italiano)" },
    { value: "aids", label: "AIDS" },
    { value: "aims-press", label: "AIMS Press" },
    {
      value: "aix-marseille-universite-departement-detudes-asiatiques",
      label:
        "Aix-Marseille Université - Département d'études asiatiques (Français)",
    },
    {
      value: "al-jami'ah-journal-of-islamic-studies",
      label: "Al-Jami'ah - Journal of Islamic Studies",
    },
    { value: "alcohol-and-alcoholism", label: "Alcohol and Alcoholism" },
    {
      value: "alcoholism-clinical-and-experimental-research",
      label: "Alcoholism: Clinical and Experimental Research",
    },
    {
      value: "alkoholizmus-a-drogove-zavislosti",
      label: "Alkoholizmus a drogové závislosti",
    },
    { value: "allergology-international", label: "Allergology International" },
    { value: "allergy", label: "Allergy" },
    { value: "alternatif-politika", label: "Alternatif Politika" },
    {
      value: "alternatives-to-animal-experimentation",
      label: "Alternatives to Animal Experimentation",
    },
    { value: "ambio", label: "AMBIO" },
    { value: "ameghiniana", label: "Ameghiniana" },
    {
      value: "american-anthropological-association",
      label: "American Anthropological Association",
    },
    {
      value: "american-association-for-cancer-research",
      label: "American Association for Cancer Research",
    },
    {
      value: "american-association-of-petroleum-geologists",
      label: "American Association of Petroleum Geologists",
    },
    { value: "american-chemical-society", label: "American Chemical Society" },
    {
      value: "american-fisheries-society",
      label: "American Fisheries Society",
    },
    {
      value: "american-geophysical-union",
      label: "American Geophysical Union",
    },
    {
      value: "american-heart-association",
      label: "American Heart Association",
    },
    {
      value: "american-institute-of-aeronautics-and-astronautics",
      label: "American Institute of Aeronautics and Astronautics",
    },
    {
      value: "american-institute-of-physics",
      label: "American Institute of Physics",
    },
    {
      value: "american-journal-of-agricultural-economics",
      label: "American Journal of Agricultural Economics",
    },
    {
      value: "american-journal-of-archaeology",
      label: "American Journal of Archaeology",
    },
    {
      value: "american-journal-of-botany",
      label: "American Journal of Botany",
    },
    {
      value: "american-journal-of-climate-change",
      label: "American Journal of Climate Change",
    },
    {
      value: "american-journal-of-clinical-pathology",
      label: "American Journal of Clinical Pathology",
    },
    {
      value: "american-journal-of-enology-and-viticulture",
      label: "American Journal of Enology and Viticulture",
    },
    {
      value: "american-journal-of-epidemiology",
      label: "American Journal of Epidemiology",
    },
    {
      value: "american-journal-of-health-behavior",
      label: "American Journal of Health Behavior",
    },
    {
      value: "american-journal-of-hypertension",
      label: "American Journal of Hypertension",
    },
    { value: "cite-using-title-or-url", label: "Cite using Title or url" },
  ];

  interface FormData {
    name: string;
    type: string;
    citationStyle: string;
    dueDate: string;
    description: string;
    workspaceId?: string;
  }

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    if (!user) {
      setError("You must be logged in to create a project");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Creating project with user:", user?.id);

      // Prepare project data for API
      const projectData = {
        title: data.name,
        type: data.type,
        citation_style: data.citationStyle, // This will be persisted and used throughout the project
        due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        description: data.description || null,
        status: "draft",
        word_count: 0,
        content: selectedTemplate?.content || null, // Use template content if available
        template_id: selectedTemplate?.id || null, // Include template ID if available
        workspace_id: selectedWorkspace || data.workspaceId, // Include workspace ID if selected
      };

      // Create the project using ProjectService
      console.log("Calling ProjectService.createProject...");
      const ProjectService = (await import("../../lib/utils/projectService"))
        .default;
      const createdProject = await ProjectService.createProject(projectData);
      console.log("Project created successfully:", createdProject);

      // Only call onProjectCreate callback with the actual created project
      if (onProjectCreate) {
        onProjectCreate(createdProject);
      }

      onClose();
    } catch (err: any) {
      console.error("Project creation error:", err);

      if (err.message) {
        setError(`Error: ${err.message}`);
      } else if (err.toString().includes("Unauthorized")) {
        setError("Authentication failed. Please try signing out and back in.");
      } else if (err.toString().includes("NetworkError")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Failed to create space. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  interface HandleTypeSelectProps {
    typeId: string;
  }

  const handleTypeSelect = (typeId: HandleTypeSelectProps["typeId"]) => {
    setValue("type", typeId, { shouldValidate: true });

    // Fetch template based on selected project type
    const fetchTemplate = async () => {
      try {
        const template = await TemplateService.getTemplateByType(typeId);
        if (template) {
          setSelectedTemplate(template);
          // Set citation style from template if available
          if (template.citation_style) {
            setValue("citationStyle", template.citation_style, {
              shouldValidate: true,
            });
          }
        } else {
          setSelectedTemplate(null);
        }
      } catch (error) {
        console.error("Error fetching template by type:", error);
        // Don't show error to user as template might not exist for this type
        setSelectedTemplate(null);
      }
    };

    fetchTemplate();
  };

  // Get plan-specific styling
  const getPlanStyling = () => {
    if (isResearcherUser) {
      return {
        headerBg: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
        button:
          "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700",
      };
    } else if (isStudentUser) {
      return {
        headerBg: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white",
        button:
          "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-500 hover:to-cyan-700",
      };
    } else {
      return {
        headerBg: "bg-white text-gray-700 text-gray-700",
        button: "bg-blue-600 hover:bg-blue-700",
      };
    }
  };

  const planStyling = getPlanStyling();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="bg-white border border-gray-300">
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-300 w-full max-w-2xl">
              {/* Header with plan-specific styling */}
              <div
                className={`flex items-center justify-between p-6 rounded-t-2xl ${planStyling.headerBg}`}
              >
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold">Create New Space</h2>
                  {isResearcherUser ? (
                    <Crown className="w-5 h-5" />
                  ) : isStudentUser ? (
                    <Rocket className="w-5 h-5" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isResearcherUser || isStudentUser
                    ? "text-white hover:bg-white/20"
                    : "text-gray-700 hover:text-gray-700 dark:hover:text-gray-700"
                    }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <FormInput
                      label="Space Name"
                      error={errors.name?.message}
                      required
                      {...register("name", {
                        required: "Space name is required",
                      })}
                      type="text"
                      placeholder="Enter space name"
                    />
                    <p className="text-xs text-gray-700 dark:text-gray-700 mt-1">
                      Give your space a meaningful name
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-500 block mb-2 mt-1">
                        Space Type
                      </label>
                      <select
                        {...register("type")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        onChange={(e) => handleTypeSelect(e.target.value)}
                      >
                        {projectTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.type && (
                        <p className="text-sm text-red-600 flex items-center space-x-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errors.type.message}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-500 block mb-2 mt-1">
                        Citation Style
                      </label>
                      <select
                        {...register("citationStyle")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      >
                        {citationStyles.map((style) => (
                          <option key={style.value} value={style.value}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-700 dark:text-gray-700 mt-1">
                        Select or change the citation style for your project
                      </p>
                      {errors.citationStyle && (
                        <p className="text-sm text-red-600 flex items-center space-x-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errors.citationStyle.message}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-500 block mb-2 mt-1">
                      Due Date
                    </label>
                    <div className="relative">
                      <input
                        {...register("dueDate")}
                        type="date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      />
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-700 mt-1">
                      Set or change the due date for your project
                    </p>
                    {errors.dueDate && (
                      <p className="text-sm text-red-600 flex items-center space-x-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.dueDate.message}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-500 block mb-2 mt-1">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      placeholder="Describe your project to help ai understand your needs"
                    />
                    <p className="text-xs text-gray-700 dark:text-gray-700 mt-1">
                      Add or modify the project description
                    </p>
                    {errors.description && (
                      <p className="text-sm text-red-600 flex items-center space-x-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.description.message}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-500 block mb-2 mt-1">
                      Workspace (optional)
                    </label>
                    <select
                      value={selectedWorkspace || ""}
                      onChange={(e) =>
                        setSelectedWorkspace(e.target.value || null)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    >
                      <option value="">None (Personal Project)</option>
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-700 dark:text-gray-700 mt-1">
                      Select a workspace to organize your project with your team
                    </p>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 border-white-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-white border-white">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-700 rounded-lg hover:bg-cw-light-gray dark:hover:bg-white transition-colors duration-200"
                  >
                    Cancel
                  </button>

                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={!isValid || isLoading || !watchedFields.name}
                  >
                    {isLoading ? "Creating..." : "Create Space"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
