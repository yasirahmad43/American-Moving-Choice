import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SurveyFormNotice } from "./form-notice.tsx";

describe("visible survey preparation failures", () => {
  it("renders a form-level failure as an escaped, accessible notice with the existing focus target", () => {
    const html = renderToStaticMarkup(createElement(SurveyFormNotice, { alert: null, formError: 'Security check failed <img src=x onerror="unsafe()"> & please retry.' }));
    expect(html).toContain('id="form-alert" tabindex="-1" class="focus:outline-none"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("We couldn&#x27;t continue");
    expect(html).toContain("Security check failed &lt;img src=x onerror=&quot;unsafe()&quot;&gt; &amp; please retry.");
    expect(html).not.toContain("<img");
  });
  it("preserves explicit notice priority and renders no empty global notice", () => {
    const html = renderToStaticMarkup(createElement(SurveyFormNotice, { alert: { tone: "warning", title: "Review your request details", body: "Check the details before sending." }, formError: "Preparation failed before this notice." }));
    expect(html).toContain("Review your request details"); expect(html).toContain("Check the details before sending.");
    expect(html).toContain('role="status"'); expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("Preparation failed before this notice.");
    expect(renderToStaticMarkup(createElement(SurveyFormNotice, { alert: null }))).toBe("");
  });
});
