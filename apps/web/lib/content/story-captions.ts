/** Visible photo labels come from the reader's task, never from an image's alt description. */
export function storyCaption({ heading, url, topic }: { heading?: string; url?: string; topic?: string }): string | undefined {
  const section = heading?.trim();
  if (section) return section;
  const path = url?.split(/[?#]/, 1)[0];
  if (path === "/which-companies-receive-my-request/") return "You choose your contact limit.";
  if (path === "/report-a-concern/") return "Tell us what happened.";
  return topic?.trim() || undefined;
}
