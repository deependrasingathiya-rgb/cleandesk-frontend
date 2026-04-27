// src/app/pages/PrivacyPolicy.tsx

export function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Information We Collect",
      body: "CleanDesk collects information necessary to provide institute management services. This includes names, phone numbers, roles (admin, teacher, student, management), attendance records, test results, fee information, and announcements. Data is collected directly from institute administrators during onboarding.",
    },
    {
      title: "2. How We Use Your Information",
      body: "We use collected information solely to operate the CleanDesk platform — managing attendance, tests, results, announcements, fee records, and communication within your institute. We do not use your data for advertising or share it with third parties for marketing purposes.",
    },
    {
      title: "3. WhatsApp Communication",
      body: "CleanDesk uses WhatsApp Business API to send one-time passwords (OTPs) for authentication. Phone numbers are used only for this purpose. We do not send promotional messages via WhatsApp.",
    },
    {
      title: "4. Data Storage and Security",
      body: "All data is stored securely on encrypted servers. Access is restricted to authorized institute administrators and CleanDesk system personnel. We implement industry-standard security practices to protect your data.",
    },
    {
      title: "5. Data Sharing",
      body: "We do not sell, trade, or share your personal data with third parties except as required by law or as necessary to operate the platform (e.g., WhatsApp Business API for OTP delivery).",
    },
    {
      title: "6. Data Retention",
      body: "Data is retained for the duration of your institute's subscription with CleanDesk. Upon termination, data is deleted within 90 days unless required to be retained by applicable law.",
    },
    {
      title: "7. Your Rights",
      body: "Users may request access to, correction of, or deletion of their personal data by contacting their institute administrator or reaching us at cleandeskedu@gmail.com.",
    },
    {
      title: "8. Contact Us",
      body: "For any privacy-related questions or concerns, please contact us at cleandeskedu@gmail.com.",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>

      <div style={{ backgroundColor: "#f0fdfa", borderBottom: "1px solid #ccfbf1" }}>
        <div className="flex items-center gap-3 px-8 py-4" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#0d9488" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 2v14M2 6l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#0d9488", letterSpacing: "-0.02em" }}>
            CleanDesk
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 32px" }}>

        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "40px" }}>
          Last updated: April 2026
        </p>

        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
              {section.title}
            </h2>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.75 }}>
              {section.body}
            </p>
          </div>
        ))}

        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
          <a href="/login" style={{ fontSize: "13px", color: "#0d9488", fontWeight: 500 }}>
            Back to Login
          </a>
        </div>

      </div>
    </div>
  );
}