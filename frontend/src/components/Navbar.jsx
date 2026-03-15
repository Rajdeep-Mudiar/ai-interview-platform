import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "./ui/Button";
import { cn } from "./ui/cn";
import { getUserSession, clearUserSession } from "../utils/auth";

const candidateNavItems = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "Jobs" },
<<<<<<< HEAD
  { to: "/resume-analysis", label: "Resume Analysis" },
  { to: "/resume-builder", label: "Resume Builder" },
  { to: "/dashboard", label: "Candidate Dashboard" },
=======
  { to: "/dashboard", label: "Dashboard" },
  { to: "/leaderboard", label: "Leaderboard" },
];

const recruiterNavItems = [
  { to: "/", label: "Home" },
  { to: "/recruiter-dashboard", label: "Dashboard" },
  { to: "/reevaluate", label: "Re-evaluate" },
  { to: "/leaderboard", label: "Leaderboard" },
>>>>>>> f8fff86 (changes)
];

const recruiterNavItems = [
  { to: "/", label: "Home" },
  { to: "/recruiter-dashboard", label: "Dashboard" },
  { to: "/candidates", label: "Candidates" },
];

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "cb-navlink",
          isActive && "cb-navlink--active",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const session = getUserSession();
  const isRecruiter = session?.role === "recruiter";

  const handleLogout = () => {
    clearUserSession();
    window.location.href = "/login";
  };

  const navItems = isRecruiter ? recruiterNavItems : candidateNavItems;

  return (
    <header className="cb-navbar">
      <div className="cb-container">
        <div className="cb-navbar__row">
          <Link to="/" className="cb-brand">
            <div className="cb-brand__mark">
              <span className="cb-markText">AI</span>
            </div>
            <div className="leading-tight">
              <div className="cb-brand__title">CareBridge</div>
              <div className="cb-brand__subtitle">AI Hiring Platform</div>
            </div>
          </Link>

          <nav className="cb-nav">
            {navItems.map((i) => (
              <NavItem key={i.to} to={i.to}>
                {i.label}
              </NavItem>
            ))}
          </nav>

          <div className="cb-navbar__actions">
            {session && (
              <span className="hidden text-sm text-slate-600 sm:inline">
                {session.name} ({session.role})
              </span>
            )}
            <Button
              as={Link}
              to={session ? "/login" : "/login"}
              onClick={session ? handleLogout : undefined}
              variant="secondary"
              size="sm"
              className="cb-hide-sm"
            >
              {session ? "Logout" : "Sign in"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="cb-mobileToggle"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </Button>
          </div>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="cb-mobileNav">
          <div className="cb-mobileNav__inner">
            <div className="cb-mobileNav__grid">
              {navItems.map((i) => (
                <NavItem key={i.to} to={i.to} onClick={() => setOpen(false)}>
                  {i.label}
                </NavItem>
              ))}
              <div className="cb-mobileNav__cta">
                <Button
                  as={Link}
                  to="/login"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    if (session) {
                      handleLogout();
                    } else {
                      setOpen(false);
                    }
                  }}
                >
                  {session ? "Logout" : "Sign in"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
