# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.










 <section className="relative overflow-hidden bg-gradient-to-br from-[#f0f7ff] via-[#f8fbff] to-[#eaf4ff] py-16 lg:py-20">
       
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          
            <div>
           
              <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eaf4ff] px-3.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#1d5fb8]">
                <span className="material-symbols-outlined text-sm text-[#1d7ff2]">location_on</span>
                <span>Visit Campus</span>
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-[1.15]">
                Find us and request a{' '}
                <span className="relative inline-block text-[#1d7ff2]">
                  callback
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full text-[#38bdf8]"
                    height="8"
                    viewBox="0 0 160 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 5.5C40 2 120 2 158 5.5"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h2>

              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Plan a visit to our school or submit your contact details below to receive direct guidance from our admissions desk.
              </p>

              {/* Map Container */}
              <div className="mt-6 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-xl shadow-sky-900/5">
                <iframe
                  title={`${schoolProfile.name} location`}
                  src={mapUrl}
                  className="h-[360px] sm:h-[400px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Right: Request a Callback Form Card */}
            <div className="relative rounded-3xl border border-sky-100 bg-white p-6 shadow-xl shadow-sky-900/5 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3f99] to-[#1d7ff2] text-white shadow-sm">
                  <span className="material-symbols-outlined text-2xl">support_agent</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-950 sm:text-3xl">Request a Callback</h3>
                  <p className="text-xs font-semibold text-slate-500">We'll get back to you promptly</p>
                </div>
              </div>

              <form className="mt-6 space-y-4">
                {/* Student Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Student Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-sky-200/90 bg-white px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#1d7ff2] focus:ring-4 focus:ring-[#1d7ff2]/15"
                    placeholder="Enter student full name"
                  />
                </div>

                {/* Class Selection Dropdown with Theme Styling */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Class <span className="text-rose-500">*</span>
                  </label>
                  <ThemeSelect
                    value={callbackClass}
                    onChange={setCallbackClass}
                    placeholder="Choose class for admission..."
                    options={[
                      'Playgroup / Nursery / LKG / UKG',
                      'Class 1 to 5 (Primary)',
                      'Class 6 to 8 (Middle)',
                      'Class 9 to 10 (Secondary)',
                    ]}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-sky-200/90 bg-white px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#1d7ff2] focus:ring-4 focus:ring-[#1d7ff2]/15"
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f3f99] to-[#1d7ff2] py-3.5 text-sm font-black text-white shadow-md shadow-blue-900/15 transition-all duration-300 hover:from-[#0b1d3a] hover:to-[#0f3f99] hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span>Submit Callback Request</span>
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200"></span>
                OR CALL DIRECTLY
                <span className="h-px flex-1 bg-slate-200"></span>
              </div>

              {/* Phone CTA */}
              <a
                href={schoolProfile.phoneHref}
                className="group flex items-center justify-center gap-3 rounded-xl border-2 border-slate-900 bg-slate-950 px-5 py-3.5 font-black text-white shadow-sm transition-all duration-300 hover:bg-[#0f3f99] hover:border-[#0f3f99] hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sky-300 group-hover:bg-white/20">
                  <span className="material-symbols-outlined text-lg">call</span>
                </div>
                <span className="text-sm font-bold tracking-wide">{schoolProfile.phone}</span>
              </a>

              {/* Address */}
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs leading-relaxed text-slate-700">
                <span className="material-symbols-outlined text-lg text-[#1d7ff2] shrink-0 mt-0.5">location_on</span>
                <span>{schoolProfile.address}</span>
              </div>
            </div>
          </div>
        </div>
      </section>