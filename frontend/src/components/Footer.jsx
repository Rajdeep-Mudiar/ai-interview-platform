import { getUserSession } from "../utils/auth";

export default function Footer() {
  const session = getUserSession();
  const isRecruiter = session?.role === "recruiter";

  return (
    <footer className="cb-footer">
      <div className="cb-footer__inner">
        <div className="cb-footer__grid">
          <div className="space-y-2">
            <div className="cb-proctorTitle">CareBridge</div>
            <p className="cb-proctorSubtitle">
              Resume screening, interview automation, and integrity-aware
              evaluation—built for modern hiring.
            </p>
          </div>
          <div className="cb-footerCol md:justify-self-center">
            <div className="cb-footer__heading">Product</div>
            <a className="cb-footer__link" href="/resume-analysis">
              Resume Analysis
            </a>
            <a className="cb-footer__link" href="/resume-builder">
              Resume Builder
            </a>
            {isRecruiter && (
              <a className="cb-footer__link" href="/recruiter-dashboard">
                Recruiter dashboard
              </a>
            )}
          </div>
          <div className="cb-footerCol md:justify-self-end">
            <div className="cb-footer__heading">Support</div>
            <span>Docs (coming soon)</span>
            <span>Security (coming soon)</span>
          </div>
        </div>
        <div className="cb-footer__bottom">
          <span>© {new Date().getFullYear()} CareBridge</span>
          <span>Built with FastAPI + React</span>
        </div>
      </div>
    </footer>
  );
}
