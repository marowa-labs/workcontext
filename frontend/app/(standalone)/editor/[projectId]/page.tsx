import EditorPage from "../../../pages/dashboard/editor/[projectId]/page";
import { SearchAlertsManager } from "../../../components/editor/SearchAlertsManager";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <>
      <SearchAlertsManager />
      <EditorPage />
    </>
  );
}
