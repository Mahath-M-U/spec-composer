import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DiscoveryShell } from "./discovery";
import {
  LATEST_RELEASE,
  PREVIOUS_RELEASES,
  RELEASE_CADENCE,
  type ReleaseItem,
  type ReleaseNote,
} from "./release-notes";

function ReleaseItems({ items }: { items: readonly ReleaseItem[] }) {
  return (
    <ul className="release-notes-list">
      {items.map(({ emoji, text }) => (
        <li key={text}>
          <span className="release-notes-emoji" aria-hidden="true">
            {emoji}
          </span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function ReleaseBody({
  release,
  headingLevel,
}: {
  release: ReleaseNote;
  headingLevel: "h2" | "h4";
}) {
  const Heading = headingLevel;
  const headingClassName =
    headingLevel === "h4" ? "release-notes-group-label" : undefined;
  return (
    <>
      {release.features.length > 0 && (
        <section>
          <Heading className={headingClassName}>New features</Heading>
          <ReleaseItems items={release.features} />
        </section>
      )}
      {release.improvements.length > 0 && (
        <section>
          <Heading className={headingClassName}>Other improvements</Heading>
          <ReleaseItems items={release.improvements} />
        </section>
      )}
      {release.notes && (
        <p className="release-notes-notes">
          <strong>Notes:</strong> {release.notes}
        </p>
      )}
    </>
  );
}

export function ReleaseNotesPage() {
  return (
    <DiscoveryShell>
      <div className="discovery-content legal-page release-notes-page">
        <header className="legal-page-heading">
          <Link to="/" className="release-notes-back">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to home
          </Link>
          <p className="eyebrow">RELEASE NOTES</p>
          <h1>What&apos;s new in this update</h1>
          <p className="release-notes-meta">
            <span>Version {LATEST_RELEASE.version}</span>
            <time dateTime={LATEST_RELEASE.date}>{LATEST_RELEASE.date}</time>
            <span className="sidebar-soon-badge">Current</span>
          </p>
          <p>{RELEASE_CADENCE}</p>
          <a href="#version-history" className="release-notes-history-link">
            View version history
          </a>
        </header>
        <ReleaseBody release={LATEST_RELEASE} headingLevel="h2" />
        <section
          id="version-history"
          className="release-notes-history"
          aria-labelledby="version-history-heading"
        >
          <h2 id="version-history-heading">Previous versions</h2>
          {PREVIOUS_RELEASES.length === 0 ? (
            <p className="release-notes-empty">No earlier releases yet.</p>
          ) : (
            PREVIOUS_RELEASES.map((release) => (
              <article key={release.version} className="release-notes-past">
                <h3>Version {release.version}</h3>
                <p className="release-notes-meta">
                  <time dateTime={release.date}>{release.date}</time>
                </p>
                <ReleaseBody release={release} headingLevel="h4" />
              </article>
            ))
          )}
        </section>
      </div>
    </DiscoveryShell>
  );
}
