import clsx from "clsx";
import styles from "./docs.module.css";

export default function DocsFooterBranding({
  className,
  refSource = "public-space",
}: {
  className?: string;
  refSource?: string;
}) {
  return (
    <footer className={clsx(styles.footer, className)}>
      <a
        className={styles.footerBranding}
        href={`https://github.com/mitchelljfranklin/mitch-wiki?ref=${refSource}`}
        target="_blank"
        rel="noreferrer"
      >
        Powered by Mitch-Wiki
      </a>
    </footer>
  );
}
