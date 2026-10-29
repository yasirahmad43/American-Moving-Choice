interface GuideSection { id: string; heading: string }

/** Native disclosure keeps the complete reading route usable without JavaScript on small screens. */
export function GuideContents({ sections, hasFacts, hasFaq, className }: { sections: readonly GuideSection[]; hasFacts: boolean; hasFaq: boolean; className?: string }) {
  if (!sections.length && !hasFacts && !hasFaq) return null;
  return <details className={className} data-guide-contents="">
    <summary><span>Jump to any section</span><span aria-hidden="true">+</span></summary>
    <nav aria-label="All guide sections">
      <ol>{sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{section.heading}</span></a></li>)}</ol>
      <ul>
        {hasFacts ? <li><a href="#facts-and-sources">Facts and sources</a></li> : null}
        {hasFaq ? <li><a href="#faq">Questions about this page</a></li> : null}
        <li><a href="#sources-and-methodology">Sources and editorial notes</a></li>
      </ul>
    </nav>
  </details>;
}
