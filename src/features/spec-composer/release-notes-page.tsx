import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DiscoveryShell } from "./discovery";
import { RELEASES, LATEST_RELEASE } from "./release-notes";

export function ReleaseNotesPage() {
  return (
    <DiscoveryShell>
      <div className="discovery-content legal-page release-notes-page">
        <header className="legal-page-heading">
          <Link to="/" className="release-notes-back">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to home
          </Link>
          <p className="eyebrow">WHAT&apos;S NEW</p>
          <h1>Release notes</h1>
          <p>Short notes on what changed in each version of Spec Composer.</p>
        </header>
        {RELEASES.map(({ version, date, highlights }) => {
          const isLatest = version === LATEST_RELEASE.version;
          const headingId = `release-${version}`;
          return (
            <section key={version} aria-labelledby={headingId}>
              <h2 id={headingId}>Version {version}</h2>
              <p className="release-notes-meta">
                <time dateTime={date}>{date}</time>
                {isLatest && (
                  <span className="sidebar-soon-badge">Current</span>
                )}
              </p>
              <ul className="release-notes-list">
                {highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </DiscoveryShell>
  );
}
