import { describe, expect, it } from "vitest";
import {
  GOOGLE_PRIVACY_POLICY_URL,
  YOUTUBE_TERMS_AGREEMENT_STATEMENT,
  YOUTUBE_TERMS_OF_SERVICE_URL,
} from "./youtubeCompliance";

describe("YouTube API compliance links", () => {
  it("uses the official YouTube Terms of Service URL unchanged", () => {
    expect(YOUTUBE_TERMS_OF_SERVICE_URL).toBe("https://www.youtube.com/t/terms");
  });

  it("uses the official Google Privacy Policy URL unchanged", () => {
    expect(GOOGLE_PRIVACY_POLICY_URL).toBe("https://policies.google.com/privacy");
  });

  it("states that using the site means agreeing to the YouTube Terms of Service", () => {
    expect(YOUTUBE_TERMS_AGREEMENT_STATEMENT).toBe(
      "By using this site, you agree to the YouTube Terms of Service.",
    );
  });
});