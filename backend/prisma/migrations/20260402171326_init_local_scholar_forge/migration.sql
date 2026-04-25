-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "documents" (
    "id" BIGSERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" vector,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "phone_number" TEXT,
    "otp_method" TEXT,
    "user_type" TEXT,
    "field_of_study" TEXT,
    "selected_plan" TEXT,
    "retention_period" INTEGER DEFAULT 28,
    "affiliate_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "preferred_ai_model" TEXT DEFAULT 'gpt-4o-mini',
    "storage_used" DOUBLE PRECISION DEFAULT 0,
    "storage_limit" DOUBLE PRECISION DEFAULT 5,
    "last_backup" TIMESTAMP(3),
    "bio" TEXT,
    "institution" TEXT,
    "location" TEXT,
    "ai_preferences" JSONB,
    "user_role" TEXT,
    "heard_about_platform" TEXT,
    "user_goal" TEXT,
    "main_job" TEXT,
    "survey_completed" BOOLEAN DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceView" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceInvitation" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "invited_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "preview_image" TEXT,
    "tags" JSONB DEFAULT '[]',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "citation_style" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "template_id" TEXT,
    "workspace_id" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdf_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaboratorPresence" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "join_method" TEXT DEFAULT 'workspace_member',
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaboratorPresence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentShareSettings" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "link_sharing_enabled" BOOLEAN NOT NULL DEFAULT true,
    "link_permission" TEXT NOT NULL DEFAULT 'edit',
    "require_sign_in" BOOLEAN NOT NULL DEFAULT true,
    "allow_download" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_view" BOOLEAN NOT NULL DEFAULT false,
    "expiration" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentShareSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" JSONB NOT NULL,
    "year" INTEGER,
    "journal" TEXT,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "doi" TEXT,
    "url" TEXT,
    "publisher" TEXT,
    "isbn" TEXT,
    "edition" TEXT,
    "place" TEXT,
    "conference" TEXT,
    "abstract" TEXT,
    "tags" JSONB,
    "notes" TEXT,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitationActivity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "citation_id" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecycledItem" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_data" JSONB NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "restored_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecycledItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "word_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "chat_message_count" INTEGER NOT NULL DEFAULT 0,
    "image_generation_count" INTEGER NOT NULL DEFAULT 0,
    "web_search_count" INTEGER NOT NULL DEFAULT 0,
    "deep_search_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "average_response_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feature_usage" JSONB DEFAULT '[]',
    "most_used_actions" JSONB DEFAULT '[]',
    "most_used_models" JSONB DEFAULT '[]',
    "peak_usage_hours" JSONB DEFAULT '[]',
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_tokens_used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lemonsqueezy_subscription_id" TEXT,
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTPCode" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone_number" VARCHAR(20),

    CONSTRAINT "OTPCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "snoozed_until" TIMESTAMP(3),
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_activity_enabled" BOOLEAN NOT NULL DEFAULT true,
    "project_activity_comments" BOOLEAN NOT NULL DEFAULT true,
    "project_activity_mentions" BOOLEAN NOT NULL DEFAULT true,
    "project_activity_changes" BOOLEAN NOT NULL DEFAULT true,
    "project_activity_shared" BOOLEAN NOT NULL DEFAULT false,
    "collaboration_enabled" BOOLEAN NOT NULL DEFAULT true,
    "collaboration_new_collaborator" BOOLEAN NOT NULL DEFAULT true,
    "collaboration_permission_changes" BOOLEAN NOT NULL DEFAULT true,
    "collaboration_real_time" BOOLEAN NOT NULL DEFAULT false,
    "ai_features_enabled" BOOLEAN NOT NULL DEFAULT true,
    "ai_features_plagiarism_complete" BOOLEAN NOT NULL DEFAULT true,
    "ai_features_ai_limit" BOOLEAN NOT NULL DEFAULT false,
    "ai_features_new_features" BOOLEAN NOT NULL DEFAULT true,
    "ai_features_weekly_summary" BOOLEAN NOT NULL DEFAULT false,
    "account_billing_enabled" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_payment_success" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_payment_failed" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_subscription_renewed" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_subscription_expiring" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_security_alerts" BOOLEAN NOT NULL DEFAULT true,
    "product_updates_enabled" BOOLEAN NOT NULL DEFAULT true,
    "product_updates_new_features" BOOLEAN NOT NULL DEFAULT true,
    "product_updates_tips" BOOLEAN NOT NULL DEFAULT false,
    "product_updates_newsletter" BOOLEAN NOT NULL DEFAULT false,
    "product_updates_special_offers" BOOLEAN NOT NULL DEFAULT false,
    "writing_progress_enabled" BOOLEAN NOT NULL DEFAULT true,
    "writing_progress_document_deadline" BOOLEAN NOT NULL DEFAULT true,
    "writing_progress_writing_streak" BOOLEAN NOT NULL DEFAULT true,
    "writing_progress_goal_achieved" BOOLEAN NOT NULL DEFAULT true,
    "research_updates_enabled" BOOLEAN NOT NULL DEFAULT true,
    "research_updates_ai_suggestion" BOOLEAN NOT NULL DEFAULT true,
    "research_updates_citation_reminder" BOOLEAN NOT NULL DEFAULT true,
    "research_updates_research_update" BOOLEAN NOT NULL DEFAULT true,
    "document_management_enabled" BOOLEAN NOT NULL DEFAULT true,
    "document_management_backup_available" BOOLEAN NOT NULL DEFAULT true,
    "document_management_template_update" BOOLEAN NOT NULL DEFAULT true,
    "document_management_document_version" BOOLEAN NOT NULL DEFAULT true,
    "collaboration_request_enabled" BOOLEAN NOT NULL DEFAULT true,
    "collaboration_request_collaborator_request" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'real-time',
    "quiet_hours_enabled" BOOLEAN NOT NULL DEFAULT false,
    "quiet_hours_start_time" TEXT NOT NULL DEFAULT '22:00',
    "quiet_hours_end_time" TEXT NOT NULL DEFAULT '08:00',
    "push_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications_mentions" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications_comments" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications_direct_messages" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications_marketing" BOOLEAN NOT NULL DEFAULT false,
    "in_app_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_notifications_sound" BOOLEAN NOT NULL DEFAULT true,
    "in_app_notifications_desktop" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sms_notifications_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sms_notifications_high_priority_only" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_invoice_available" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_payment_refunded" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_subscription_cancelled" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_subscription_created" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_subscription_expired" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_subscription_resumed" BOOLEAN NOT NULL DEFAULT true,
    "account_billing_subscription_updated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedWebhook" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailedWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("idempotency_key")
);

-- CreateTable
CREATE TABLE "SubscriptionEventLog" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" TEXT,
    "processing_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "severity" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIHistory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIChatSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AIChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIChatMessage" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "image_url" TEXT,
    "file_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "citations" JSONB,
    "confidence_score" DOUBLE PRECISION,
    "context_used" JSONB,
    "mode" TEXT NOT NULL DEFAULT 'general',
    "sources" JSONB,

    CONSTRAINT "AIChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "relevance" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChatMessage" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "project_id" TEXT,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceTask" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" TEXT,
    "recurrence_end_date" TIMESTAMP(3),
    "recurrence_max_occurrences" INTEGER,
    "parent_recurring_task_id" TEXT,
    "is_recurrence_exception" BOOLEAN NOT NULL DEFAULT false,
    "original_due_date" TIMESTAMP(3),
    "project_id" TEXT,
    "estimated_hours" DOUBLE PRECISION,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "template_name" TEXT,
    "template_category" TEXT,

    CONSTRAINT "WorkspaceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "depends_on_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'blocks',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceSubtask" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceSubtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceLabel" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#94a3b8',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAttachment" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceCustomField" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCustomFieldValue" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "text_value" TEXT,
    "number_value" DOUBLE PRECISION,
    "date_value" TIMESTAMP(3),

    CONSTRAINT "TaskCustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTimeEntry" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_notified_soon_at" TIMESTAMP(3),
    "last_notified_overdue_at" TIMESTAMP(3),

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lemonsqueezy_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAppearanceSettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "auto_dark_mode" BOOLEAN NOT NULL DEFAULT false,
    "font_family" TEXT NOT NULL DEFAULT 'Inter',
    "font_size" INTEGER NOT NULL DEFAULT 18,
    "line_height" DOUBLE PRECISION NOT NULL DEFAULT 1.75,
    "line_width" INTEGER NOT NULL DEFAULT 700,
    "accent_color" TEXT NOT NULL DEFAULT 'blue',
    "sidebar_position" TEXT NOT NULL DEFAULT 'left',
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "animations" BOOLEAN NOT NULL DEFAULT true,
    "reduce_motion" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAppearanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPerformanceMetric" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "response_time" DOUBLE PRECISION NOT NULL,
    "tokens_used" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_length" INTEGER NOT NULL DEFAULT 0,
    "context" TEXT,
    "cost_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feature_category" TEXT,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AIPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIFeedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "is_helpful" BOOLEAN NOT NULL,
    "feedback_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPrivacySettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_visibility" TEXT NOT NULL DEFAULT 'private',
    "show_activity" BOOLEAN NOT NULL DEFAULT true,
    "show_location_in_document" BOOLEAN NOT NULL DEFAULT false,
    "search_indexing" BOOLEAN NOT NULL DEFAULT false,
    "share_analytics" BOOLEAN NOT NULL DEFAULT true,
    "share_crash_reports" BOOLEAN NOT NULL DEFAULT true,
    "third_party_cookies" BOOLEAN NOT NULL DEFAULT false,
    "document_privacy" TEXT NOT NULL DEFAULT 'private',
    "auto_save" BOOLEAN NOT NULL DEFAULT true,
    "offline_mode" BOOLEAN NOT NULL DEFAULT false,
    "email_unusual_logins" BOOLEAN NOT NULL DEFAULT true,
    "notify_new_devices" BOOLEAN NOT NULL DEFAULT true,
    "gdpr_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "gdpr_consent_date" TIMESTAMP(3),
    "ferpa_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "ferpa_consent_date" TIMESTAMP(3),
    "hipaa_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "hipaa_consent_date" TIMESTAMP(3),
    "ai_training_opt_out" BOOLEAN NOT NULL DEFAULT false,
    "audit_logs_enabled" BOOLEAN NOT NULL DEFAULT true,
    "marketing_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "data_sharing_consent" BOOLEAN NOT NULL DEFAULT true,
    "data_retention_period" INTEGER NOT NULL DEFAULT 28,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPrivacySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "device_info" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_info" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "location" TEXT,
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "device_info" TEXT NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL,
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorSettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "font_family" TEXT NOT NULL DEFAULT 'Inter',
    "font_size" INTEGER NOT NULL DEFAULT 16,
    "line_height" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "line_width" INTEGER NOT NULL DEFAULT 768,
    "accent_color" TEXT NOT NULL DEFAULT 'blue',
    "sidebar_position" TEXT NOT NULL DEFAULT 'right',
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "auto_dark_mode" BOOLEAN NOT NULL DEFAULT false,
    "dark_mode_start_time" TEXT NOT NULL DEFAULT '20:00',
    "dark_mode_end_time" TEXT NOT NULL DEFAULT '07:00',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "page_color" TEXT NOT NULL DEFAULT '#FFFFFF',

    CONSTRAINT "EditorSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorActivity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorEvent" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "attachment_urls" TEXT[],
    "browser_info" TEXT,
    "os_info" TEXT,
    "screen_size" TEXT,
    "user_plan" TEXT,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "UserFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackComment" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "user_id" TEXT,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "type" TEXT NOT NULL DEFAULT 'manual',
    "storage_path" TEXT NOT NULL,
    "encryption_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchAlert" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_checked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "new_matches_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restore" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "backup_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "Restore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSchedule" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "time" TEXT NOT NULL DEFAULT '02:00',
    "retention_count" INTEGER NOT NULL DEFAULT 7,
    "last_run" TIMESTAMP(3),
    "next_run" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL DEFAULT 'ScholarForge AI',

    CONSTRAINT "BackupSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL DEFAULT 0,
    "file_type" TEXT NOT NULL,
    "download_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "collaboration_export" BOOLEAN NOT NULL DEFAULT false,
    "export_options" JSONB,
    "exported_by" TEXT,

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "replied_at" TIMESTAMP(3),

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "attachment_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "browser_info" TEXT,
    "os_info" TEXT,
    "screen_size" TEXT,
    "user_plan" TEXT,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchTopic" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sources" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSource" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "year" INTEGER,
    "journal" TEXT,
    "abstract" TEXT,
    "url" TEXT,
    "content" TEXT,
    "relevance" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchPaper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "authors" JSONB DEFAULT '[]',
    "year" INTEGER,
    "venue" TEXT,
    "citationCount" INTEGER,
    "referenceCount" INTEGER,
    "fieldsOfStudy" TEXT[],
    "openAccessPdf" TEXT,
    "externalId" TEXT NOT NULL,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPaper" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "notes" TEXT,
    "tags" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionSchedule" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "next_run" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersionSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTracking" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "joined_waitlist" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "user_id" TEXT,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "role" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureRequest" (
    "id" TEXT NOT NULL,
    "featureTitle" TEXT NOT NULL,
    "featureDescription" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "FeatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "tags" TEXT[],
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "citation_style" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "author_name" TEXT,
    "category_id" TEXT,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchAnalysis" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "summary" TEXT,
    "topics" JSONB,
    "questions" JSONB,
    "concept_map" JSONB,
    "reports" JSONB,
    "flashcards" JSONB,
    "quiz" JSONB,
    "data_table" JSONB,
    "infographic" TEXT,
    "slide_deck" JSONB,
    "sources_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedAudio" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "audio_url" TEXT,
    "script" JSONB,
    "provider" TEXT NOT NULL DEFAULT 'elevenlabs',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedAudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaskLabels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskLabels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Workspace_owner_id_idx" ON "Workspace"("owner_id");

-- CreateIndex
CREATE INDEX "WorkspaceView_workspace_id_idx" ON "WorkspaceView"("workspace_id");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspace_id_idx" ON "WorkspaceMember"("workspace_id");

-- CreateIndex
CREATE INDEX "WorkspaceMember_user_id_idx" ON "WorkspaceMember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspace_id_user_id_key" ON "WorkspaceMember"("workspace_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvitation_token_key" ON "WorkspaceInvitation"("token");

-- CreateIndex
CREATE INDEX "WorkspaceInvitation_token_idx" ON "WorkspaceInvitation"("token");

-- CreateIndex
CREATE INDEX "WorkspaceInvitation_email_idx" ON "WorkspaceInvitation"("email");

-- CreateIndex
CREATE INDEX "WorkspaceInvitation_status_idx" ON "WorkspaceInvitation"("status");

-- CreateIndex
CREATE INDEX "WorkspaceInvitation_expires_at_idx" ON "WorkspaceInvitation"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvitation_workspace_id_email_key" ON "WorkspaceInvitation"("workspace_id", "email");

-- CreateIndex
CREATE INDEX "Note_user_id_idx" ON "Note"("user_id");

-- CreateIndex
CREATE INDEX "Note_project_id_idx" ON "Note"("project_id");

-- CreateIndex
CREATE INDEX "Note_category_idx" ON "Note"("category");

-- CreateIndex
CREATE INDEX "Note_created_at_idx" ON "Note"("created_at");

-- CreateIndex
CREATE INDEX "PushNotificationToken_user_id_idx" ON "PushNotificationToken"("user_id");

-- CreateIndex
CREATE INDEX "PushNotificationToken_token_idx" ON "PushNotificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationToken_user_id_token_key" ON "PushNotificationToken"("user_id", "token");

-- CreateIndex
CREATE INDEX "Project_user_id_idx" ON "Project"("user_id");

-- CreateIndex
CREATE INDEX "pdf_documents_user_id_idx" ON "pdf_documents"("user_id");

-- CreateIndex
CREATE INDEX "CollaboratorPresence_project_id_idx" ON "CollaboratorPresence"("project_id");

-- CreateIndex
CREATE INDEX "CollaboratorPresence_user_id_idx" ON "CollaboratorPresence"("user_id");

-- CreateIndex
CREATE INDEX "CollaboratorPresence_last_active_at_idx" ON "CollaboratorPresence"("last_active_at");

-- CreateIndex
CREATE INDEX "CollaboratorPresence_join_method_idx" ON "CollaboratorPresence"("join_method");

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorPresence_project_id_user_id_key" ON "CollaboratorPresence"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentShareSettings_project_id_key" ON "DocumentShareSettings"("project_id");

-- CreateIndex
CREATE INDEX "DocumentShareSettings_project_id_idx" ON "DocumentShareSettings"("project_id");

-- CreateIndex
CREATE INDEX "DocumentShareSettings_link_sharing_enabled_idx" ON "DocumentShareSettings"("link_sharing_enabled");

-- CreateIndex
CREATE INDEX "Citation_project_id_idx" ON "Citation"("project_id");

-- CreateIndex
CREATE INDEX "Citation_type_idx" ON "Citation"("type");

-- CreateIndex
CREATE INDEX "Citation_year_idx" ON "Citation"("year");

-- CreateIndex
CREATE INDEX "CitationActivity_user_id_idx" ON "CitationActivity"("user_id");

-- CreateIndex
CREATE INDEX "CitationActivity_project_id_idx" ON "CitationActivity"("project_id");

-- CreateIndex
CREATE INDEX "CitationActivity_citation_id_idx" ON "CitationActivity"("citation_id");

-- CreateIndex
CREATE INDEX "CitationActivity_action_idx" ON "CitationActivity"("action");

-- CreateIndex
CREATE INDEX "CitationActivity_created_at_idx" ON "CitationActivity"("created_at");

-- CreateIndex
CREATE INDEX "RecycledItem_user_id_idx" ON "RecycledItem"("user_id");

-- CreateIndex
CREATE INDEX "RecycledItem_item_type_idx" ON "RecycledItem"("item_type");

-- CreateIndex
CREATE INDEX "RecycledItem_deleted_at_idx" ON "RecycledItem"("deleted_at");

-- CreateIndex
CREATE INDEX "RecycledItem_expires_at_idx" ON "RecycledItem"("expires_at");

-- CreateIndex
CREATE INDEX "RecycledItem_restored_at_idx" ON "RecycledItem"("restored_at");

-- CreateIndex
CREATE INDEX "DocumentVersion_project_id_idx" ON "DocumentVersion"("project_id");

-- CreateIndex
CREATE INDEX "DocumentVersion_user_id_idx" ON "DocumentVersion"("user_id");

-- CreateIndex
CREATE INDEX "DocumentVersion_created_at_idx" ON "DocumentVersion"("created_at");

-- CreateIndex
CREATE INDEX "AIUsage_user_id_idx" ON "AIUsage"("user_id");

-- CreateIndex
CREATE INDEX "AIUsage_month_year_idx" ON "AIUsage"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AIUsage_user_id_month_year_key" ON "AIUsage"("user_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_user_id_key" ON "Subscription"("user_id");

-- CreateIndex
CREATE INDEX "Subscription_user_id_idx" ON "Subscription"("user_id");

-- CreateIndex
CREATE INDEX "Subscription_plan_idx" ON "Subscription"("plan");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_lemonsqueezy_subscription_id_idx" ON "Subscription"("lemonsqueezy_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "OTPCode_user_id_key" ON "OTPCode"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "OTPCode_phone_number_key" ON "OTPCode"("phone_number");

-- CreateIndex
CREATE INDEX "OTPCode_user_id_idx" ON "OTPCode"("user_id");

-- CreateIndex
CREATE INDEX "OTPCode_phone_number_idx" ON "OTPCode"("phone_number");

-- CreateIndex
CREATE INDEX "OTPCode_expires_at_idx" ON "OTPCode"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "OTPCode_user_id_method_key" ON "OTPCode"("user_id", "method");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_dismissed_idx" ON "Notification"("dismissed");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_user_id_key" ON "NotificationSettings"("user_id");

-- CreateIndex
CREATE INDEX "NotificationSettings_user_id_idx" ON "NotificationSettings"("user_id");

-- CreateIndex
CREATE INDEX "FailedWebhook_event_name_idx" ON "FailedWebhook"("event_name");

-- CreateIndex
CREATE INDEX "FailedWebhook_created_at_idx" ON "FailedWebhook"("created_at");

-- CreateIndex
CREATE INDEX "FailedWebhook_retry_count_idx" ON "FailedWebhook"("retry_count");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_status_idx" ON "IdempotencyRecord"("status");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expires_at_idx" ON "IdempotencyRecord"("expires_at");

-- CreateIndex
CREATE INDEX "SubscriptionEventLog_event_type_idx" ON "SubscriptionEventLog"("event_type");

-- CreateIndex
CREATE INDEX "SubscriptionEventLog_user_id_idx" ON "SubscriptionEventLog"("user_id");

-- CreateIndex
CREATE INDEX "SubscriptionEventLog_status_idx" ON "SubscriptionEventLog"("status");

-- CreateIndex
CREATE INDEX "SubscriptionEventLog_created_at_idx" ON "SubscriptionEventLog"("created_at");

-- CreateIndex
CREATE INDEX "AlertLog_alert_type_idx" ON "AlertLog"("alert_type");

-- CreateIndex
CREATE INDEX "AlertLog_severity_idx" ON "AlertLog"("severity");

-- CreateIndex
CREATE INDEX "AlertLog_created_at_idx" ON "AlertLog"("created_at");

-- CreateIndex
CREATE INDEX "AIHistory_user_id_idx" ON "AIHistory"("user_id");

-- CreateIndex
CREATE INDEX "AIHistory_action_idx" ON "AIHistory"("action");

-- CreateIndex
CREATE INDEX "AIHistory_is_favorite_idx" ON "AIHistory"("is_favorite");

-- CreateIndex
CREATE INDEX "AIHistory_created_at_idx" ON "AIHistory"("created_at");

-- CreateIndex
CREATE INDEX "AIChatSession_user_id_idx" ON "AIChatSession"("user_id");

-- CreateIndex
CREATE INDEX "AIChatSession_project_id_idx" ON "AIChatSession"("project_id");

-- CreateIndex
CREATE INDEX "AIChatSession_is_active_idx" ON "AIChatSession"("is_active");

-- CreateIndex
CREATE INDEX "AIChatSession_created_at_idx" ON "AIChatSession"("created_at");

-- CreateIndex
CREATE INDEX "AIChatSession_last_message_at_idx" ON "AIChatSession"("last_message_at");

-- CreateIndex
CREATE INDEX "AIChatMessage_session_id_idx" ON "AIChatMessage"("session_id");

-- CreateIndex
CREATE INDEX "AIChatMessage_user_id_idx" ON "AIChatMessage"("user_id");

-- CreateIndex
CREATE INDEX "AIChatMessage_role_idx" ON "AIChatMessage"("role");

-- CreateIndex
CREATE INDEX "AIChatMessage_created_at_idx" ON "AIChatMessage"("created_at");

-- CreateIndex
CREATE INDEX "AIChatMessage_mode_idx" ON "AIChatMessage"("mode");

-- CreateIndex
CREATE INDEX "PaymentMethod_title_idx" ON "PaymentMethod"("title");

-- CreateIndex
CREATE INDEX "PaymentMethod_relevance_idx" ON "PaymentMethod"("relevance");

-- CreateIndex
CREATE INDEX "PaymentMethod_created_at_idx" ON "PaymentMethod"("created_at");

-- CreateIndex
CREATE INDEX "TeamChatMessage_workspace_id_idx" ON "TeamChatMessage"("workspace_id");

-- CreateIndex
CREATE INDEX "TeamChatMessage_project_id_idx" ON "TeamChatMessage"("project_id");

-- CreateIndex
CREATE INDEX "TeamChatMessage_parent_id_idx" ON "TeamChatMessage"("parent_id");

-- CreateIndex
CREATE INDEX "TeamChatMessage_created_at_idx" ON "TeamChatMessage"("created_at");

-- CreateIndex
CREATE INDEX "WorkspaceTask_workspace_id_idx" ON "WorkspaceTask"("workspace_id");

-- CreateIndex
CREATE INDEX "WorkspaceTask_creator_id_idx" ON "WorkspaceTask"("creator_id");

-- CreateIndex
CREATE INDEX "WorkspaceTask_status_idx" ON "WorkspaceTask"("status");

-- CreateIndex
CREATE INDEX "WorkspaceTask_parent_recurring_task_id_idx" ON "WorkspaceTask"("parent_recurring_task_id");

-- CreateIndex
CREATE INDEX "WorkspaceTask_is_recurring_idx" ON "WorkspaceTask"("is_recurring");

-- CreateIndex
CREATE INDEX "WorkspaceTask_due_date_idx" ON "WorkspaceTask"("due_date");

-- CreateIndex
CREATE INDEX "WorkspaceTask_project_id_idx" ON "WorkspaceTask"("project_id");

-- CreateIndex
CREATE INDEX "WorkspaceTask_is_template_idx" ON "WorkspaceTask"("is_template");

-- CreateIndex
CREATE INDEX "TaskDependency_task_id_idx" ON "TaskDependency"("task_id");

-- CreateIndex
CREATE INDEX "TaskDependency_depends_on_id_idx" ON "TaskDependency"("depends_on_id");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_task_id_depends_on_id_key" ON "TaskDependency"("task_id", "depends_on_id");

-- CreateIndex
CREATE INDEX "WorkspaceSubtask_task_id_idx" ON "WorkspaceSubtask"("task_id");

-- CreateIndex
CREATE INDEX "WorkspaceLabel_workspace_id_idx" ON "WorkspaceLabel"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceLabel_workspace_id_name_key" ON "WorkspaceLabel"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "TaskAttachment_task_id_idx" ON "TaskAttachment"("task_id");

-- CreateIndex
CREATE INDEX "WorkspaceCustomField_workspace_id_idx" ON "WorkspaceCustomField"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceCustomField_workspace_id_name_key" ON "WorkspaceCustomField"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "TaskCustomFieldValue_task_id_idx" ON "TaskCustomFieldValue"("task_id");

-- CreateIndex
CREATE INDEX "TaskCustomFieldValue_field_id_idx" ON "TaskCustomFieldValue"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCustomFieldValue_task_id_field_id_key" ON "TaskCustomFieldValue"("task_id", "field_id");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_task_id_idx" ON "TaskTimeEntry"("task_id");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_user_id_idx" ON "TaskTimeEntry"("user_id");

-- CreateIndex
CREATE INDEX "TaskAssignee_task_id_idx" ON "TaskAssignee"("task_id");

-- CreateIndex
CREATE INDEX "TaskAssignee_user_id_idx" ON "TaskAssignee"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_task_id_user_id_key" ON "TaskAssignee"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "TaskComment_task_id_idx" ON "TaskComment"("task_id");

-- CreateIndex
CREATE INDEX "TaskComment_user_id_idx" ON "TaskComment"("user_id");

-- CreateIndex
CREATE INDEX "Invoice_user_id_idx" ON "Invoice"("user_id");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_issued_at_idx" ON "Invoice"("issued_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserAppearanceSettings_user_id_key" ON "UserAppearanceSettings"("user_id");

-- CreateIndex
CREATE INDEX "UserAppearanceSettings_user_id_idx" ON "UserAppearanceSettings"("user_id");

-- CreateIndex
CREATE INDEX "AIPerformanceMetric_user_id_idx" ON "AIPerformanceMetric"("user_id");

-- CreateIndex
CREATE INDEX "AIPerformanceMetric_model_idx" ON "AIPerformanceMetric"("model");

-- CreateIndex
CREATE INDEX "AIPerformanceMetric_action_idx" ON "AIPerformanceMetric"("action");

-- CreateIndex
CREATE INDEX "AIPerformanceMetric_timestamp_idx" ON "AIPerformanceMetric"("timestamp");

-- CreateIndex
CREATE INDEX "AIFeedback_user_id_idx" ON "AIFeedback"("user_id");

-- CreateIndex
CREATE INDEX "AIFeedback_action_idx" ON "AIFeedback"("action");

-- CreateIndex
CREATE INDEX "AIFeedback_is_helpful_idx" ON "AIFeedback"("is_helpful");

-- CreateIndex
CREATE INDEX "AIFeedback_created_at_idx" ON "AIFeedback"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrivacySettings_user_id_key" ON "UserPrivacySettings"("user_id");

-- CreateIndex
CREATE INDEX "UserPrivacySettings_user_id_idx" ON "UserPrivacySettings"("user_id");

-- CreateIndex
CREATE INDEX "UserPrivacySettings_gdpr_consent_given_idx" ON "UserPrivacySettings"("gdpr_consent_given");

-- CreateIndex
CREATE INDEX "UserPrivacySettings_ferpa_consent_given_idx" ON "UserPrivacySettings"("ferpa_consent_given");

-- CreateIndex
CREATE INDEX "UserPrivacySettings_hipaa_consent_given_idx" ON "UserPrivacySettings"("hipaa_consent_given");

-- CreateIndex
CREATE INDEX "UserPrivacySettings_created_at_idx" ON "UserPrivacySettings"("created_at");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_idx" ON "AuditLog"("user_id");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- CreateIndex
CREATE INDEX "UserSession_user_id_idx" ON "UserSession"("user_id");

-- CreateIndex
CREATE INDEX "UserSession_last_active_idx" ON "UserSession"("last_active");

-- CreateIndex
CREATE INDEX "UserSession_is_current_idx" ON "UserSession"("is_current");

-- CreateIndex
CREATE INDEX "LoginHistory_user_id_idx" ON "LoginHistory"("user_id");

-- CreateIndex
CREATE INDEX "LoginHistory_created_at_idx" ON "LoginHistory"("created_at");

-- CreateIndex
CREATE INDEX "LoginHistory_status_idx" ON "LoginHistory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EditorSettings_user_id_key" ON "EditorSettings"("user_id");

-- CreateIndex
CREATE INDEX "EditorSettings_user_id_idx" ON "EditorSettings"("user_id");

-- CreateIndex
CREATE INDEX "EditorActivity_user_id_idx" ON "EditorActivity"("user_id");

-- CreateIndex
CREATE INDEX "EditorActivity_project_id_idx" ON "EditorActivity"("project_id");

-- CreateIndex
CREATE INDEX "EditorActivity_activity_type_idx" ON "EditorActivity"("activity_type");

-- CreateIndex
CREATE INDEX "EditorActivity_timestamp_idx" ON "EditorActivity"("timestamp");

-- CreateIndex
CREATE INDEX "EditorEvent_user_id_idx" ON "EditorEvent"("user_id");

-- CreateIndex
CREATE INDEX "EditorEvent_project_id_idx" ON "EditorEvent"("project_id");

-- CreateIndex
CREATE INDEX "EditorEvent_event_type_idx" ON "EditorEvent"("event_type");

-- CreateIndex
CREATE INDEX "EditorEvent_created_at_idx" ON "EditorEvent"("created_at");

-- CreateIndex
CREATE INDEX "UserFeedback_user_id_idx" ON "UserFeedback"("user_id");

-- CreateIndex
CREATE INDEX "UserFeedback_type_idx" ON "UserFeedback"("type");

-- CreateIndex
CREATE INDEX "UserFeedback_category_idx" ON "UserFeedback"("category");

-- CreateIndex
CREATE INDEX "UserFeedback_priority_idx" ON "UserFeedback"("priority");

-- CreateIndex
CREATE INDEX "UserFeedback_status_idx" ON "UserFeedback"("status");

-- CreateIndex
CREATE INDEX "UserFeedback_created_at_idx" ON "UserFeedback"("created_at");

-- CreateIndex
CREATE INDEX "FeedbackComment_feedback_id_idx" ON "FeedbackComment"("feedback_id");

-- CreateIndex
CREATE INDEX "FeedbackComment_user_id_idx" ON "FeedbackComment"("user_id");

-- CreateIndex
CREATE INDEX "FeedbackComment_is_internal_idx" ON "FeedbackComment"("is_internal");

-- CreateIndex
CREATE INDEX "FeedbackComment_created_at_idx" ON "FeedbackComment"("created_at");

-- CreateIndex
CREATE INDEX "Backup_user_id_idx" ON "Backup"("user_id");

-- CreateIndex
CREATE INDEX "Backup_status_idx" ON "Backup"("status");

-- CreateIndex
CREATE INDEX "Backup_type_idx" ON "Backup"("type");

-- CreateIndex
CREATE INDEX "Backup_created_at_idx" ON "Backup"("created_at");

-- CreateIndex
CREATE INDEX "SearchAlert_user_id_idx" ON "SearchAlert"("user_id");

-- CreateIndex
CREATE INDEX "Restore_user_id_idx" ON "Restore"("user_id");

-- CreateIndex
CREATE INDEX "Restore_status_idx" ON "Restore"("status");

-- CreateIndex
CREATE INDEX "Restore_started_at_idx" ON "Restore"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "BackupSchedule_user_id_key" ON "BackupSchedule"("user_id");

-- CreateIndex
CREATE INDEX "BackupSchedule_user_id_idx" ON "BackupSchedule"("user_id");

-- CreateIndex
CREATE INDEX "BackupSchedule_enabled_idx" ON "BackupSchedule"("enabled");

-- CreateIndex
CREATE INDEX "BackupSchedule_next_run_idx" ON "BackupSchedule"("next_run");

-- CreateIndex
CREATE INDEX "Export_user_id_idx" ON "Export"("user_id");

-- CreateIndex
CREATE INDEX "Export_project_id_idx" ON "Export"("project_id");

-- CreateIndex
CREATE INDEX "Export_file_type_idx" ON "Export"("file_type");

-- CreateIndex
CREATE INDEX "Export_status_idx" ON "Export"("status");

-- CreateIndex
CREATE INDEX "Export_created_at_idx" ON "Export"("created_at");

-- CreateIndex
CREATE INDEX "Export_collaboration_export_idx" ON "Export"("collaboration_export");

-- CreateIndex
CREATE INDEX "ContactRequest_email_idx" ON "ContactRequest"("email");

-- CreateIndex
CREATE INDEX "ContactRequest_status_idx" ON "ContactRequest"("status");

-- CreateIndex
CREATE INDEX "ContactRequest_created_at_idx" ON "ContactRequest"("created_at");

-- CreateIndex
CREATE INDEX "SupportTicket_user_id_idx" ON "SupportTicket"("user_id");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_created_at_idx" ON "SupportTicket"("created_at");

-- CreateIndex
CREATE INDEX "ResearchTopic_user_id_idx" ON "ResearchTopic"("user_id");

-- CreateIndex
CREATE INDEX "ResearchTopic_title_idx" ON "ResearchTopic"("title");

-- CreateIndex
CREATE INDEX "ResearchTopic_created_at_idx" ON "ResearchTopic"("created_at");

-- CreateIndex
CREATE INDEX "ResearchSource_user_id_idx" ON "ResearchSource"("user_id");

-- CreateIndex
CREATE INDEX "ResearchSource_topic_id_idx" ON "ResearchSource"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchPaper_externalId_key" ON "ResearchPaper"("externalId");

-- CreateIndex
CREATE INDEX "ResearchPaper_title_idx" ON "ResearchPaper"("title");

-- CreateIndex
CREATE INDEX "ResearchPaper_year_idx" ON "ResearchPaper"("year");

-- CreateIndex
CREATE INDEX "ResearchPaper_externalId_idx" ON "ResearchPaper"("externalId");

-- CreateIndex
CREATE INDEX "SavedPaper_user_id_idx" ON "SavedPaper"("user_id");

-- CreateIndex
CREATE INDEX "SavedPaper_paper_id_idx" ON "SavedPaper"("paper_id");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPaper_user_id_paper_id_key" ON "SavedPaper"("user_id", "paper_id");

-- CreateIndex
CREATE INDEX "VersionSchedule_project_id_idx" ON "VersionSchedule"("project_id");

-- CreateIndex
CREATE INDEX "VersionSchedule_enabled_idx" ON "VersionSchedule"("enabled");

-- CreateIndex
CREATE INDEX "VersionSchedule_next_run_idx" ON "VersionSchedule"("next_run");

-- CreateIndex
CREATE INDEX "TaskTracking_user_id_idx" ON "TaskTracking"("user_id");

-- CreateIndex
CREATE INDEX "TaskTracking_service_type_idx" ON "TaskTracking"("service_type");

-- CreateIndex
CREATE INDEX "TaskTracking_action_idx" ON "TaskTracking"("action");

-- CreateIndex
CREATE INDEX "TaskTracking_created_at_idx" ON "TaskTracking"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "WaitlistEntry_email_idx" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "WaitlistEntry_created_at_idx" ON "WaitlistEntry"("created_at");

-- CreateIndex
CREATE INDEX "WaitlistEntry_priority_idx" ON "WaitlistEntry"("priority");

-- CreateIndex
CREATE INDEX "WaitlistEntry_converted_idx" ON "WaitlistEntry"("converted");

-- CreateIndex
CREATE INDEX "DemoRequest_email_idx" ON "DemoRequest"("email");

-- CreateIndex
CREATE INDEX "DemoRequest_created_at_idx" ON "DemoRequest"("created_at");

-- CreateIndex
CREATE INDEX "FeatureRequest_category_idx" ON "FeatureRequest"("category");

-- CreateIndex
CREATE INDEX "FeatureRequest_priority_idx" ON "FeatureRequest"("priority");

-- CreateIndex
CREATE INDEX "FeatureRequest_created_at_idx" ON "FeatureRequest"("created_at");

-- CreateIndex
CREATE INDEX "DocumentTemplate_type_idx" ON "DocumentTemplate"("type");

-- CreateIndex
CREATE INDEX "DocumentTemplate_is_public_idx" ON "DocumentTemplate"("is_public");

-- CreateIndex
CREATE INDEX "DocumentTemplate_user_id_idx" ON "DocumentTemplate"("user_id");

-- CreateIndex
CREATE INDEX "DocumentTemplate_category_id_idx" ON "DocumentTemplate"("category_id");

-- CreateIndex
CREATE INDEX "DocumentTemplate_rating_idx" ON "DocumentTemplate"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchAnalysis_project_id_key" ON "ResearchAnalysis"("project_id");

-- CreateIndex
CREATE INDEX "ResearchAnalysis_project_id_idx" ON "ResearchAnalysis"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedAudio_project_id_key" ON "GeneratedAudio"("project_id");

-- CreateIndex
CREATE INDEX "GeneratedAudio_project_id_idx" ON "GeneratedAudio"("project_id");

-- CreateIndex
CREATE INDEX "_TaskLabels_B_index" ON "_TaskLabels"("B");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceView" ADD CONSTRAINT "WorkspaceView_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationToken" ADD CONSTRAINT "PushNotificationToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "ProjectToUser" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_documents" ADD CONSTRAINT "pdf_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorPresence" ADD CONSTRAINT "CollaboratorPresence_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorPresence" ADD CONSTRAINT "CollaboratorPresence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShareSettings" ADD CONSTRAINT "DocumentShareSettings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationActivity" ADD CONSTRAINT "CitationActivity_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "Citation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationActivity" ADD CONSTRAINT "CitationActivity_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationActivity" ADD CONSTRAINT "CitationActivity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecycledItem" ADD CONSTRAINT "RecycledItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsage" ADD CONSTRAINT "AIUsage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "SubscriptionToUser" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTPCode" ADD CONSTRAINT "OTPCode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIHistory" ADD CONSTRAINT "AIHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChatSession" ADD CONSTRAINT "AIChatSession_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChatSession" ADD CONSTRAINT "AIChatSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChatMessage" ADD CONSTRAINT "AIChatMessage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AIChatSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChatMessage" ADD CONSTRAINT "AIChatMessage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChatMessage" ADD CONSTRAINT "TeamChatMessage_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChatMessage" ADD CONSTRAINT "TeamChatMessage_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChatMessage" ADD CONSTRAINT "TeamChatMessage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChatMessage" ADD CONSTRAINT "TeamChatMessage_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "TeamChatMessage"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorkspaceTask" ADD CONSTRAINT "WorkspaceTask_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceTask" ADD CONSTRAINT "WorkspaceTask_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceTask" ADD CONSTRAINT "WorkspaceTask_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceTask" ADD CONSTRAINT "WorkspaceTask_parent_recurring_task_id_fkey" FOREIGN KEY ("parent_recurring_task_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_depends_on_id_fkey" FOREIGN KEY ("depends_on_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSubtask" ADD CONSTRAINT "WorkspaceSubtask_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceLabel" ADD CONSTRAINT "WorkspaceLabel_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceCustomField" ADD CONSTRAINT "WorkspaceCustomField_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCustomFieldValue" ADD CONSTRAINT "TaskCustomFieldValue_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCustomFieldValue" ADD CONSTRAINT "TaskCustomFieldValue_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "WorkspaceCustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppearanceSettings" ADD CONSTRAINT "UserAppearanceSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPerformanceMetric" ADD CONSTRAINT "AIPerformanceMetric_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIFeedback" ADD CONSTRAINT "AIFeedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrivacySettings" ADD CONSTRAINT "UserPrivacySettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorSettings" ADD CONSTRAINT "EditorSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorActivity" ADD CONSTRAINT "EditorActivity_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorActivity" ADD CONSTRAINT "EditorActivity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorEvent" ADD CONSTRAINT "EditorEvent_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorEvent" ADD CONSTRAINT "EditorEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeedback" ADD CONSTRAINT "UserFeedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackComment" ADD CONSTRAINT "FeedbackComment_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "UserFeedback"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackComment" ADD CONSTRAINT "FeedbackComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchAlert" ADD CONSTRAINT "SearchAlert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restore" ADD CONSTRAINT "Restore_backup_id_fkey" FOREIGN KEY ("backup_id") REFERENCES "Backup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restore" ADD CONSTRAINT "Restore_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupSchedule" ADD CONSTRAINT "BackupSchedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicketToUser" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchTopic" ADD CONSTRAINT "ResearchTopic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "ResearchTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPaper" ADD CONSTRAINT "SavedPaper_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "ResearchPaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPaper" ADD CONSTRAINT "SavedPaper_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionSchedule" ADD CONSTRAINT "VersionSchedule_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTracking" ADD CONSTRAINT "TaskTracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchAnalysis" ADD CONSTRAINT "ResearchAnalysis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAudio" ADD CONSTRAINT "GeneratedAudio_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskLabels" ADD CONSTRAINT "_TaskLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "WorkspaceLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskLabels" ADD CONSTRAINT "_TaskLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkspaceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
