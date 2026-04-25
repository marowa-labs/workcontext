import axios from "axios";

const API_URL = "http://localhost:3001/api";
// Extracted from terminal logs - still valid for ~40 mins
const AUTH_TOKEN =
  "eyJhbGciOiJFUzI1NiIsImtpZCI6IjA0MDljNWUyLTg1NTAtNDk5OC1hODBjLThkYjNlYWU3ZjAxZiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL21xZGVxZWZ0c2t5Z2FmeXJuZ3V3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiYTA5ODM3YS04ZGU5LTRmOTUtOTQ5OC04OWNiYmRjNjQ3NmYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcwNDg0MzkxLCJpYXQiOjE3NzA0ODA3OTEsImVtYWlsIjoiY2FzaHRlY2hkaWdpdGFsQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJjYXNodGVjaGRpZ2l0YWxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkNhc2ggVGVjaCIsIm90cF9tZXRob2QiOiJzbXMiLCJwaG9uZV9udW1iZXIiOiIrOTE5MDYzNTg2NTY4IiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwbGFuIjoiZnJlZSIsInJvbGUiOiJ1c2VyIiwic3ViIjoiYmEwOTgzN2EtOGRlOS00Zjk1LTk0OTgtODljYmJkYzY0NzZmIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzA0ODA3OTF9XSwic2Vzc2lvbl9pZCI6IjgyZDc3NWQyLWY3ODAtNGUwNS04MTk3LWIyZWEyNzA3NjVjOSIsImlzX2Fub255bW91cyI6ZmFsc2V9.CQbnKuPCoGkuqdCdwr23yC5kHEQZoWbA3kkilBsz1kBgyvky-NUoo587f6ENCp_rPTTB17ugd3utUSubwjnbyA";

async function verifyTimeTracking() {
  try {
    const headers = { Authorization: `Bearer ${AUTH_TOKEN}` };
    console.log("1. Using session token from logs...");

    // Get current user ID from token (decoded sub)
    const userId = "ba09837a-8de9-4f95-9498-89cbbdc6476f";
    console.log("   User ID:", userId);

    // Get a workspace
    console.log("\n2. Fetching workspaces...");
    const workspacesRes = await axios.get(`${API_URL}/workspaces`, { headers });
    const workspace =
      workspacesRes.data.find((w: any) => w.owner_id === userId) ||
      workspacesRes.data[0];

    if (!workspace) {
      console.error("   No workspaces found.");
      return;
    }
    const workspaceId = workspace.id;
    console.log("   Using Workspace ID:", workspaceId);

    console.log("\n3. Fetching tasks...");
    const tasksRes = await axios.get(
      `${API_URL}/workspaces/tasks?workspaceId=${workspaceId}`,
      { headers },
    );
    const tasks = tasksRes.data.tasks || [];
    const task = tasks[0];

    let taskId: string;
    if (!task) {
      console.log("   No tasks found. Creating a test task...");
      const newTaskRes = await axios.post(
        `${API_URL}/workspaces/tasks`,
        {
          workspaceId,
          title: "Test Task for Time Tracking",
          description: "Created by verification script",
          status: "todo",
          priority: "medium",
        },
        { headers },
      );
      taskId = newTaskRes.data.task.id;
      console.log("   Test Task Created:", taskId);
    } else {
      taskId = task.id;
      console.log("   Using Task ID:", taskId, "(" + task.title + ")");
    }

    // --- CLEANUP ANY EXISTING TIMER ---
    console.log("\n4. Checking for active timers...");
    const activeCheck = await axios.get(
      `${API_URL}/workspaces/tasks/time/active`,
      { headers },
    );
    if (activeCheck.data.activeTimer) {
      console.log(
        "   Stopping existing timer:",
        activeCheck.data.activeTimer.id,
      );
      await axios.post(
        `${API_URL}/workspaces/tasks/time/stop/${activeCheck.data.activeTimer.id}`,
        {},
        { headers },
      );
    }

    // --- TEST START TIMER ---
    console.log("\n5. Testing POST /time/start...");
    const startRes = await axios.post(
      `${API_URL}/workspaces/tasks/${taskId}/time/start`,
      {
        description: "Automated test session",
      },
      { headers },
    );
    console.log("   ✅ Timer started. Entry ID:", startRes.data.id);

    // --- TEST GET ACTIVE TIMER ---
    console.log("\n6. Testing GET /time/active...");
    const activeRes = await axios.get(
      `${API_URL}/workspaces/tasks/time/active`,
      { headers },
    );
    if (
      activeRes.data.activeTimer &&
      activeRes.data.activeTimer.task_id === taskId
    ) {
      console.log(
        "   ✅ Active timer confirmed for task:",
        activeRes.data.activeTimer.task.title,
      );
    } else {
      console.error("   ❌ Active timer not found or incorrect.");
    }

    // Wait 2 seconds
    console.log("   Waiting 2 seconds...");
    await new Promise((r) => setTimeout(r, 2000));

    // --- TEST STOP TIMER ---
    console.log("\n7. Testing POST /time/stop...");
    const stopRes = await axios.post(
      `${API_URL}/workspaces/tasks/time/stop/${startRes.data.id}`,
      {},
      { headers },
    );
    console.log(
      "   ✅ Timer stopped. Duration:",
      stopRes.data.duration,
      "minutes",
    );

    // --- TEST MANUAL LOG ---
    console.log("\n8. Testing POST /time/log (Manual Entry)...");
    const logRes = await axios.post(
      `${API_URL}/workspaces/tasks/${taskId}/time/log`,
      {
        start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        end_time: new Date().toISOString(),
        description: "Manual log test",
      },
      { headers },
    );
    console.log(
      "   ✅ Manual entry logged. Duration:",
      logRes.data.duration,
      "minutes",
    );

    // --- TEST GET TOTALS ---
    console.log("\n9. Testing GET /time/total...");
    const totalRes = await axios.get(
      `${API_URL}/workspaces/tasks/${taskId}/time/total`,
      { headers },
    );
    console.log(
      "   ✅ Total time for task:",
      totalRes.data.totalMinutes,
      "minutes (" + totalRes.data.totalHours + " hours)",
    );
  } catch (error: any) {
    if (error.response) {
      console.error(
        "❌ API Error:",
        error.response.status,
        error.response.data,
      );
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

verifyTimeTracking();
