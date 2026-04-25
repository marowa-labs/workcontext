import axios from "axios";

// Configuration
const API_URL = "http://localhost:3001/api";
const TOKEN =
  "eyJhbGciOiJFUzI1NiIsImtpZCI6IjA0MDljNWUyLTg1NTAtNDk5OC1hODBjLThkYjNlYWU3ZjAxZiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL21xZGVxZWZ0c2t5Z2FmeXJuZ3V3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiYTA5ODM3YS04ZGU5LTRmOTUtOTQ5OC04OWNiYmRjNjQ3NmYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcwNDg0MzkxLCJpYXQiOjE3NzA0ODA3OTEsImVtYWlsIjoiY2FzaHRlY2hkaWdpdGFsQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJjYXNodGVjaGRpZ2l0YWxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkNhc2ggVGVjaCIsIm90cF9tZXRob2QiOiJzbXMiLCJwaG9uZV9udW1iZXIiOiIrOTE5MDYzNTg2NTY4IiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwbGFuIjoiZnJlZSIsInJvbGUiOiJ1c2VyIiwic3ViIjoiYmEwOTgzN2EtOGRlOS00Zjk1LTk0OTgtODljYmJkYzY0NzZmIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzA0ODA3OTF9XSwic2Vzc2lvbl9pZCI6IjgyZDc3NWQyLWY3ODAtNGUwNS04MTk3LWIyZWEyNzA3NjVjOSIsImlzX2Fub255bW91cyI6ZmFsc2V9.CQbnKuPCoGkuqdCdwr23yC5kHEQZoWbA3kkilBsz1kBgyvky-NUoo587f6ENCp_rPTTB17ugd3utUSubwjnbyA";

const apiClient = axios.create({
  baseURL: `${API_URL}/workspaces/tasks`,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function runVerification() {
  console.log("🚀 Starting Task Templates Verification...");

  try {
    // 0. Get Workspace ID
    console.log("\n0. Retrieving workspace...");
    const wsRes = await axios.get(`${API_URL}/workspaces`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const WORKSPACE_ID = wsRes.data[0].id;
    console.log(`   Using Workspace: ${WORKSPACE_ID}`);
    // 1. Create a Master Task
    console.log("\n1. Creating Master Task...");
    const taskResponse = await apiClient.post("/", {
      workspaceId: WORKSPACE_ID,
      title: "Master Research Protocol",
      description: "Standard operating procedure for lab work",
      priority: "high",
    });
    const masterTask = taskResponse.data.task;
    console.log(`✅ Created Task: ${masterTask.id}`);

    // 2. Add subtasks to Master
    console.log("\n2. Adding subtasks...");
    await axios.post(
      "http://localhost:3001/api/workspaces/tasks/subtasks",
      {
        taskId: masterTask.id,
        title: "Peer review phase",
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    );
    console.log("✅ Added subtask");

    // 3. Save as Template
    console.log("\n3. Saving as Template...");
    const templateResponse = await apiClient.post("/templates/save", {
      taskId: masterTask.id,
      templateName: "Core Lab Blueprint",
      category: "Research",
    });
    const template = templateResponse.data.template;
    console.log(
      `✅ Saved Template: ${template.id} (${template.template_name})`,
    );

    // 4. Verify in Library
    console.log("\n4. Verifying in Library...");
    const libResponse = await apiClient.get(
      `/templates/all?workspaceId=${WORKSPACE_ID}`,
    );
    const templates = libResponse.data.templates;
    const found = templates.find((t: any) => t.id === template.id);
    if (!found) throw new Error("Template not found in library!");
    console.log("✅ Template found in library");

    // 5. Create from Template
    console.log("\n5. Creating task from blueprint...");
    const fromTemplateResponse = await apiClient.post("/from-template", {
      templateId: template.id,
      overrides: { title: "Monday Lab Session" },
    });
    const finalTask = fromTemplateResponse.data.task;
    console.log(
      `✅ Created from Template: ${finalTask.id} (${finalTask.title})`,
    );

    // 6. Verify subtasks copied
    console.log("\n6. Verifying subtasks copied...");
    const detailResponse = await apiClient.get(`/${finalTask.id}`);
    const detail = detailResponse.data.task;
    if (detail.subtasks.length === 0) throw new Error("Subtasks did not copy!");
    console.log(`✅ Verified ${detail.subtasks.length} subtasks copied`);

    console.log("\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨");
  } catch (error: any) {
    console.error("\n❌ Verification failed!");
    if (error.response) {
      console.error(
        JSON.stringify(
          {
            status: error.response.status,
            data: error.response.data,
          },
          null,
          2,
        ),
      );
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runVerification();
