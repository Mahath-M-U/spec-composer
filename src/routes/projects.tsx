import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/spec-composer/discovery";
export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "SpecComposer-My designs" },
      {
        name: "description",
        content: "Open recent Spec Composer projects saved in this browser.",
      },
      { property: "og:title", content: "SpecComposer-My designs" },
      {
        property: "og:description",
        content: "Open recent Spec Composer projects saved in this browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});
