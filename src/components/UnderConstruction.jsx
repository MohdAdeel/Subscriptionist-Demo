import { FiClock, FiTool } from "react-icons/fi";

const UnderConstruction = ({
  title = "This page",
  description = "We are designing this experience to match the rest of Subscriptionist. Check back soon.",
}) => {
  const headline = `${title} is on the way`;

  return (
    <section className="flex min-h-full items-center justify-center px-6 py-10">
      <div className="relative w-full max-w-4xl">
        <div className="absolute -top-10 right-6 h-24 w-24 rounded-full bg-[#e9ecef] opacity-70 blur-2xl uc-pulse"></div>
        <div className="absolute -bottom-12 left-6 h-32 w-32 rounded-full bg-[#f6f7fb] opacity-80 blur-2xl uc-pulse uc-delay-2"></div>

        <div className="relative rounded-3xl border border-[#e9ecef] bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[auto,1fr]">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-[#f6f7fb] uc-pulse"></div>
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#172B4D] to-[#000435] text-white shadow-lg uc-float">
                <FiTool className="text-3xl" />
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6C757D]">
                Under construction
              </span>
              <h2 className="mt-3 text-2xl font-bold text-[#172B4D] sm:text-3xl">{headline}</h2>
              <p className="mt-3 text-sm text-[#6C757D] sm:text-base">{description}</p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[#343A40] sm:text-sm">
                <div className="flex items-center gap-2 rounded-full border border-[#e9ecef] bg-[#f6f7fb] px-3 py-1.5">
                  <FiClock className="text-[#172B4D]" />
                  <span>Finishing touches in progress</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e9ecef]">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#172B4D] via-[#000435] to-[#172B4D] uc-scan"></div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[#6C757D] sm:text-sm">
              <span>Polishing details</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#172B4D] uc-dot"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#172B4D] uc-dot uc-delay-1"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#172B4D] uc-dot uc-delay-2"></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UnderConstruction;
