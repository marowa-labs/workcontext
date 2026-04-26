import EditorPage from "../../../pages/dashboard/editor/[projectId]/page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await params; // Required for Next.js 15+ type compatibility
  return <EditorPage />;
}
