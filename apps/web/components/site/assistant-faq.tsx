import { env } from "@amc/server/env";
import { assertAssistantFaq, assistantFaqLd, type AssistantFaqItem } from "@/lib/assistant-faq/types";
import { JsonLd } from "./json-ld";
import styles from "./assistant-faq.module.css";

export function AssistantFaq({ url, items, title = "Questions for your next step", id = "assistant-faq", image }: {
  url: string; items: readonly AssistantFaqItem[]; title?: string; id?: string; image?: React.ReactNode;
}) {
  assertAssistantFaq(items);
  return <section id={id} className={styles.section} aria-labelledby={`${id}-title`} data-assistant-faq={url}>
    {id !== "assistant-faq" ? <span id="assistant-faq" className="sr-only" aria-hidden="true" /> : null}
    <JsonLd data={assistantFaqLd(env().WEB_URL, url, items)} />
    <header className={styles.heading}><p className="type-overline text-brand-red">Ask a clear question. Get a clear answer.</p><h2 id={`${id}-title`} className="type-display-l text-text">{title}</h2></header>
    <div className={image ? styles.withImage : undefined}>
      {image ? <div className={styles.image}>{image}</div> : null}
      <div className={styles.questions}>{items.map((item, index) => <article key={item.question} className={styles.item} data-content-inset="card" data-assistant-faq-item="">
        <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <h3>{item.question}</h3>
        <p>{item.answer}</p>
      </article>)}</div>
    </div>
  </section>;
}
