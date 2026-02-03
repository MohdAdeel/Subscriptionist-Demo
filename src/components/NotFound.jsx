import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";

const NotFound = ({
  title = "Page not found",
  description = "The page you are looking for might have been moved, renamed, or is temporarily unavailable.",
  actionLabel = "Back to dashboard",
  actionHref = "/",
}) => {
  return (
    <section className="flex min-h-full items-center justify-center px-6 py-10">
      <div className="relative w-full max-w-5xl">
        <div className="absolute -top-12 left-8 h-28 w-28 rounded-full bg-[#f6f7fb] opacity-80 blur-2xl uc-pulse"></div>
        <div className="absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-[#e9ecef] opacity-70 blur-2xl uc-pulse uc-delay-2"></div>

        <div className="relative rounded-3xl border border-[#e9ecef] bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr,1fr]">
            <div>
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#6C757D]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f7fb] text-[#172B4D] uc-float">
                  <FiSearch />
                </span>
                404 error
              </div>

              <h2 className="mt-4 text-2xl font-bold text-[#172B4D] sm:text-3xl">{title}</h2>
              <p className="mt-3 text-sm text-[#6C757D] sm:text-base">{description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to={actionHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#172B4D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#000435]"
                >
                  <FiArrowLeft className="text-base" />
                  {actionLabel}
                </Link>
                <span className="text-xs text-[#6C757D] sm:text-sm">
                  Check the menu to find what you need.
                </span>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-[#f6f7fb] uc-pulse"></div>
              <div className="relative w-full max-w-xs rounded-2xl border border-[#e9ecef] bg-white px-6 py-8 text-center shadow-sm uc-float">
                <div className="text-[72px] font-extrabold tracking-[0.1em] text-[#172B4D] sm:text-[88px]">
                  404
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#6C757D]">
                  Not found
                </div>

                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[#e9ecef]">
                  <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#172B4D] via-[#000435] to-[#172B4D] uc-scan"></div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6C757D]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#172B4D] uc-dot"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#172B4D] uc-dot uc-delay-1"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#172B4D] uc-dot uc-delay-2"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
