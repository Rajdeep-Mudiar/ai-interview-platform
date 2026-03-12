import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { getUserSession } from "../utils/auth";

export default function VideoLanding() {
  const navigate = useNavigate();
  const session = getUserSession();
  const isRecruiter = session?.role === "recruiter";

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Welcome to CareBridge
        </h1>
        <p className="mt-3 text-pretty text-base text-slate-600 sm:text-lg">
          Run the AI interview flow or jump into the recruiter dashboard. The
          video below will play automatically.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        <div className="cb-videoBlendWrap">
          <video
            className="cb-videoBlend h-[60vh] sm:h-[70vh]"
            src="/videos/login.mp4"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            controlsList="nodownload noplaybackrate noremoteplayback"
            preload="auto"
            disablePictureInPicture
            aria-hidden="true"
            tabIndex={-1}
          />

          <div className="cb-videoBlendOverlay" />

          <div className="absolute bottom-5 left-5 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/interview-flow")}>
              Start interview
            </Button>
            {isRecruiter && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/recruiter-dashboard")}
              >
                Open recruiter
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
