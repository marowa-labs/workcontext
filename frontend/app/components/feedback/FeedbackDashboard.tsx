"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "../../hooks/use-toast";
import FeedbackService from "../../lib/utils/feedbackService";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Lock,
  Eye,
  Database,
  FileArchive,
} from "lucide-react";

interface UserFeedback {
  id: string;
  user_id: string | null;
  type: string;
  category: string | null;
  priority: string;
  title: string;
  description: string;
  status: string;
  attachment_urls: string[];
  browser_info: string | null;
  os_info: string | null;
  screen_size: string | null;
  user_plan: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const FeedbackDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [feedbackItems, setFeedbackItems] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState({
    type: "feedback",
    category: "",
    priority: "medium",
    title: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const feedback = await FeedbackService.getUserFeedback();
      setFeedbackItems(feedback);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load feedback data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeedback = async () => {
    if (!newFeedback.title.trim() || !newFeedback.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a title and description for your feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Collect browser and OS information
      const browserInfo = navigator.userAgent;
      const osInfo = navigator.platform;
      const screenSize = `${window.screen.width}x${window.screen.height}`;

      await FeedbackService.createFeedback({
        type: newFeedback.type,
        category: newFeedback.category || undefined,
        priority: newFeedback.priority,
        title: newFeedback.title,
        description: newFeedback.description,
        browser_info: browserInfo,
        os_info: osInfo,
        screen_size: screenSize,
      });

      toast({
        title: "Success",
        description: "Your feedback has been submitted successfully",
      });

      setNewFeedback({
        type: "feedback",
        category: "",
        priority: "medium",
        title: "",
        description: "",
      });

      // Refresh data
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> Resolved
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500">
            <Clock className="w-3 h-3 mr-1" /> In Progress
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" /> Closed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" /> Open
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "bug_report":
        return (
          <Badge variant="destructive">
            <Bug className="w-3 h-3 mr-1" /> Bug
          </Badge>
        );
      case "feature_request":
        return (
          <Badge variant="secondary">
            <Lightbulb className="w-3 h-3 mr-1" /> Feature
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <MessageSquare className="w-3 h-3 mr-1" /> Feedback
          </Badge>
        );
    }
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;

    const categoryMap: Record<
      string,
      { icon: React.ReactNode; label: string }
    > = {
      ui: { icon: <Eye className="w-3 h-3 mr-1" />, label: "UI" },
      functionality: {
        icon: <Database className="w-3 h-3 mr-1" />,
        label: "Functionality",
      },
      performance: {
        icon: <Clock className="w-3 h-3 mr-1" />,
        label: "Performance",
      },
      content: {
        icon: <FileText className="w-3 h-3 mr-1" />,
        label: "Content",
      },
      other: { icon: <FileArchive className="w-3 h-3 mr-1" />, label: "Other" },
    };

    const categoryInfo = categoryMap[category] || {
      icon: <FileArchive className="w-3 h-3 mr-1" />,
      label: category,
    };

    return (
      <Badge variant="outline">
        {categoryInfo.icon} {categoryInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Feedback Center
              </h1>
              <p className="text-muted-foreground mt-2">
                Share your thoughts, report bugs, and request features
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
              <TabsTrigger value="my-feedback">My Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card border border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">
                      Total Feedback
                    </CardTitle>
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {feedbackItems.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All your feedback submissions
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">
                      Open Feedback
                    </CardTitle>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {feedbackItems.filter((f) => f.status === "open").length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting review
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">
                      In Progress
                    </CardTitle>
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {
                        feedbackItems.filter((f) => f.status === "in_progress")
                          .length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Being worked on
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">
                      Resolved
                    </CardTitle>
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {
                        feedbackItems.filter((f) => f.status === "resolved")
                          .length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Successfully addressed
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Submit common types of feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      className="w-full"
                      onClick={() => {
                        setNewFeedback({
                          ...newFeedback,
                          type: "bug_report",
                          title: "",
                          description: "",
                        });
                        setActiveTab("submit");
                      }}>
                      <Bug className="w-4 h-4 mr-2" />
                      Report a Bug
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setNewFeedback({
                          ...newFeedback,
                          type: "feature_request",
                          title: "",
                          description: "",
                        });
                        setActiveTab("submit");
                      }}>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Request a Feature
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setNewFeedback({
                          ...newFeedback,
                          type: "feedback",
                          title: "",
                          description: "",
                        });
                        setActiveTab("submit");
                      }}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Share General Feedback
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Feedback Types
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Different ways to contribute to ScholarForge AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Bug className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-foreground">
                          Bug Reports
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Report issues or unexpected behavior
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-foreground">
                          Feature Requests
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Suggest new features or improvements
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-foreground">
                          General Feedback
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Share your thoughts and suggestions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="submit" className="space-y-6">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Submit Feedback
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Help us improve ScholarForge AIby sharing your experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="feedbackType" className="text-foreground">
                        Feedback Type *
                      </Label>
                      <Select
                        value={newFeedback.type}
                        onValueChange={(value) =>
                          setNewFeedback({ ...newFeedback, type: value })
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select feedback type" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground">
                          <SelectItem value="feedback">
                            <div className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              General Feedback
                            </div>
                          </SelectItem>
                          <SelectItem value="bug_report">
                            <div className="flex items-center">
                              <Bug className="w-4 h-4 mr-2" />
                              Bug Report
                            </div>
                          </SelectItem>
                          <SelectItem value="feature_request">
                            <div className="flex items-center">
                              <Lightbulb className="w-4 h-4 mr-2" />
                              Feature Request
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="feedbackCategory"
                        className="text-foreground">
                        Category
                      </Label>
                      <Select
                        value={newFeedback.category}
                        onValueChange={(value) =>
                          setNewFeedback({ ...newFeedback, category: value })
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category (optional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground">
                          <SelectItem value="ui">UI/UX</SelectItem>
                          <SelectItem value="functionality">
                            Functionality
                          </SelectItem>
                          <SelectItem value="performance">
                            Performance
                          </SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="feedbackPriority"
                        className="text-foreground">
                        Priority
                      </Label>
                      <Select
                        value={newFeedback.priority}
                        onValueChange={(value) =>
                          setNewFeedback({ ...newFeedback, priority: value })
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="feedbackTitle"
                        className="text-foreground">
                        Title *
                      </Label>
                      <Input
                        id="feedbackTitle"
                        placeholder="Briefly describe your feedback..."
                        value={newFeedback.title}
                        onChange={(e) =>
                          setNewFeedback({
                            ...newFeedback,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="feedbackDescription"
                        className="text-foreground">
                        Description *
                      </Label>
                      <Textarea
                        id="feedbackDescription"
                        placeholder="Please provide detailed information about your feedback..."
                        value={newFeedback.description}
                        onChange={(e) =>
                          setNewFeedback({
                            ...newFeedback,
                            description: e.target.value,
                          })
                        }
                        rows={6}
                      />
                    </div>

                    <Button
                      onClick={handleCreateFeedback}
                      disabled={
                        isSubmitting ||
                        !newFeedback.title.trim() ||
                        !newFeedback.description.trim()
                      }>
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        "Submit Feedback"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-feedback" className="space-y-6">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Your Feedback
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Track the status of your feedback submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feedbackItems.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No feedback yet
                      </h3>
                      <p className="text-muted-foreground">
                        You haven't submitted any feedback.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => setActiveTab("submit")}>
                        Submit Your First Feedback
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbackItems.map((feedback) => (
                        <div
                          key={feedback.id}
                          className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col space-y-1">
                              {getTypeBadge(feedback.type)}
                              {getCategoryBadge(feedback.category)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {feedback.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Submitted:{" "}
                                {new Date(
                                  feedback.created_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {getStatusBadge(feedback.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
