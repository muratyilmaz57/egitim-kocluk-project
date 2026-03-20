import Link from "next/link";

type ModalFrameProps = {
  title: string;
  subtitle: string;
  closeHref: string;
  children: React.ReactNode;
};

export function ModalFrame({ title, subtitle, closeHref, children }: ModalFrameProps) {
  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <Link aria-label="Kapat" className="modal-backdrop" href={closeHref} />
      <div className="modal-card">
        <div className="modal-card__header">
          <div>
            <h2 id="modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <Link aria-label="Kapat" className="modal-card__close" href={closeHref}>
            <span aria-hidden="true">×</span>
          </Link>
        </div>
        <div className="modal-card__body">{children}</div>
      </div>
    </div>
  );
}
