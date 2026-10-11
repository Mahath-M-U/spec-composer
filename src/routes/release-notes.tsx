import { createFileRoute } from "@tanstack/react-router";
import { ReleaseNotesPage } from "@/features/spec-composer/release-notes-page";

export const Route = createFileRoute("/release-notes")({
  head: () => ({
    meta: [
      { title: "Spec Composer – What's new" },
      {
        name: "description",
        content:
          "Release notes and new features in each version of Spec Composer.",
      },
    ],
  }),
  component: ReleaseNotesPage,
});
