import { createFileRoute } from "@tanstack/react-router";
import { Editor } from "@/features/spec-composer/Editor";
import { EditorSkeleton } from "@/features/spec-composer/editor-skeleton";
export const Route = createFileRoute("/design/$projectId")({
  head: () => ({
    meta: [
      { title: "SpecComposer-Editor" },
      {
        name: "description",
        content:
          "Compose a semantic poster and export its prompt or structured specification.",
      },
      { property: "og:title", content: "SpecComposer-Editor" },
      {
        property: "og:description",
        content:
          "Compose a semantic poster and export its prompt or structured specification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorRoute,
  pendingComponent: EditorSkeleton,
});
function EditorRoute() {
  const { projectId } = Route.useParams();
  return <Editor projectId={projectId} />;
}
