import React from 'react'
import WebsiteLayout from '../../Components/Website/WebsiteLayout'
import SEO from '../../Components/SEO/SEO'
import { buildSchoolJsonLd, SCHOOL_KEYWORDS } from '../../seo/siteSeo'
import { schoolProfile } from './siteContent'

function PrivacyPolicy() {
  const lastUpdated = 'October 28, 2026'

  return (
    <WebsiteLayout>
      <SEO
        title="Privacy Policy | Star Public School"
        description="Privacy policy and data protection practices for Star Public School website and official mobile application."
        keywords={[...SCHOOL_KEYWORDS, 'Privacy Policy', 'Data Safety', 'Star Public School App']}
        canonicalPath="/privacy-policy"
        jsonLd={buildSchoolJsonLd({ path: '/privacy-policy' })}
      />

      <section className="gps-site-section pt-6">
        <div className="gps-site-shell">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Header Card */}
            <article className="gps-site-panel p-6 sm:p-8 lg:p-10">
              <span className="gps-site-label">Legal & Data Protection</span>
              <h1 className="gps-site-heading mt-4 text-2xl sm:text-3xl lg:text-4xl">
                Privacy Policy
              </h1>
              <p className="mt-3 text-sm text-slate-500">
                Last updated: <span className="font-semibold text-slate-700">{lastUpdated}</span>
              </p>
              <p className="gps-site-copy mt-4 text-base leading-relaxed text-slate-700">
                This Privacy Policy describes how <strong>{schoolProfile.name}</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
                collects, uses, protects, and handles personal information across our official website,
                web portal (ERP), and the official mobile application (<strong>Star Public School</strong>, package: <code>com.spsmobile.app</code>).
              </p>
            </article>

            {/* Quick Summary Highlights */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-cyan-100 bg-cyan-50/60 p-5">
                <span className="material-symbols-outlined text-2xl text-cyan-700">security</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">Encrypted & Secure</h3>
                <p className="mt-1 text-xs text-slate-600">All communication runs over encrypted HTTPS/TLS protocols.</p>
              </div>
              <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/60 p-5">
                <span className="material-symbols-outlined text-2xl text-emerald-700">block</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">Zero Ads & Tracking</h3>
                <p className="mt-1 text-xs text-slate-600">We never sell, rent, or monetize your data for ads or marketing.</p>
              </div>
              <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50/60 p-5">
                <span className="material-symbols-outlined text-2xl text-blue-700">verified_user</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">School Use Only</h3>
                <p className="mt-1 text-xs text-slate-600">Data is strictly utilized for academic records and parent updates.</p>
              </div>
            </div>

            {/* Section 1: Information We Collect */}
            <article className="gps-site-panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
              <p className="text-sm leading-relaxed text-slate-700">
                We only collect data necessary to manage educational records, campus safety, communication, and administrative services:
              </p>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <h3 className="font-semibold text-slate-900">A. Student & Guardian Information</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Full name, admission/roll number, class/grade, section, date of birth, gender, parent/guardian name,
                    contact telephone number, email address, residential address, academic performance, fee status, and attendance records.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <h3 className="font-semibold text-slate-900">B. Teacher & Staff Information</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Employee name, contact details, assigned subjects, timetable schedules, and attendance records.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <h3 className="font-semibold text-slate-900">C. Location Data (GPS Attendance)</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Our mobile app requests device location permissions (<code>ACCESS_FINE_LOCATION</code> and <code>ACCESS_COARSE_LOCATION</code>).
                    This is <strong>strictly used only by teachers and staff</strong> at the exact moment of marking daily check-in and check-out
                    to verify physical presence on the school campus. Location data is <strong>never tracked in the background</strong>, is never recorded
                    outside attendance events, and is never shared with third parties.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <h3 className="font-semibold text-slate-900">D. Technical & Notification Data</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Device model, operating system version, and push notification tokens (used solely to deliver critical school circulars, homework alerts, exam dates, and attendance notifications).
                  </p>
                </div>
              </div>
            </article>

            {/* Section 2: How We Use the Information */}
            <article className="gps-site-panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">2. How We Use Your Information</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                <li>To maintain official academic, examination, admission, and fee records.</li>
                <li>To verify staff presence via campus GPS check-in during working hours.</li>
                <li>To send instant emergency alerts, homework notifications, and fee reminders to parents and guardians.</li>
                <li>To generate student ID cards, admit cards, and report cards.</li>
                <li>To safeguard school security and verify authorized logins into student and teacher portals.</li>
              </ul>
            </article>

            {/* Section 3: Data Sharing & Disclosure */}
            <article className="gps-site-panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">3. Third-Party Sharing & Disclosure</h2>
              <p className="text-sm leading-relaxed text-slate-700">
                <strong>We do not sell, rent, commercialize, or trade personal data to third parties or marketing networks.</strong>
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                Data may only be disclosed under the following strict conditions:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
                <li>To cloud infrastructure providers hosting our secured databases under strict non-disclosure terms.</li>
                <li>If required by Indian educational statutory authorities or law enforcement compliance.</li>
              </ul>
            </article>

            {/* Section 4: Data Security & Retention */}
            <article className="gps-site-panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">4. Data Security & Retention</h2>
              <p className="text-sm leading-relaxed text-slate-700">
                We implement industry-standard administrative, physical, and technical security safeguards.
                All network transmissions are protected with SSL/TLS encryption. Authentication credentials and passwords
                are securely hashed.
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                Academic and attendance records are retained as mandated by educational board requirements and legitimate school administration needs.
              </p>
            </article>

            {/* Section 5: User Rights & Data Deletion */}
            <article className="gps-site-panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">5. User Rights & Data Deletion Requests</h2>
              <p className="text-sm leading-relaxed text-slate-700">
                Parents, students, and staff have the right to inspect their records and request corrections or deletion of obsolete data.
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-slate-800">
                <p className="font-semibold">How to submit a data deletion or correction request:</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  You may visit the school administration office during working hours or send an email to{' '}
                  <a href={schoolProfile.emailHref} className="font-semibold text-cyan-800 underline">
                    {schoolProfile.email}
                  </a>{' '}
                  with the student roll number, name, and details of the request. Requests are processed within 7 business days, subject to regulatory statutory record obligations.
                </p>
              </div>
            </article>

            {/* Section 6: Children's Privacy */}
            <article className="gps-site-panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">6. Children&rsquo;s Privacy Protection</h2>
              <p className="text-sm leading-relaxed text-slate-700">
                Our application and services are designed for educational management. Accounts for students are provisioned by school administrators with the explicit consent of parents or guardians upon admission. We do not solicit personal information directly from minors without parental authorization.
              </p>
            </article>

            {/* Section 7: Contact Information */}
            <article className="gps-site-panel space-y-4 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">7. Contact the School Administration</h2>
              <p className="text-sm leading-relaxed text-slate-700">
                If you have questions regarding this Privacy Policy, wish to exercise your rights, or need clarification, please reach out:
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">School Name</p>
                  <p className="mt-1 font-semibold text-slate-900">{schoolProfile.name}</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</p>
                  <p className="mt-1 text-sm text-slate-800">{schoolProfile.address}</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Direct Email</p>
                  <a href={schoolProfile.emailHref} className="mt-1 block font-semibold text-cyan-700 hover:underline">
                    {schoolProfile.email}
                  </a>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone & Hours</p>
                  <p className="mt-1 text-sm text-slate-800">
                    <a href={schoolProfile.phoneHref} className="font-semibold text-cyan-700 hover:underline">
                      {schoolProfile.phone}
                    </a>{' '}
                    ({schoolProfile.hours})
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export default PrivacyPolicy
