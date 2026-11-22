import {
  GOOGLE_PRIVACY_POLICY_URL,
  YOUTUBE_TERMS_AGREEMENT_STATEMENT,
  YOUTUBE_TERMS_OF_SERVICE_URL,
} from "../src/youtubeCompliance";

export function YoutubeComplianceFooter() {
  return (
    <footer className="youtube-compliance">
      <p className="youtube-compliance-agreement">{YOUTUBE_TERMS_AGREEMENT_STATEMENT}</p>
      <nav className="youtube-compliance-links" aria-label="Legal">
        <a href={YOUTUBE_TERMS_OF_SERVICE_URL}>YouTube Terms of Service</a>
        <span aria-hidden="true"> · </span>
        <a href={GOOGLE_PRIVACY_POLICY_URL}>Google Privacy Policy</a>
      </nav>
    </footer>
  );
}