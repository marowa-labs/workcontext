"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { apiClient } from "../../../lib/utils/apiClient";
import { Users, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AcceptInvitePage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Since there's no direct GET endpoint for invitation by token,
    // we'll fetch pending invitations and find the matching one
    const fetchInvitation = async () => {
      try {
        const invitations = await apiClient.get(
          "/api/workspaces/invitations/pending",
        );
        const matchingInvite = invitations.find(
          (inv: any) => inv.token === token,
        );

        if (matchingInvite) {
          setInvitation(matchingInvite);
        } else {
          setError("Invitation not found or has expired");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await apiClient.post(`/api/workspaces/invitations/${token}/accept`, {});
      setSuccess(true);

      // Redirect to workspace after a brief delay
      setTimeout(() => {
        router.push(`/dashboard/workspace/${invitation.workspace_id}/projects`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      await apiClient.post(`/api/workspaces/invitations/${token}/decline`, {});
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to decline invitation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invitation Accepted!</h1>
          <p className="text-slate-600">Redirecting to workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <Users className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Workspace Invitation</h1>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-slate-700">You've been invited to join:</p>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h2 className="font-semibold text-lg">
              {invitation.workspace.name}
            </h2>
            {invitation.workspace.description && (
              <p className="text-sm text-slate-600 mt-1">
                {invitation.workspace.description}
              </p>
            )}
            <p className="text-sm text-slate-600 mt-2">
              Role:{" "}
              <span className="font-medium capitalize">{invitation.role}</span>
            </p>
            <p className="text-sm text-slate-600">
              Invited by:{" "}
              {invitation.inviter.full_name || invitation.inviter.email}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            Expires: {new Date(
              invitation.expires_at,
            ).toLocaleDateString()} at{" "}
            {new Date(invitation.expires_at).toLocaleTimeString()}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1"
            disabled={accepting}>
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={accepting}>
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accepting...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
