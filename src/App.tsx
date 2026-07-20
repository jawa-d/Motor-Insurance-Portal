import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Copy,
  Clock3,
  Download,
  ExternalLink,
  FileSearch,
  Globe2,
  Info,
  Mail,
  MapPin,
  MapPinned,
  MessageCircle,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { type CSSProperties, type ChangeEvent, useEffect, useMemo, useState } from "react";
import { DocumentUpload } from "./components/DocumentUpload";
import { FloatingField } from "./components/FloatingField";
import { ProgressSteps } from "./components/ProgressSteps";
import { UploadZone } from "./components/UploadZone";
import { translations, type Language } from "./i18n";
import { ApiError } from "./services/api";
import {
  submitMotorRequest,
  trackMotorRequest,
  type MotorRequestTracking,
  type MotorRequestUploadProgress,
  type PublicMotorRequestStatus,
} from "./services/motor-request";
import type { DocumentKey, Errors, FormState, UploadFile } from "./types";
import { createSchema, initialForm } from "./validation";

const documentKeys: DocumentKey[] = [
  "frontNationalId",
  "backNationalId",
  "drivingLicense",
  "vehicleRegistration",
  "frontResidenceCard",
  "backResidenceCard",
];

const isDevelopment = import.meta.env.DEV;

const sectionAnimation = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.45 },
};

const supportPhones = ["+964 770 483 9994", "+964 781 104 0003", "+964 790 612 3541"];
const supportWhatsApp = [
  { number: "+964 770 483 9994", href: "https://wa.me/9647704839994" },
  { number: "+964 790 612 3541", href: "https://wa.me/9647906123541" },
  { number: "+964 781 104 0003", href: "https://wa.me/9647811040003" },
];
const fallbackFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSc_xrj87VpZj0VRte-KCnaidxUUIVx1t5brl7NaBVJXRls_qA/viewform?usp=publish-editor";

type Page =
  | "home"
  | "track"
  | "support"
  | "civil-liability"
  | "travel"
  | "building-glass"
  | "fidelity-guarantee"
  | "cash-in-safe"
  | "contractors-risk"
  | "personal-accident"
  | "workers-comp";

const portalNav = [
  { key: "motor", icon: CarFront, page: "home" },
  { key: "marine", icon: ShieldCheck, active: false },
  { key: "contractorsRisk", icon: Building2, page: "contractors-risk" },
  { key: "fireTheft", icon: ShieldCheck, active: false },
  { key: "civilLiability", icon: ClipboardList, page: "civil-liability" },
  { key: "personalAccident", icon: ShieldCheck, page: "personal-accident" },
  { key: "fidelityGuarantee", icon: CheckCircle2, page: "fidelity-guarantee" },
  { key: "cashInSafe", icon: ShieldCheck, page: "cash-in-safe" },
  { key: "travel", icon: Globe2, page: "travel" },
  { key: "workersComp", icon: Building2, page: "workers-comp" },
  { key: "buildingGlass", icon: Building2, page: "building-glass" },
  { key: "health", icon: ShieldCheck, active: false },
  { key: "property", icon: Building2, active: false },
] as const;

const getCurrentPage = (): Page => {
  const path = window.location.pathname.replace(/\/+$/, "");

  if (path === "/track") return "track";
  if (path === "/support") return "support";
  if (path === "/civil-liability") return "civil-liability";
  if (path === "/travel") return "travel";
  if (path === "/building-glass") return "building-glass";
  if (path === "/fidelity-guarantee") return "fidelity-guarantee";
  if (path === "/cash-in-safe") return "cash-in-safe";
  if (path === "/contractors-risk") return "contractors-risk";
  if (path === "/personal-accident") return "personal-accident";
  if (path === "/workers-comp") return "workers-comp";

  return "home";
};

const trackingStatusIndex: Record<PublicMotorRequestStatus, number> = {
  RECEIVED: 0,
  UNDER_REVIEW: 1,
  DOCUMENTS_CHECK: 2,
  QUOTE_PREPARATION: 3,
  CONTACTING_CUSTOMER: 4,
  COMPLETED: 4,
  REJECTED: 4,
};

const trackingStatusTheme: Record<PublicMotorRequestStatus, { color: string; name: string }> = {
  RECEIVED: { color: "#0f8a4b", name: "received" },
  UNDER_REVIEW: { color: "#1b8b8f", name: "review" },
  DOCUMENTS_CHECK: { color: "#b7791f", name: "documents" },
  QUOTE_PREPARATION: { color: "#5b5fc7", name: "quote" },
  CONTACTING_CUSTOMER: { color: "#2563eb", name: "contact" },
  COMPLETED: { color: "#15803d", name: "completed" },
  REJECTED: { color: "#b42318", name: "rejected" },
};

const trackingStatusDescription: Record<Language, Record<PublicMotorRequestStatus, string>> = {
  ar: {
    RECEIVED: "تم استلام الطلب بنجاح وهو الآن ضمن قائمة المتابعة لدى فريق التأمين.",
    UNDER_REVIEW: "الطلب قيد المراجعة، ويتم تدقيق المعلومات الأساسية قبل الانتقال للخطوة التالية.",
    DOCUMENTS_CHECK: "الفريق يتحقق من المستندات المرفوعة ويتأكد من وضوحها واكتمالها.",
    QUOTE_PREPARATION: "يتم تجهيز العرض التأميني المناسب حسب بيانات المركبة والطلب.",
    CONTACTING_CUSTOMER: "سيتم التواصل معك قريباً لإكمال التفاصيل أو مشاركة العرض.",
    COMPLETED: "اكتملت معالجة الطلب، ويمكنك التواصل مع فريق الدعم لأي متابعة إضافية.",
    REJECTED: "تم رفض الطلب. يرجى التواصل مع فريق الدعم لمعرفة السبب والخطوات الممكنة.",
  },
  en: {
    RECEIVED: "Your application was received successfully and is now queued with the insurance team.",
    UNDER_REVIEW: "The application is under review while the team checks the core details.",
    DOCUMENTS_CHECK: "Uploaded documents are being checked for clarity and completeness.",
    QUOTE_PREPARATION: "The insurance quote is being prepared based on the vehicle and request details.",
    CONTACTING_CUSTOMER: "The team will contact you soon to complete details or share the quote.",
    COMPLETED: "The application has been completed. Support can help with any additional follow-up.",
    REJECTED: "The application was rejected. Please contact support for the reason and possible next steps.",
  },
};

function App() {
  const [language, setLanguage] = useState<Language>("ar");
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState<Page>(getCurrentPage);
  const [form, setForm] = useState<FormState>(initialForm);
  const [vehicleImages, setVehicleImages] = useState<UploadFile[]>([]);
  const [documents, setDocuments] = useState<Partial<Record<DocumentKey, UploadFile>>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [submittedForm, setSubmittedForm] = useState<FormState | null>(null);
  const [copiedRequestNumber, setCopiedRequestNumber] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingLookup, setTrackingLookup] = useState<MotorRequestTracking | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<MotorRequestUploadProgress | null>(null);

  const t = translations[language];
  const direction = language === "ar" ? "rtl" : "ltr";
  const isFormLocked = isSubmitting || Boolean(uploadProgress);
  const showHome = page === "home";
  const showTrackingPage = page === "track";
  const showSupportPage = page === "support";
  const showCivilLiabilityPage = page === "civil-liability";
  const showTravelPage = page === "travel";
  const showBuildingGlassPage = page === "building-glass";
  const showFidelityGuaranteePage = page === "fidelity-guarantee";
  const showCashInSafePage = page === "cash-in-safe";
  const showContractorsRiskPage = page === "contractors-risk";
  const showPersonalAccidentPage = page === "personal-accident";
  const showWorkersCompPage = page === "workers-comp";

  const steps = [t.customer, t.vehicle, t.images, t.documents, t.notes, t.submitStep];
  const trackingSteps = [t.trackReceived, t.trackReview, t.trackDocuments, t.trackPricing, t.trackContact];
  const completed = [
    ["fullName", "phone", "nationalId", "address", "city"].every((key) => form[key as keyof FormState]),
    [
      "vehicleType",
      "manufacturer",
      "model",
      "year",
      "color",
      "plateNumber",
      "chassisNumber",
      "engineNumber",
      "estimatedValue",
    ].every((key) => form[key as keyof FormState]),
    vehicleImages.length >= 5,
    documentKeys.every((key) => documents[key]),
    form.notes.trim().length > 0,
    Boolean(requestNumber && trackingNumber),
  ];

  const uploadLabels = {
    replace: t.replace,
    remove: t.remove,
    selectFile: t.selectFile,
    fileType: t.fileType,
  };

  const agentCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("agentCode") ??
      params.get("agent_code") ??
      params.get("agent") ??
      import.meta.env.VITE_AGENT_CODE ??
      undefined
    );
  }, []);

  const schema = useMemo(
    () =>
      createSchema({
        fieldRequired: t.fieldRequired,
      }),
    [t],
  );

  useEffect(() => {
    const updatePage = () => setPage(getCurrentPage());

    window.addEventListener("popstate", updatePage);

    return () => window.removeEventListener("popstate", updatePage);
  }, []);

  const navigate = (nextPage: Page) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const nextPath = nextPage === "home" ? "/" : `/${nextPage}`;

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setValue = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const getTrackingErrorMessage = (error: unknown) => {
    if (isDevelopment && error instanceof Error) {
      if (error instanceof ApiError && error.responseBody) {
        return `${error.message} Response: ${error.responseBody}`;
      }

      return error.message;
    }

    if (error instanceof ApiError) {
      if (error.status === 400) return t.trackingError400;
      if (error.status === 401) return t.trackingError401;
      if (error.status === 404) return t.trackingError404;
      if (error.status >= 500) return t.trackingError500;
    }

    return t.trackingErrorGeneric;
  };

  const lookupTracking = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = trackingInput.trim();

    if (!code) return;

    try {
      setIsTracking(true);
      setTrackingError(null);
      setTrackingLookup(null);
      const result = await trackMotorRequest(code);
      setTrackingLookup(result);
    } catch (error) {
      setTrackingError(getTrackingErrorMessage(error));
    } finally {
      setIsTracking(false);
    }
  };

  const updateDocument = (key: DocumentKey, file?: UploadFile) => {
    setDocuments((current) => ({ ...current, [key]: file }));
    setErrors((current) => ({ ...current, documents: undefined }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setVehicleImages([]);
    setDocuments({});
    setErrors({});
  };

  const copyRequestNumber = async () => {
    if (!requestNumber) return;

    try {
      await navigator.clipboard.writeText(requestNumber);
      setCopiedRequestNumber(true);
      window.setTimeout(() => setCopiedRequestNumber(false), 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = requestNumber;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedRequestNumber(true);
      window.setTimeout(() => setCopiedRequestNumber(false), 1800);
    }
  };

  const downloadRequestPdf = () => {
    if (!requestNumber || !trackingNumber) return;

    const snapshot = submittedForm ?? form;
    const submittedAt = new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());
    const value = (text: string | boolean | undefined) => (typeof text === "string" && text.trim() ? text : "-");
    const rows = [
      [t.requestNumber, requestNumber],
      [t.trackingNumber, trackingNumber],
      [language === "ar" ? "حالة الطلب" : "Request status", t.trackReceived],
      [language === "ar" ? "وقت الإرسال" : "Submitted at", submittedAt],
      [t.fullName, value(snapshot.fullName)],
      [t.phone, value(snapshot.phone)],
      [t.email, value(snapshot.email)],
      [t.nationalId, value(snapshot.nationalId)],
      [t.city, value(snapshot.city)],
      [t.address, value(snapshot.address)],
      [t.vehicleType, value(snapshot.vehicleType)],
      [t.manufacturer, value(snapshot.manufacturer)],
      [t.model, value(snapshot.model)],
      [t.year, value(snapshot.year)],
      [t.color, value(snapshot.color)],
      [t.plateNumber, value(snapshot.plateNumber)],
      [t.chassisNumber, value(snapshot.chassisNumber)],
      [t.engineNumber, value(snapshot.engineNumber)],
      [t.estimatedValue, value(snapshot.estimatedValue)],
      [t.notes, value(snapshot.notes)],
    ];
    const escapeHtml = (text: string) =>
      text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    const printable = window.open("", "_blank", "width=900,height=1100");

    if (!printable) return;

    printable.document.write(`<!doctype html>
<html lang="${language}" dir="${direction}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t.requestNumber)} ${escapeHtml(requestNumber)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #14231b; font-family: "Segoe UI", Tahoma, Arial, sans-serif; background: #fff; }
    .sheet { min-height: 100vh; border: 1px solid #d9e6dc; padding: 24px; }
    .head { display: flex; justify-content: space-between; gap: 18px; border-bottom: 3px solid #0f8a4b; padding-bottom: 18px; }
    .brand { color: #0b5d3b; font-size: 22px; font-weight: 900; }
    .title { margin: 10px 0 0; font-size: 28px; font-weight: 900; }
    .status { align-self: start; border: 1px solid #bfe3cc; background: #eefaf2; color: #0b5d3b; padding: 12px 16px; border-radius: 8px; font-weight: 900; }
    .numbers { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 22px 0; }
    .number { border: 1px solid #d9e6dc; background: #f7fbf8; padding: 14px; border-radius: 8px; }
    .number span, dt { color: #64736a; font-size: 12px; font-weight: 800; }
    .number strong { display: block; margin-top: 6px; color: #0b5d3b; font-size: 18px; }
    h2 { margin: 22px 0 12px; color: #14231b; font-size: 18px; }
    dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 0; }
    .item { border: 1px solid #e3ece6; padding: 11px 12px; border-radius: 8px; min-height: 66px; }
    dd { margin: 5px 0 0; font-size: 15px; font-weight: 800; overflow-wrap: anywhere; }
    .foot { margin-top: 24px; padding-top: 14px; border-top: 1px solid #d9e6dc; color: #64736a; line-height: 1.8; }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="head">
      <div>
        <div class="brand">${escapeHtml(t.brand)}</div>
        <div class="title">${escapeHtml(language === "ar" ? "استمارة طلب تأمين مركبة" : "Motor Insurance Application")}</div>
      </div>
      <div class="status">${escapeHtml(t.trackReceived)}</div>
    </section>
    <section class="numbers">
      <div class="number"><span>${escapeHtml(t.requestNumber)}</span><strong>${escapeHtml(requestNumber)}</strong></div>
      <div class="number"><span>${escapeHtml(t.trackingNumber)}</span><strong>${escapeHtml(trackingNumber)}</strong></div>
    </section>
    <h2>${escapeHtml(language === "ar" ? "معلومات الإرسال وحالة الطلب" : "Submission and Status")}</h2>
    <dl>${rows
      .map(([label, text]) => `<div class="item"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(text))}</dd></div>`)
      .join("")}</dl>
    <p class="foot">${escapeHtml(t.successBody)}</p>
  </main>
  <script>window.addEventListener("load", () => { window.print(); });</script>
</body>
</html>`);
    printable.document.close();
  };

  const getSubmitErrorMessage = (error: unknown) => {
    if (isDevelopment && error instanceof Error) {
      if (error instanceof ApiError && error.responseBody) {
        return `${error.message} Response: ${error.responseBody}`;
      }

      return error.message;
    }

    if (error instanceof ApiError) {
      if (error.status === 400) return t.submitError400;
      if (error.status === 401) return t.submitError401;
      if (error.status === 404) return t.submitError404;
      if (error.status === 413) return t.submitError413;
      if (error.status >= 500) return t.submitError500;
    }

    return t.submitErrorGeneric;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isFormLocked) return;

    const parsed = schema.safeParse(form);
    const nextErrors: Errors = {};
    setSubmitError(null);
    setRequestNumber(null);
    setTrackingNumber(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (vehicleImages.length < 5) nextErrors.vehicleImages = t.imagesMin;
    if (!documentKeys.every((key) => documents[key])) nextErrors.documents = t.documentsRequired;

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      try {
        setIsSubmitting(true);
        const result = await submitMotorRequest(
          { form, vehicleImages, documents, agentCode },
          {
            onProgress: setUploadProgress,
          },
        );
        setSubmittedForm(form);
        resetForm();
        setRequestNumber(result.requestNumber);
        setTrackingNumber(result.trackingNumber);
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      } catch (error) {
        setSubmitError(getSubmitErrorMessage(error));
      } finally {
        setUploadProgress(null);
        setIsSubmitting(false);
      }
    }
  };

  const trackingActiveIndex = trackingLookup ? trackingStatusIndex[trackingLookup.status] : 0;
  const trackingUpdatedAt = trackingLookup
    ? new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(trackingLookup.updatedAt))
    : "";
  const trackingTheme = trackingLookup ? trackingStatusTheme[trackingLookup.status] : trackingStatusTheme.RECEIVED;
  const trackingThemeStyle = { "--status-accent": trackingTheme.color } as CSSProperties;
  const trackingDialogTitle = language === "ar" ? "تفاصيل تتبع الطلب" : "Application Tracking Details";
  const trackingDialogSubtitle =
    language === "ar"
      ? "ملخص الحالة الحالية وآخر تفاصيل الطلب المسجلة في النظام."
      : "A summary of the current status and the latest request details in the system.";
  const closeTrackingLabel = language === "ar" ? "إغلاق" : "Close";

  return (
    <div className={`${darkMode ? "app dark" : "app"} ${isFormLocked ? "app-busy" : ""}`} dir={direction} lang={language}>
      {uploadProgress ? (
        <motion.div
          className="upload-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-live="assertive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24 }}
        >
          <motion.div className="upload-overlay-card" initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.32 }}>
            <div className="upload-progress-ring" style={{ "--upload-progress": `${uploadProgress.percent * 3.6}deg` } as CSSProperties}>
              <span>{uploadProgress.percent}%</span>
            </div>
            <div className="upload-overlay-copy">
              <strong>{uploadProgress.phase === "submitting" ? "تم رفع الملفات بنجاح..." : "Uploading your files..."}</strong>
              <span>{uploadProgress.phase === "submitting" ? "جاري إرسال الطلب..." : `Uploading file ${uploadProgress.currentFile} of ${uploadProgress.totalFiles}...`}</span>
              <p>
                يرجى الانتظار...
                <br />
                يتم الآن رفع الملفات بشكل آمن.
              </p>
              <p>لا تغلق الصفحة ولا تقم بتحديثها حتى يكتمل رفع الطلب.</p>
            </div>
            <div className="upload-progress-bar" aria-hidden="true">
              <span style={{ width: `${uploadProgress.percent}%` }} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      <header className="site-header">
        <a className="brand" href="/" onClick={navigate("home")} aria-label={t.brand}>
          <img src="/brand/iraq-takaful-logo.png" alt={t.brand} />
          <span>{t.portal}</span>
        </a>
        <nav className="portal-nav" aria-label={t.portalNavLabel}>
          <strong>{t.portalNavTitle}</strong>
          <div>
            {portalNav.map((item) => {
              const Icon = item.icon;
              const label = t.portalTypes[item.key];
              const isLinkedPortal = "page" in item;
              const isCurrentPortal = isLinkedPortal && item.page === page;

              return isLinkedPortal ? (
                <a
                  key={item.key}
                  className={`portal-nav-link ${isCurrentPortal ? "active" : ""}`}
                  href={item.page === "home" ? "/" : `/${item.page}`}
                  onClick={navigate(item.page)}
                  aria-current={isCurrentPortal ? "page" : undefined}
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </a>
              ) : (
                <button key={item.key} className="portal-nav-link" type="button" disabled title={t.comingSoon}>
                  <Icon size={17} aria-hidden="true" />
                  {label}
                  <small>{t.comingSoon}</small>
                </button>
              );
            })}
          </div>
        </nav>
        <div className="header-actions">
          <a className="icon-button" href="/support" onClick={navigate("support")}>
            <Phone size={18} aria-hidden="true" />
            {t.support}
          </a>
          <button className="icon-button" type="button" disabled={isFormLocked} onClick={() => setLanguage(language === "ar" ? "en" : "ar")}>
            <Globe2 size={18} aria-hidden="true" />
            {t.language}
          </button>
          <button className="icon-button" type="button" disabled={isFormLocked} onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            {darkMode ? t.light : t.dark}
          </button>
        </div>
      </header>

      <main id="top">
        {showHome ? (
          <>
        <motion.section
          className="intro-banner"
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          aria-label={t.headline}
        >
          <motion.div
            className="intro-glow"
            animate={{ x: ["-18%", "18%", "-18%"], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.p
            className="intro-title"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {t.headline}
          </motion.p>
        </motion.section>

        <section className="hero">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="eyebrow">
              <ShieldCheck size={18} aria-hidden="true" />
              {t.brand}
            </span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
            <a className="primary-link" href="#request-form">
              <CarFront size={20} aria-hidden="true" />
              {t.start}
            </a>
            <a className="ghost-link" href="/track" onClick={navigate("track")}>
              <MapPinned size={20} aria-hidden="true" />
              {t.trackRequest}
            </a>
            <a className="ghost-link" href="/support" onClick={navigate("support")}>
              <Phone size={20} aria-hidden="true" />
              {t.support}
            </a>
          </motion.div>
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            aria-hidden="true"
          >
            <div className="car-scene">
              <div className="sun-disc" />
              <div className="road" />
              <svg viewBox="0 0 620 320" role="img">
                <path className="car-shadow" d="M109 245C172 222 458 221 520 245C474 273 167 274 109 245Z" />
                <path className="car-body" d="M95 199C126 160 171 139 226 135L274 83H405C454 90 492 128 522 174L555 185C576 192 588 211 584 234H64C62 219 72 205 95 199Z" />
                <path className="car-window" d="M246 132L286 93H397C429 98 455 123 477 154H214L246 132Z" />
                <path className="car-accent" d="M115 194H538" />
                <circle className="wheel" cx="183" cy="235" r="42" />
                <circle className="wheel" cx="475" cy="235" r="42" />
                <circle className="wheel-inner" cx="183" cy="235" r="18" />
                <circle className="wheel-inner" cx="475" cy="235" r="18" />
              </svg>
            </div>
          </motion.div>
        </section>

        <motion.section className="takaful-principle" {...sectionAnimation}>
          <div className="takaful-copy">
            <span className="eyebrow">
              <ShieldCheck size={18} aria-hidden="true" />
              {t.takafulSectionEyebrow}
            </span>
            <h2>{t.takafulSectionTitle}</h2>
            <p>{t.takafulSectionBody}</p>
            <ul>
              <li>
                <CheckCircle2 size={19} aria-hidden="true" />
                {t.takafulPointShared}
              </li>
              <li>
                <CheckCircle2 size={19} aria-hidden="true" />
                {t.takafulPointFair}
              </li>
              <li>
                <CheckCircle2 size={19} aria-hidden="true" />
                {t.takafulPointTrusted}
              </li>
            </ul>
          </div>
          <figure className="takaful-image">
            <img src="/brand/takaful-principle.png" alt={t.takafulSectionTitle} />
          </figure>
        </motion.section>

          </>
        ) : null}

        {showCivilLiabilityPage ? (
          <motion.section className="civil-page" {...sectionAnimation}>
            <div className="civil-header">
              <span className="eyebrow">
                <ClipboardList size={18} aria-hidden="true" />
                بوابة طلبات التأمين
              </span>
              <h1>استمارة طلب تأمين مسؤولية مدنية</h1>
              <p>
                هذه الاستمارة مخصصة لجمع بيانات مقدم الطلب، النشاط، التغطية المطلوبة، والسجل التأميني السابق قبل مراجعتها من فريق تكافل العراق.
              </p>
            </div>
            <figure className="portal-hero-image">
              <img src="/brand/portals/civil-liability.png" alt="استمارة طلب تأمين مسؤولية مدنية" />
            </figure>

            <form className="civil-form" onSubmit={(event) => event.preventDefault()}>
              <section className="panel civil-section">
                <h2>1. معلومات مقدم الطلب</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>الاسم الكامل / اسم الشركة</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>الصفة</span>
                    <select defaultValue="">
                      <option value="" disabled>اختر الصفة</option>
                      <option>فرد</option>
                      <option>شركة</option>
                      <option>مؤسسة</option>
                    </select>
                  </label>
                  <label className="civil-field">
                    <span>رقم الهوية / السجل التجاري</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>الجنسية</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>تاريخ الميلاد / التأسيس</span>
                    <input type="date" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهاتف</span>
                    <input type="tel" />
                  </label>
                  <label className="civil-field">
                    <span>البريد الإلكتروني</span>
                    <input type="email" />
                  </label>
                  <label className="civil-field">
                    <span>الشارع</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>المدينة</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>الرمز البريدي</span>
                    <input type="text" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>2. تفاصيل النشاط أو العمل</h2>
                <div className="grid three">
                  <label className="civil-field">
                    <span>نوع النشاط التجاري أو المهني</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>مدة مزاولة النشاط</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>عدد الموظفين</span>
                    <input type="number" min="0" />
                  </label>
                </div>
                <fieldset className="civil-choice">
                  <legend>هل هناك أنشطة عالية الخطورة؟</legend>
                  <label><input type="radio" name="high-risk" /> نعم</label>
                  <label><input type="radio" name="high-risk" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>إذا كانت الإجابة نعم، يرجى التفصيل</span>
                  <textarea rows={4} />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>3. تفاصيل التغطية المطلوبة</h2>
                <fieldset className="civil-checks">
                  <legend>نوع المسؤولية المراد تغطيتها</legend>
                  <label><input type="checkbox" /> مسؤولية مدنية عامة</label>
                  <label><input type="checkbox" /> مسؤولية أصحاب المهن (طبية / قانونية / هندسية...)</label>
                  <label><input type="checkbox" /> مسؤولية المنتج</label>
                  <label><input type="checkbox" /> مسؤولية أصحاب العمل</label>
                  <label><input type="checkbox" /> أخرى</label>
                </fieldset>
                <div className="grid two">
                  <label className="civil-field">
                    <span>أخرى، يرجى التحديد</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>حد التغطية لكل حادث</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>حد التغطية في المجمل سنوياً</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>تاريخ بدء التغطية المطلوبة</span>
                    <input type="date" />
                  </label>
                  <label className="civil-field">
                    <span>مدة التغطية (عدد الأشهر أو السنوات)</span>
                    <input type="text" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>4. السجل التأميني السابق</h2>
                <fieldset className="civil-choice">
                  <legend>هل لديك تأمين حالي؟</legend>
                  <label><input type="radio" name="current-insurance" /> نعم</label>
                  <label><input type="radio" name="current-insurance" /> لا</label>
                </fieldset>
                <div className="grid three">
                  <label className="civil-field">
                    <span>اسم شركة التأمين</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الوثيقة</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>تاريخ الانتهاء</span>
                    <input type="date" />
                  </label>
                </div>
                <fieldset className="civil-choice">
                  <legend>هل سبق وتم رفض طلب تأمين أو إلغاؤه أو عدم تجديده؟</legend>
                  <label><input type="radio" name="declined-policy" /> نعم</label>
                  <label><input type="radio" name="declined-policy" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>إذا كانت الإجابة نعم، يرجى التوضيح</span>
                  <textarea rows={3} />
                </label>
                <fieldset className="civil-choice">
                  <legend>هل كانت هناك أي مطالبات سابقة خلال السنوات الخمس الماضية؟</legend>
                  <label><input type="radio" name="previous-claims" /> نعم</label>
                  <label><input type="radio" name="previous-claims" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>تفاصيل المطالبات السابقة (التواريخ، الأسباب، المبالغ المدفوعة)</span>
                  <textarea rows={5} />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>5. إقرار مقدم الطلب</h2>
                <label className="civil-declaration">
                  <input type="checkbox" />
                  <span>
                    أقر بأن جميع المعلومات المذكورة أعلاه صحيحة وكاملة حسب علمي، وأفهم أن أي معلومات غير دقيقة قد تؤثر على صلاحية وثيقة التأمين أو المطالبات المتعلقة بها.
                  </span>
                </label>
                <p className="api-note">هذه البوابة جاهزة كواجهة أولية، وسيتم تفعيل الإرسال بعد ربط API الخاص بطلبات المسؤولية المدنية.</p>
                <button className="submit-button" type="submit" disabled>
                  <ClipboardList size={20} aria-hidden="true" />
                  إرسال الطلب
                </button>
              </section>
            </form>
          </motion.section>
        ) : null}

        {showTravelPage ? (
          <motion.section className="civil-page" {...sectionAnimation}>
            <div className="civil-header">
              <span className="eyebrow">
                <Globe2 size={18} aria-hidden="true" />
                بوابة طلبات التأمين
              </span>
              <h1>استمارة طلب تأمين سفر</h1>
              <p>
                هذه الاستمارة مخصصة لجمع البيانات الشخصية وتفاصيل الرحلة والتغطية المطلوبة قبل مراجعتها من فريق تكافل العراق.
              </p>
            </div>
            <figure className="portal-hero-image">
              <img src="/brand/portals/travel.png" alt="استمارة طلب تأمين سفر" />
            </figure>

            <form className="civil-form" onSubmit={(event) => event.preventDefault()}>
              <section className="panel civil-section">
                <h2>1. البيانات الشخصية</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>الاسم الكامل</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>الجنسية</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهوية / جواز السفر</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>تاريخ الميلاد</span>
                    <input type="date" />
                  </label>
                  <label className="civil-field">
                    <span>العنوان</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهاتف</span>
                    <input type="tel" />
                  </label>
                  <label className="civil-field">
                    <span>البريد الإلكتروني</span>
                    <input type="email" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>2. تفاصيل الرحلة</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>وجهة السفر</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>تاريخ بدء السفر</span>
                    <input type="date" />
                  </label>
                  <label className="civil-field">
                    <span>تاريخ العودة</span>
                    <input type="date" />
                  </label>
                  <label className="civil-field">
                    <span>المدة الإجمالية للسفر / أيام</span>
                    <input type="number" min="1" />
                  </label>
                </div>
                <fieldset className="civil-checks">
                  <legend>الغرض من السفر</legend>
                  <label><input type="checkbox" /> سياحة</label>
                  <label><input type="checkbox" /> عمل</label>
                  <label><input type="checkbox" /> دراسة</label>
                  <label><input type="checkbox" /> علاج</label>
                  <label><input type="checkbox" /> أخرى</label>
                </fieldset>
                <label className="civil-field">
                  <span>أخرى، يرجى التحديد</span>
                  <input type="text" />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>3. تفاصيل التغطية التأمينية المطلوبة</h2>
                <fieldset className="civil-checks">
                  <legend>نوع التغطية</legend>
                  <label><input type="checkbox" /> طبية فقط</label>
                  <label><input type="checkbox" /> شاملة (طبية، فقدان أمتعة، إلغاء سفر، مسؤولية مدنية...)</label>
                </fieldset>
                <div className="grid two">
                  <label className="civil-field">
                    <span>المبلغ المطلوب للتغطية (اختياري)</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>عملة التغطية</span>
                    <select defaultValue="">
                      <option value="" disabled>اختر العملة</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                  </label>
                </div>
                <fieldset className="civil-choice">
                  <legend>هل لديك أي أمراض مزمنة؟</legend>
                  <label><input type="radio" name="chronic-disease" /> نعم</label>
                  <label><input type="radio" name="chronic-disease" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>إذا كانت الإجابة نعم، يرجى التوضيح</span>
                  <textarea rows={4} />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>4. معلومات إضافية</h2>
                <fieldset className="civil-choice">
                  <legend>هل سبق لك الحصول على تأمين سفر؟</legend>
                  <label><input type="radio" name="previous-travel-insurance" /> نعم</label>
                  <label><input type="radio" name="previous-travel-insurance" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>اسم شركة التأمين السابقة (إن وجد)</span>
                  <input type="text" />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>5. الإقرار والتوقيع</h2>
                <label className="civil-declaration">
                  <input type="checkbox" />
                  <span>
                    أقر أنا الموقع أدناه بأن جميع المعلومات المذكورة أعلاه صحيحة وكاملة حسب علمي، وأوافق على الشروط والأحكام الخاصة بتأمين السفر.
                  </span>
                </label>
                <p className="api-note">هذه البوابة جاهزة كواجهة أولية، وسيتم تفعيل الإرسال بعد ربط API الخاص بطلبات تأمين السفر.</p>
                <button className="submit-button" type="submit" disabled>
                  <Globe2 size={20} aria-hidden="true" />
                  إرسال الطلب
                </button>
              </section>
            </form>
          </motion.section>
        ) : null}

        {showBuildingGlassPage ? (
          <motion.section className="civil-page" {...sectionAnimation}>
            <div className="civil-header">
              <span className="eyebrow">
                <Building2 size={18} aria-hidden="true" />
                Glass Insurance Application Form
              </span>
              <h1>استمارة طلب تأمين زجاج المباني</h1>
              <p>
                هذه الاستمارة مخصصة لتسجيل بيانات المؤمن له وتفاصيل المبنى والزجاج المطلوب تأمينه قبل مراجعة الطلب.
              </p>
            </div>
            <figure className="portal-hero-image">
              <img src="/brand/portals/building-glass.png" alt="استمارة طلب تأمين زجاج المباني" />
            </figure>

            <form className="civil-form" onSubmit={(event) => event.preventDefault()}>
              <section className="panel civil-section">
                <h2>1. البيانات العامة للمؤمن له</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>الاسم الكامل / اسم الشركة</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهوية / السجل التجاري</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>العنوان</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهاتف</span>
                    <input type="tel" />
                  </label>
                  <label className="civil-field">
                    <span>البريد الإلكتروني</span>
                    <input type="email" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>2. تفاصيل المبنى المراد التأمين عليه</h2>
                <label className="civil-field">
                  <span>عنوان المبنى</span>
                  <input type="text" />
                </label>
                <fieldset className="civil-checks">
                  <legend>نوع المبنى</legend>
                  <label><input type="checkbox" /> سكني</label>
                  <label><input type="checkbox" /> تجاري</label>
                  <label><input type="checkbox" /> إداري</label>
                  <label><input type="checkbox" /> آخر</label>
                </fieldset>
                <div className="grid two">
                  <label className="civil-field">
                    <span>آخر، يرجى التحديد</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>عدد الطوابق</span>
                    <input type="number" min="0" />
                  </label>
                  <label className="civil-field">
                    <span>سنة البناء</span>
                    <input type="number" min="1900" />
                  </label>
                  <label className="civil-field">
                    <span>مبلغ التأمين</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                </div>
                <fieldset className="civil-choice">
                  <legend>هل المبنى مستأجر أم مملوك؟</legend>
                  <label><input type="radio" name="building-ownership" /> مملوك</label>
                  <label><input type="radio" name="building-ownership" /> مستأجر</label>
                </fieldset>
              </section>

              <section className="panel civil-section">
                <h2>3. تفاصيل الزجاج المطلوب تأمينه</h2>
                <div className="glass-table" role="group" aria-label="تفاصيل الزجاج المطلوب تأمينه">
                  <div className="glass-table-head">
                    <span>الموقع</span>
                    <span>عدد القطع</span>
                    <span>الأبعاد (الطول × العرض بالمتر)</span>
                    <span>نوع الزجاج</span>
                    <span>القيمة التقديرية</span>
                  </div>
                  {[1, 2, 3].map((row) => (
                    <div className="glass-table-row" key={row}>
                      <input aria-label={`الموقع ${row}`} type="text" />
                      <input aria-label={`عدد القطع ${row}`} type="number" min="0" />
                      <input aria-label={`الأبعاد ${row}`} type="text" />
                      <input aria-label={`نوع الزجاج ${row}`} type="text" />
                      <input aria-label={`القيمة التقديرية ${row}`} type="text" inputMode="decimal" />
                    </div>
                  ))}
                </div>
                <fieldset className="civil-choice">
                  <legend>هل الزجاج مزود بطبقة حماية أو معالجة خاصة؟</legend>
                  <label><input type="radio" name="glass-protection" /> نعم</label>
                  <label><input type="radio" name="glass-protection" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>إذا كانت الإجابة نعم، يرجى التوضيح</span>
                  <textarea rows={3} />
                </label>
                <fieldset className="civil-choice">
                  <legend>هل سبق وأن تم كسر زجاج في هذا المبنى خلال السنوات الثلاث الماضية؟</legend>
                  <label><input type="radio" name="previous-glass-break" /> نعم</label>
                  <label><input type="radio" name="previous-glass-break" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>إذا كانت الإجابة نعم، يرجى ذكر التفاصيل</span>
                  <textarea rows={5} />
                </label>
                <label className="civil-field">
                  <span>مدة التأمين المطلوبة</span>
                  <input type="text" />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>4. تصريحات صاحب الطلب</h2>
                <label className="civil-declaration">
                  <input type="checkbox" />
                  <span>
                    أصرح بأن جميع البيانات المدونة أعلاه صحيحة وكاملة حسب علمي، وأوافق على شروط وأحكام شركة التأمين.
                  </span>
                </label>
                <p className="api-note">هذه البوابة جاهزة كواجهة أولية، وسيتم تفعيل الإرسال بعد ربط API الخاص بطلبات تأمين زجاج المباني.</p>
                <button className="submit-button" type="submit" disabled>
                  <Building2 size={20} aria-hidden="true" />
                  إرسال الطلب
                </button>
              </section>
            </form>
          </motion.section>
        ) : null}

        {showFidelityGuaranteePage ? (
          <motion.section className="civil-page" {...sectionAnimation}>
            <div className="civil-header">
              <span className="eyebrow">
                <CheckCircle2 size={18} aria-hidden="true" />
                Fidelity Guarantee Insurance Proposal Form
              </span>
              <h1>استمارة طلب تأمين خيانة الأمانة</h1>
              <p>
                هذه الاستمارة مخصصة لتقييم طلب تغطية خيانة الأمانة للموظفين، وتشمل بيانات المنشأة، نوع الوثيقة، تفاصيل الموظفين، وأنظمة الرقابة الداخلية.
              </p>
            </div>
            <figure className="portal-hero-image">
              <img src="/brand/portals/fidelity-guarantee.png" alt="استمارة طلب تأمين خيانة الأمانة" />
            </figure>

            <form className="civil-form" onSubmit={(event) => event.preventDefault()}>
              <section className="panel civil-section">
                <h2>1. معلومات مقدم الطلب (المؤمن له)</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>اسم الشركة / المؤسسة</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>النشاط التجاري</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم السجل التجاري</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>العنوان</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهاتف</span>
                    <input type="tel" />
                  </label>
                  <label className="civil-field">
                    <span>البريد الإلكتروني</span>
                    <input type="email" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>2. نوع الوثيقة المطلوبة</h2>
                <fieldset className="civil-checks">
                  <legend>يرجى وضع اختيار أمام النوع المناسب</legend>
                  <label><input type="checkbox" /> فردية لكل موظف</label>
                  <label><input type="checkbox" /> جماعية لكافة الموظفين</label>
                </fieldset>
              </section>

              <section className="panel civil-section">
                <h2>3. تفاصيل الموظفين المطلوب تغطيتهم</h2>
                <div className="data-table fidelity-employees" role="group" aria-label="تفاصيل الموظفين المطلوب تغطيتهم">
                  <div className="data-table-head">
                    <span>الاسم</span>
                    <span>المسمى الوظيفي</span>
                    <span>الراتب الشهري</span>
                    <span>مدة الخدمة</span>
                    <span>مبلغ التغطية المطلوب</span>
                  </div>
                  {[1, 2, 3].map((row) => (
                    <div className="data-table-row" key={row}>
                      <input aria-label={`اسم الموظف ${row}`} type="text" />
                      <input aria-label={`المسمى الوظيفي ${row}`} type="text" />
                      <input aria-label={`الراتب الشهري ${row}`} type="text" inputMode="decimal" />
                      <input aria-label={`مدة الخدمة ${row}`} type="text" />
                      <input aria-label={`مبلغ التغطية المطلوب ${row}`} type="text" inputMode="decimal" />
                    </div>
                  ))}
                </div>
                <p className="api-note">يمكن إرفاق قائمة إضافية عند تفعيل رفع المرفقات وربط API.</p>
              </section>

              <section className="panel civil-section">
                <h2>4. تفاصيل التغطية المطلوبة</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>الحد الأقصى لكل مطالبة (Per Loss Limit)</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>الحد الأقصى لكل موظف (Per Employee Limit)</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                </div>
                <fieldset className="civil-checks">
                  <legend>فترة الاكتشاف بعد انتهاء الوثيقة</legend>
                  <label><input type="checkbox" /> 3 أشهر</label>
                  <label><input type="checkbox" /> 6 أشهر</label>
                  <label><input type="checkbox" /> 12 شهراً</label>
                </fieldset>
              </section>

              <section className="panel civil-section">
                <h2>5. تفاصيل نظام الرقابة والإجراءات الداخلية</h2>
                <div className="data-table control-table" role="group" aria-label="تفاصيل نظام الرقابة والإجراءات الداخلية">
                  <div className="data-table-head">
                    <span>السؤال</span>
                    <span>نعم / لا</span>
                    <span>ملاحظات</span>
                  </div>
                  {[
                    "هل تتم مراجعة الحسابات بانتظام؟",
                    "هل تُراجع السجلات من قبل مدقق خارجي؟",
                    "هل يُطلب توقيع مزدوج على الصكوك؟",
                    "هل هناك نظام لكاميرات المراقبة؟",
                    "هل يتم تغيير المهام الوظيفية بشكل دوري؟",
                  ].map((question) => (
                    <div className="data-table-row" key={question}>
                      <span className="table-question">{question}</span>
                      <fieldset className="inline-choice">
                        <label><input type="radio" name={question} /> نعم</label>
                        <label><input type="radio" name={question} /> لا</label>
                      </fieldset>
                      <input aria-label={`ملاحظات ${question}`} type="text" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>6. خسائر سابقة (إن وجدت)</h2>
                <div className="data-table prior-loss-table" role="group" aria-label="خسائر سابقة">
                  <div className="data-table-head">
                    <span>السؤال</span>
                    <span>نعم / لا</span>
                    <span>إذا نعم، يرجى التوضيح</span>
                  </div>
                  {[
                    "هل سبق أن تعرضت المنشأة لحالة خيانة أمانة من موظف؟",
                    "هل سبق وتم رفض أو إلغاء أو عدم تجديد وثيقة مشابهة؟",
                  ].map((question) => (
                    <div className="data-table-row" key={question}>
                      <span className="table-question">{question}</span>
                      <fieldset className="inline-choice">
                        <label><input type="radio" name={question} /> نعم</label>
                        <label><input type="radio" name={question} /> لا</label>
                      </fieldset>
                      <input aria-label={`توضيح ${question}`} type="text" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>7. الإقرار والتوقيع</h2>
                <label className="civil-declaration">
                  <input type="checkbox" />
                  <span>
                    أقر أنا الموقع أدناه أن جميع المعلومات أعلاه صحيحة وكاملة حسب علمي، وأفهم أن أي إخفاء أو تقديم معلومات غير صحيحة قد يؤدي إلى رفض المطالبة أو إلغاء الوثيقة.
                  </span>
                </label>
                <div className="grid two">
                  <label className="civil-field">
                    <span>الاسم الكامل</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>الصفة / المسمى الوظيفي</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>التوقيع</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>التاريخ</span>
                    <input type="date" />
                  </label>
                </div>
                <p className="api-note">هذه البوابة جاهزة كواجهة أولية، وسيتم تفعيل الإرسال بعد ربط API الخاص بطلبات خيانة الأمانة.</p>
                <button className="submit-button" type="submit" disabled>
                  <CheckCircle2 size={20} aria-hidden="true" />
                  إرسال الطلب
                </button>
              </section>
            </form>
          </motion.section>
        ) : null}

        {showCashInSafePage ? (
          <motion.section className="civil-page" {...sectionAnimation}>
            <div className="civil-header">
              <span className="eyebrow">
                <ShieldCheck size={18} aria-hidden="true" />
                Money in Safe Insurance Proposal Form
              </span>
              <h1>استمارة طلب تأمين حفظ النقد</h1>
              <p>
                هذه الاستمارة مخصصة لتقييم تغطية النقد المحتفظ به داخل الخزنة، وتفاصيل الخزنة، أنظمة الحماية، والخسائر أو الوثائق السابقة.
              </p>
            </div>
            <figure className="portal-hero-image">
              <img src="/brand/portals/cash-in-safe.png" alt="استمارة طلب تأمين حفظ النقد" />
            </figure>

            <form className="civil-form" onSubmit={(event) => event.preventDefault()}>
              <section className="panel civil-section">
                <h2>1. معلومات مقدم الطلب</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>اسم الشركة / المؤسسة</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>نوع الكيان</span>
                    <select defaultValue="">
                      <option value="" disabled>اختر نوع الكيان</option>
                      <option>فرد</option>
                      <option>شركة</option>
                      <option>مؤسسة حكومية</option>
                    </select>
                  </label>
                  <label className="civil-field">
                    <span>السجل التجاري / الترخيص</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>النشاط التجاري</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>العنوان الكامل</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهاتف</span>
                    <input type="tel" />
                  </label>
                  <label className="civil-field">
                    <span>البريد الإلكتروني</span>
                    <input type="email" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>2. تفاصيل التغطية المطلوبة</h2>
                <div className="grid three">
                  <label className="civil-field">
                    <span>النقد أثناء الحفظ (في الخزنة)</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>الأضرار التي تلحق بالخزنة</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>تغطية في أيام الإجازات والعطل الرسمية</span>
                    <input type="text" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>3. تفاصيل الخزنة ومكان الحفظ</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>عدد الخزن المتوفرة</span>
                    <input type="number" min="0" />
                  </label>
                  <label className="civil-field">
                    <span>موقع الخزنة داخل المنشأة</span>
                    <input type="text" />
                  </label>
                </div>
                <fieldset className="civil-checks">
                  <legend>نوع الخزنة</legend>
                  <label><input type="checkbox" /> خزنة فولاذية</label>
                  <label><input type="checkbox" /> مقاومة للحريق</label>
                  <label><input type="checkbox" /> أخرى</label>
                </fieldset>
                <label className="civil-field">
                  <span>أخرى، يرجى التحديد</span>
                  <input type="text" />
                </label>
                <fieldset className="civil-checks">
                  <legend>نوع الإغلاق</legend>
                  <label><input type="checkbox" /> قفل مفتاح</label>
                  <label><input type="checkbox" /> قفل رقمي</label>
                  <label><input type="checkbox" /> بيومتري</label>
                </fieldset>
                <fieldset className="civil-choice">
                  <legend>هل الخزنة مثبتة بالأرض أو الجدار؟</legend>
                  <label><input type="radio" name="safe-fixed" /> نعم</label>
                  <label><input type="radio" name="safe-fixed" /> لا</label>
                </fieldset>
                <fieldset className="civil-choice">
                  <legend>هل الخزنة في غرفة محصنة أو مقفلة؟</legend>
                  <label><input type="radio" name="safe-room" /> نعم</label>
                  <label><input type="radio" name="safe-room" /> لا</label>
                </fieldset>
                <fieldset className="civil-choice">
                  <legend>هل يوجد نظام إنذار أو مراقبة؟</legend>
                  <label><input type="radio" name="alarm-system" /> نعم</label>
                  <label><input type="radio" name="alarm-system" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>إذا نعم، نوع النظام</span>
                  <input type="text" />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>4. تفاصيل مبالغ النقد المحتفظ بها</h2>
                <div className="grid three">
                  <label className="civil-field">
                    <span>الحد الأقصى للمبلغ المحتفظ به في أي وقت</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>متوسط النقد اليومي في الخزنة</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>أعلى مبلغ يتم الاحتفاظ به خلال عطلة نهاية الأسبوع</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>5. الخسائر السابقة</h2>
                <div className="data-table prior-loss-table" role="group" aria-label="الخسائر السابقة">
                  <div className="data-table-head">
                    <span>السؤال</span>
                    <span>نعم / لا</span>
                    <span>إذا نعم، يرجى التوضيح</span>
                  </div>
                  {[
                    "هل سبق وتعرضت المنشأة لخسارة في النقد؟",
                    "هل سبق وتم رفض أو إلغاء وثيقة تأمين مشابهة؟",
                  ].map((question) => (
                    <div className="data-table-row" key={question}>
                      <span className="table-question">{question}</span>
                      <fieldset className="inline-choice">
                        <label><input type="radio" name={question} /> نعم</label>
                        <label><input type="radio" name={question} /> لا</label>
                      </fieldset>
                      <input aria-label={`توضيح ${question}`} type="text" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>6. تفاصيل الوثائق التأمينية الحالية (إن وجدت)</h2>
                <div className="data-table policies-table" role="group" aria-label="تفاصيل الوثائق التأمينية الحالية">
                  <div className="data-table-head">
                    <span>نوع الوثيقة</span>
                    <span>شركة التأمين</span>
                    <span>رقم الوثيقة</span>
                    <span>تاريخ الانتهاء</span>
                  </div>
                  {[1, 2].map((row) => (
                    <div className="data-table-row" key={row}>
                      <input aria-label={`نوع الوثيقة ${row}`} type="text" />
                      <input aria-label={`شركة التأمين ${row}`} type="text" />
                      <input aria-label={`رقم الوثيقة ${row}`} type="text" />
                      <input aria-label={`تاريخ الانتهاء ${row}`} type="date" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>7. الإقرار والتوقيع</h2>
                <label className="civil-declaration">
                  <input type="checkbox" />
                  <span>
                    أقر أنا الموقع أدناه بأن جميع المعلومات المقدمة أعلاه صحيحة وكاملة حسب علمي، وأفوض شركة التأمين باستخدامها لغرض تقييم وإصدار الوثيقة. أفهم أن تقديم معلومات غير صحيحة أو إغفال معلومات جوهرية قد يؤدي إلى رفض المطالبة أو إلغاء الوثيقة.
                  </span>
                </label>
                <p className="api-note">هذه البوابة جاهزة كواجهة أولية، وسيتم تفعيل الإرسال بعد ربط API الخاص بطلبات حفظ النقد.</p>
                <button className="submit-button" type="submit" disabled>
                  <ShieldCheck size={20} aria-hidden="true" />
                  إرسال الطلب
                </button>
              </section>
            </form>
          </motion.section>
        ) : null}

        {showContractorsRiskPage ? (
          <motion.section className="civil-page" {...sectionAnimation}>
            <div className="civil-header">
              <span className="eyebrow">
                <Building2 size={18} aria-hidden="true" />
                Contractors All Risks Insurance Proposal Form
              </span>
              <h1>استمارة طلب تأمين جميع أخطار المقاولين</h1>
              <p>
                هذه الاستمارة مخصصة لتقييم مشروع المقاولات، مبالغ التأمين المطلوبة، المخاطر الفنية، والتغطيات الإضافية قبل إصدار العرض التأميني.
              </p>
            </div>
            <figure className="portal-hero-image">
              <img src="/brand/portals/contractors-risk.png" alt="استمارة طلب تأمين جميع أخطار المقاولين" />
            </figure>

            <form className="civil-form" onSubmit={(event) => event.preventDefault()}>
              <section className="panel civil-section">
                <h2>1. معلومات عامة</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>اسم طالب التأمين</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>نوع الكيان</span>
                    <select defaultValue="">
                      <option value="" disabled>اختر نوع الكيان</option>
                      <option>فرد</option>
                      <option>شركة</option>
                      <option>مؤسسة حكومية</option>
                    </select>
                  </label>
                  <label className="civil-field">
                    <span>العنوان الكامل</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهاتف</span>
                    <input type="tel" />
                  </label>
                  <label className="civil-field">
                    <span>البريد الإلكتروني</span>
                    <input type="email" />
                  </label>
                  <label className="civil-field">
                    <span>رقم السجل التجاري</span>
                    <input type="text" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>2. معلومات المشروع</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>اسم المشروع</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>الموقع الجغرافي</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>المالك الرئيسي للمشروع</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>الجهة المستفيدة</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>تاريخ بدء العمل</span>
                    <input type="date" />
                  </label>
                  <label className="civil-field">
                    <span>المدة المتوقعة للتنفيذ</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>تاريخ الانتهاء المتوقع</span>
                    <input type="date" />
                  </label>
                  <label className="civil-field">
                    <span>فترة الصيانة</span>
                    <input type="text" />
                  </label>
                </div>
                <label className="civil-field">
                  <span>وصف مختصر للمشروع</span>
                  <textarea rows={4} />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>3. مبالغ التأمين المطلوبة</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>عملة العقد</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>قيمة العقد (الأعمال المدنية والإنشائية)</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>معدات وآليات المقاول</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>مباني مؤقتة / مكاتب الموقع</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                  <label className="civil-field">
                    <span>مسؤولية تجاه الطرف الثالث (الأضرار الجسدية والمادية)</span>
                    <input type="text" inputMode="decimal" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>4. تفاصيل إضافية</h2>
                <div className="data-table prior-loss-table" role="group" aria-label="تفاصيل إضافية عن المشروع">
                  <div className="data-table-head">
                    <span>البند</span>
                    <span>نعم / لا</span>
                    <span>ملاحظات</span>
                  </div>
                  {[
                    "هل سبق أن تم تنفيذ مشاريع مشابهة؟",
                    "هل تم تنفيذ المشروع على أرض غير مستقرة أو معرضة للكوارث؟",
                    "هل تم تنفيذ دراسة جيولوجية للموقع؟",
                    "هل يتطلب المشروع استخدام متفجرات؟",
                    "هل يشمل المشروع أعمال تحت الماء أو تحت الأرض؟",
                  ].map((question) => (
                    <div className="data-table-row" key={question}>
                      <span className="table-question">{question}</span>
                      <fieldset className="inline-choice">
                        <label><input type="radio" name={question} /> نعم</label>
                        <label><input type="radio" name={question} /> لا</label>
                      </fieldset>
                      <input aria-label={`ملاحظات ${question}`} type="text" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>5. التغطيات الإضافية المطلوبة (اختياري)</h2>
                <fieldset className="civil-checks">
                  <legend>يرجى وضع علامة أمام التغطيات المطلوبة</legend>
                  <label><input type="checkbox" /> تغطية الكوارث الطبيعية (سيول، زلازل، فيضانات)</label>
                  <label><input type="checkbox" /> السرقة</label>
                  <label><input type="checkbox" /> أعمال الشغب والاضطرابات</label>
                  <label><input type="checkbox" /> أخطار الحرب والإرهاب</label>
                  <label><input type="checkbox" /> تمديد فترة الصيانة</label>
                </fieldset>
              </section>

              <section className="panel civil-section">
                <h2>6. الإقرارات</h2>
                <label className="civil-declaration">
                  <input type="checkbox" />
                  <span>
                    أقر أنا الموقع أدناه بأن جميع المعلومات الواردة أعلاه صحيحة وكاملة حسب علمي، وأفهم أن أي معلومات غير صحيحة أو ناقصة قد تؤدي إلى رفض أو إلغاء التأمين.
                  </span>
                </label>
                <p className="api-note">هذه البوابة جاهزة كواجهة أولية، وسيتم تفعيل الإرسال بعد ربط API الخاص بطلبات جميع أخطار المقاولين.</p>
                <button className="submit-button" type="submit" disabled>
                  <Building2 size={20} aria-hidden="true" />
                  إرسال الطلب
                </button>
              </section>
            </form>
          </motion.section>
        ) : null}

        {showPersonalAccidentPage ? (
          <motion.section className="civil-page" {...sectionAnimation}>
            <div className="civil-header">
              <span className="eyebrow">
                <ShieldCheck size={18} aria-hidden="true" />
                Personal Accident Insurance Proposal Form
              </span>
              <h1>استمارة طلب تأمين الحوادث الشخصية</h1>
              <p>
                هذه الاستمارة مخصصة لتقييم بيانات مقدم الطلب، طبيعة العمل، التغطيات المطلوبة، الحالة الصحية، وأي وثائق أو طلبات سابقة.
              </p>
            </div>
            <figure className="portal-hero-image">
              <img src="/brand/portals/personal-accident.png" alt="استمارة طلب تأمين الحوادث الشخصية" />
            </figure>

            <form className="civil-form" onSubmit={(event) => event.preventDefault()}>
              <section className="panel civil-section">
                <h2>1. معلومات الطلب</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>الاسم الكامل</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>العنوان الكامل</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الجوال</span>
                    <input type="tel" />
                  </label>
                  <label className="civil-field">
                    <span>البريد الإلكتروني</span>
                    <input type="email" />
                  </label>
                  <label className="civil-field">
                    <span>طبيعة العمل</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>عدد المؤمنين</span>
                    <input type="number" min="1" />
                  </label>
                  <label className="civil-field">
                    <span>الجنسية</span>
                    <input type="text" />
                  </label>
                </div>
                <fieldset className="civil-choice">
                  <legend>هل يتضمن العمل استخدام معدات خطرة أو التعرض لمخاطر جسدية؟</legend>
                  <label><input type="radio" name="hazardous-work" /> نعم</label>
                  <label><input type="radio" name="hazardous-work" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>إذا كانت الإجابة نعم، يرجى التوضيح</span>
                  <textarea rows={3} />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>2. التغطية المطلوبة</h2>
                <div className="data-table accident-cover-table" role="group" aria-label="التغطية المطلوبة">
                  <div className="data-table-head">
                    <span>نوع التغطية</span>
                    <span>مبلغ التغطية</span>
                    <span>اختيار</span>
                  </div>
                  {[
                    "الوفاة نتيجة حادث",
                    "العجز الكلي الدائم نتيجة حادث",
                    "العجز الجزئي الدائم نتيجة حادث",
                    "العجز الكلي المؤقت نتيجة حادث",
                    "العجز الجزئي المؤقت نتيجة حادث",
                    "المصاريف الطبية الطارئة نتيجة حادث",
                  ].map((coverage) => (
                    <div className="data-table-row" key={coverage}>
                      <span className="table-question">{coverage}</span>
                      <input aria-label={`مبلغ ${coverage}`} type="text" inputMode="decimal" />
                      <fieldset className="inline-choice">
                        <label><input type="checkbox" /> مطلوب</label>
                      </fieldset>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>3. الحالة الصحية</h2>
                <div className="data-table prior-loss-table" role="group" aria-label="الحالة الصحية">
                  <div className="data-table-head">
                    <span>السؤال</span>
                    <span>نعم / لا</span>
                    <span>إذا نعم، يرجى التوضيح</span>
                  </div>
                  {[
                    "هل تعاني من أي مرض مزمن؟",
                    "هل سبق وتعرضت لأي حادث خطير؟",
                    "هل لديك أي إعاقات حالية؟",
                  ].map((question) => (
                    <div className="data-table-row" key={question}>
                      <span className="table-question">{question}</span>
                      <fieldset className="inline-choice">
                        <label><input type="radio" name={question} /> نعم</label>
                        <label><input type="radio" name={question} /> لا</label>
                      </fieldset>
                      <input aria-label={`توضيح ${question}`} type="text" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>4. معلومات إضافية</h2>
                <fieldset className="civil-choice">
                  <legend>هل سبق وتم إصدار وثيقة تأمين حوادث شخصية لك؟</legend>
                  <label><input type="radio" name="previous-pa-policy" /> نعم</label>
                  <label><input type="radio" name="previous-pa-policy" /> لا</label>
                </fieldset>
                <fieldset className="civil-choice">
                  <legend>هل تم رفض طلب تأمين لك في السابق؟</legend>
                  <label><input type="radio" name="previous-pa-decline" /> نعم</label>
                  <label><input type="radio" name="previous-pa-decline" /> لا</label>
                </fieldset>
                <fieldset className="civil-choice">
                  <legend>هل توجد وثائق تأمين أخرى سارية؟ (صحية / حوادث / حياة)</legend>
                  <label><input type="radio" name="other-active-policies" /> نعم</label>
                  <label><input type="radio" name="other-active-policies" /> لا</label>
                </fieldset>
              </section>

              <section className="panel civil-section">
                <h2>5. الإقرار والتوقيع</h2>
                <label className="civil-declaration">
                  <input type="checkbox" />
                  <span>
                    أقر أنا الموقع أدناه بأن جميع المعلومات المذكورة في هذه الاستمارة صحيحة وكاملة حسب علمي، وأفهم أن أي معلومات غير صحيحة أو إغفال معلومات جوهرية قد يؤدي إلى إلغاء الوثيقة أو رفض المطالبات.
                  </span>
                </label>
                <p className="api-note">هذه البوابة جاهزة كواجهة أولية، وسيتم تفعيل الإرسال بعد ربط API الخاص بطلبات الحوادث الشخصية.</p>
                <button className="submit-button" type="submit" disabled>
                  <ShieldCheck size={20} aria-hidden="true" />
                  إرسال الطلب
                </button>
              </section>
            </form>
          </motion.section>
        ) : null}

        {showWorkersCompPage ? (
          <motion.section className="civil-page" {...sectionAnimation}>
            <div className="civil-header">
              <span className="eyebrow">
                <Building2 size={18} aria-hidden="true" />
                Workmen's Compensation / Employer's Liability Insurance Proposal Form
              </span>
              <h1>استمارة طلب تأمين إصابات العمال</h1>
              <p>
                هذه الاستمارة مخصصة لتقييم بيانات صاحب العمل، فئات العمال المؤمن عليهم، التغطية المطلوبة، طبيعة موقع العمل، والمطالبات السابقة.
              </p>
            </div>
            <figure className="portal-hero-image">
              <img src="/brand/portals/workers-comp.png" alt="استمارة طلب تأمين إصابات العمال" />
            </figure>

            <form className="civil-form" onSubmit={(event) => event.preventDefault()}>
              <section className="panel civil-section">
                <h2>1. معلومات صاحب العمل (المؤمن له)</h2>
                <div className="grid two">
                  <label className="civil-field">
                    <span>اسم الشركة / المؤسسة</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>نوع النشاط</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>السجل التجاري / الترخيص</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>العنوان</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>رقم الهاتف</span>
                    <input type="tel" />
                  </label>
                  <label className="civil-field">
                    <span>البريد الإلكتروني</span>
                    <input type="email" />
                  </label>
                </div>
              </section>

              <section className="panel civil-section">
                <h2>2. تفاصيل العمال المؤمن عليهم</h2>
                <div className="data-table workers-table" role="group" aria-label="تفاصيل العمال المؤمن عليهم">
                  <div className="data-table-head">
                    <span>الفئة</span>
                    <span>عدد العمال</span>
                    <span>متوسط الراتب الشهري</span>
                    <span>المسمى الوظيفي / المهام</span>
                  </div>
                  {["فنيون", "عمال", "سائقون", "إداريون", "الإجمالي"].map((category) => (
                    <div className="data-table-row" key={category}>
                      <span className="table-question">{category}</span>
                      <input aria-label={`عدد العمال ${category}`} type="number" min="0" />
                      <input aria-label={`متوسط الراتب الشهري ${category}`} type="text" inputMode="decimal" disabled={category === "الإجمالي"} />
                      <input aria-label={`المسمى الوظيفي أو المهام ${category}`} type="text" disabled={category === "الإجمالي"} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>3. تفاصيل التغطية المطلوبة</h2>
                <div className="data-table accident-cover-table" role="group" aria-label="تفاصيل التغطية المطلوبة">
                  <div className="data-table-head">
                    <span>نوع التغطية</span>
                    <span>مبلغ / حد التغطية</span>
                    <span>اختيار</span>
                  </div>
                  {[
                    "الوفاة أثناء العمل",
                    "العجز الكلي الدائم",
                    "العجز الجزئي الدائم",
                    "المصاريف الطبية - بحد أقصى",
                    "تغطية مسؤولية صاحب العمل تجاه عائلة العامل",
                  ].map((coverage) => (
                    <div className="data-table-row" key={coverage}>
                      <span className="table-question">{coverage}</span>
                      <input aria-label={`مبلغ ${coverage}`} type="text" inputMode="decimal" />
                      <fieldset className="inline-choice">
                        <label><input type="checkbox" /> مطلوب</label>
                      </fieldset>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>4. تفاصيل ساعات ومكان العمل</h2>
                <div className="grid three">
                  <label className="civil-field">
                    <span>موقع تنفيذ العمل الرئيسي</span>
                    <input type="text" />
                  </label>
                  <label className="civil-field">
                    <span>عدد ساعات العمل اليومية</span>
                    <input type="number" min="0" />
                  </label>
                  <label className="civil-field">
                    <span>عدد أيام العمل الأسبوعية</span>
                    <input type="number" min="0" max="7" />
                  </label>
                </div>
                <fieldset className="civil-choice">
                  <legend>هل هناك أعمال خطرة؟ مثل العمل في المرتفعات، تحت الأرض، كهرباء...</legend>
                  <label><input type="radio" name="dangerous-work" /> نعم</label>
                  <label><input type="radio" name="dangerous-work" /> لا</label>
                </fieldset>
                <label className="civil-field">
                  <span>إذا كانت الإجابة نعم، يرجى التوضيح</span>
                  <textarea rows={4} />
                </label>
              </section>

              <section className="panel civil-section">
                <h2>5. المطالبات السابقة</h2>
                <div className="data-table prior-loss-table" role="group" aria-label="المطالبات السابقة">
                  <div className="data-table-head">
                    <span>السؤال</span>
                    <span>نعم / لا</span>
                    <span>إذا نعم، يرجى التوضيح</span>
                  </div>
                  {[
                    "هل سبق أن تعرضت الشركة لأي مطالبات تتعلق بإصابات عمالية؟",
                    "هل تم رفض أو إلغاء وثيقة تأمين إصابات عمالية سابقاً؟",
                  ].map((question) => (
                    <div className="data-table-row" key={question}>
                      <span className="table-question">{question}</span>
                      <fieldset className="inline-choice">
                        <label><input type="radio" name={question} /> نعم</label>
                        <label><input type="radio" name={question} /> لا</label>
                      </fieldset>
                      <input aria-label={`توضيح ${question}`} type="text" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel civil-section">
                <h2>6. الإقرار والتوقيع</h2>
                <label className="civil-declaration">
                  <input type="checkbox" />
                  <span>
                    أقر أنا الموقع أدناه بأن كافة البيانات والمعلومات المذكورة في هذه الاستمارة صحيحة وكاملة، وأفهم أن أي تقديم خاطئ أو إغفال لمعلومات جوهرية قد يؤدي إلى إلغاء التأمين أو رفض المطالبة.
                  </span>
                </label>
                <p className="api-note">هذه البوابة جاهزة كواجهة أولية، وسيتم تفعيل الإرسال بعد ربط API الخاص بطلبات إصابات العمال.</p>
                <button className="submit-button" type="submit" disabled>
                  <Building2 size={20} aria-hidden="true" />
                  إرسال الطلب
                </button>
              </section>
            </form>
          </motion.section>
        ) : null}

        {showTrackingPage ? (
        <motion.section id="track-request" className="panel tracking-panel" {...sectionAnimation}>
          <div className="tracking-header">
            <span className="eyebrow">
              <FileSearch size={18} aria-hidden="true" />
              {t.trackEyebrow}
            </span>
            <h2>{t.trackTitle}</h2>
            <p>{t.trackSubtitle}</p>
          </div>

          <form className="tracking-form" onSubmit={lookupTracking}>
            <FloatingField
              id="tracking-code"
              label={t.trackingNumber}
              value={trackingInput}
              required
              onChange={(event) => setTrackingInput(event.target.value)}
            />
            <button className="submit-button" type="submit" disabled={isTracking || isFormLocked}>
              {isTracking ? <span className="spinner" aria-hidden="true" /> : <MapPinned size={20} aria-hidden="true" />}
              {isTracking ? t.trackingLoading : t.trackButton}
            </button>
          </form>

          {trackingError ? <p className="submit-error" role="alert">{trackingError}</p> : null}

          <ol
            className={`tracking-timeline status-${trackingTheme.name}`}
            style={trackingThemeStyle}
            aria-label={t.trackTitle}
          >
            {trackingSteps.map((step, index) => {
              const isDone = trackingLookup ? index <= trackingActiveIndex : index === 0;
              const isActive = trackingLookup ? index === trackingActiveIndex : index === 0;

              return (
                <li key={step} className={`${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                  <span className="timeline-dot">
                    {isDone ? <CheckCircle2 size={20} aria-hidden="true" /> : <Clock3 size={18} aria-hidden="true" />}
                  </span>
                  <strong>{step}</strong>
                  <small>{isDone ? t.completed : t.pending}</small>
                </li>
              );
            })}
          </ol>

          {trackingLookup ? (
            <motion.div
              className="tracking-modal-backdrop"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={() => setTrackingLookup(null)}
            >
              <motion.div
                className={`tracking-modal status-${trackingTheme.name}`}
                style={trackingThemeStyle}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tracking-modal-title"
                initial={{ opacity: 0, y: 22, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22 }}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button className="modal-close" type="button" onClick={() => setTrackingLookup(null)} aria-label={closeTrackingLabel}>
                  <X size={20} aria-hidden="true" />
                </button>

                <div className="tracking-modal-head">
                  <span className="status-mark">
                    {trackingLookup.status === "REJECTED" ? <AlertTriangle size={26} aria-hidden="true" /> : <ClipboardList size={26} aria-hidden="true" />}
                  </span>
                  <div>
                    <span className="modal-eyebrow">{t.trackEyebrow}</span>
                    <h3 id="tracking-modal-title">{trackingDialogTitle}</h3>
                    <p>{trackingDialogSubtitle}</p>
                  </div>
                </div>

                <section className="status-hero" aria-label={t.currentStatus}>
                  <span>{t.currentStatus}</span>
                  <strong>{trackingLookup.statusLabel}</strong>
                  <p>{trackingStatusDescription[language][trackingLookup.status]}</p>
                </section>

                <dl className="tracking-modal-details">
                  <div>
                    <dt>{t.trackingNumber}</dt>
                    <dd>{trackingLookup.trackingNumber}</dd>
                  </div>
                  <div>
                    <dt>{t.requestNumber}</dt>
                    <dd>{trackingLookup.requestNumber}</dd>
                  </div>
                  <div>
                    <dt>{t.customer}</dt>
                    <dd>{trackingLookup.customerName}</dd>
                  </div>
                  <div>
                    <dt>{t.vehicle}</dt>
                    <dd>{trackingLookup.vehicle}</dd>
                  </div>
                  <div>
                    <dt>{t.updatedAt}</dt>
                    <dd>{trackingUpdatedAt}</dd>
                  </div>
                  <div>
                    <dt>{t.statusCode}</dt>
                    <dd>{trackingLookup.status}</dd>
                  </div>
                </dl>

                <ol className="tracking-modal-steps" aria-label={t.trackTitle}>
                  {trackingSteps.map((step, index) => {
                    const isDone = index <= trackingActiveIndex;
                    const isActive = index === trackingActiveIndex;

                    return (
                      <li key={step} className={`${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                        <span>{isDone ? <CheckCircle2 size={18} aria-hidden="true" /> : <Clock3 size={17} aria-hidden="true" />}</span>
                        <div>
                          <strong>{step}</strong>
                          <small>{isDone ? t.completed : t.pending}</small>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </motion.div>
            </motion.div>
          ) : null}
        </motion.section>
        ) : null}

        {showSupportPage ? (
        <motion.section id="support" className="support-page" {...sectionAnimation}>
          <div className="support-hero">
            <span className="eyebrow">
              <Building2 size={18} aria-hidden="true" />
              {t.supportEyebrow}
            </span>
            <h2>{t.supportTitle}</h2>
            <p>{t.supportSubtitle}</p>
            <strong>{t.supportTagline}</strong>
          </div>

          <div className="support-grid">
            <article className="support-card contact-card">
              <span className="support-icon">
                <Phone size={22} aria-hidden="true" />
              </span>
              <h3>{t.contactNumbers}</h3>
              <div className="contact-list">
                {supportPhones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`}>
                    {phone}
                  </a>
                ))}
              </div>
            </article>

            <article className="support-card">
              <span className="support-icon">
                <MessageCircle size={22} aria-hidden="true" />
              </span>
              <h3>{t.whatsappFollowup}</h3>
              <div className="whatsapp-list">
                {supportWhatsApp.map((item) => (
                  <a key={item.href} className="whatsapp-link" href={item.href} target="_blank" rel="noreferrer">
                    <MessageCircle size={18} aria-hidden="true" />
                    {item.number}
                  </a>
                ))}
              </div>
            </article>

            <article className="support-card">
              <span className="support-icon">
                <Globe2 size={22} aria-hidden="true" />
              </span>
              <h3>{t.website}</h3>
              <a className="support-action" href="https://iraq-takaful.com/" target="_blank" rel="noreferrer">
                iraq-takaful.com
                <ExternalLink size={18} aria-hidden="true" />
              </a>
            </article>

            <article className="support-card">
              <span className="support-icon">
                <Mail size={22} aria-hidden="true" />
              </span>
              <h3>{t.supportEmail}</h3>
              <a className="support-action" href="mailto:info@iraq-takaful.com">
                info@iraq-takaful.com
                <Mail size={18} aria-hidden="true" />
              </a>
            </article>

            <article className="support-card address-card">
              <span className="support-icon">
                <MapPin size={22} aria-hidden="true" />
              </span>
              <h3>{t.addressTitle}</h3>
              <p>{t.supportAddress}</p>
            </article>
          </div>
        </motion.section>
        ) : null}

        {showHome ? (
          <>
        <ProgressSteps steps={steps} completed={completed} labels={{ completed: t.completed, pending: t.pending }} />

        <form id="request-form" className="request-form" onSubmit={submit} noValidate aria-busy={isFormLocked}>
          <fieldset className="form-fieldset" disabled={isFormLocked}>
            <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.customer}</h2>
            <div className="grid two">
              <FloatingField id="fullName" label={t.fullName} value={form.fullName} error={errors.fullName} required onChange={setValue("fullName")} />
              <FloatingField id="phone" label={t.phone} value={form.phone} error={errors.phone} required inputMode="tel" onChange={setValue("phone")} />
              <FloatingField id="email" label={t.email} value={form.email} error={errors.email} type="email" onChange={setValue("email")} />
              <FloatingField id="nationalId" label={t.nationalId} value={form.nationalId} error={errors.nationalId} required onChange={setValue("nationalId")} />
              <FloatingField id="address" label={t.address} value={form.address} error={errors.address} required onChange={setValue("address")} />
              <FloatingField id="city" label={t.city} value={form.city} error={errors.city} required onChange={setValue("city")} />
            </div>
          </motion.section>

          <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.vehicle}</h2>
            <div className="grid three">
              <FloatingField id="vehicleType" label={t.vehicleType} value={form.vehicleType} error={errors.vehicleType} required onChange={setValue("vehicleType")} />
              <FloatingField id="manufacturer" label={t.manufacturer} value={form.manufacturer} error={errors.manufacturer} required onChange={setValue("manufacturer")} />
              <FloatingField id="model" label={t.model} value={form.model} error={errors.model} required onChange={setValue("model")} />
              <FloatingField id="year" label={t.year} value={form.year} error={errors.year} required inputMode="numeric" onChange={setValue("year")} />
              <FloatingField id="color" label={t.color} value={form.color} error={errors.color} required onChange={setValue("color")} />
              <FloatingField id="plateNumber" label={t.plateNumber} value={form.plateNumber} error={errors.plateNumber} required onChange={setValue("plateNumber")} />
              <FloatingField id="chassisNumber" label={t.chassisNumber} value={form.chassisNumber} error={errors.chassisNumber} required onChange={setValue("chassisNumber")} />
              <FloatingField id="engineNumber" label={t.engineNumber} value={form.engineNumber} error={errors.engineNumber} required onChange={setValue("engineNumber")} />
              <FloatingField id="estimatedValue" label={t.estimatedValue} value={form.estimatedValue} error={errors.estimatedValue} required inputMode="decimal" onChange={setValue("estimatedValue")} />
            </div>
          </motion.section>

          <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.images}</h2>
            <UploadZone
              title={t.uploadImages}
              hint={t.uploadHint}
              rule={t.imageRule}
              files={vehicleImages}
              onChange={(files) => {
                setVehicleImages(files);
                setErrors((current) => ({ ...current, vehicleImages: undefined }));
              }}
              error={errors.vehicleImages}
              labels={uploadLabels}
            />
          </motion.section>

          <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.documents}</h2>
            {errors.documents ? <p className="error-text section-error">{errors.documents}</p> : null}
            <div className="grid two">
              {documentKeys.map((key) => (
                <DocumentUpload key={key} documentKey={key} label={t[key]} file={documents[key]} onChange={updateDocument} hint={t.uploadHint} labels={uploadLabels} />
              ))}
            </div>
          </motion.section>

          <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.notes}</h2>
            <FloatingField id="notes" label={t.notes} value={form.notes} multiline rows={7} placeholder={t.notesPlaceholder} onChange={setValue("notes")} />
          </motion.section>

          <motion.section className="panel review-panel" {...sectionAnimation}>
            <h2>{t.finalReview}</h2>
            <p>{t.reviewHint}</p>
            <div className="review-grid">
              <span>{t.customer}</span>
              <strong>{form.fullName || "-"}</strong>
              <span>{t.vehicle}</span>
              <strong>{[form.manufacturer, form.model, form.year].filter(Boolean).join(" ") || "-"}</strong>
              <span>{t.images}</span>
              <strong>{vehicleImages.length}</strong>
              <span>{t.documents}</span>
              <strong>{Object.values(documents).filter(Boolean).length} / 6</strong>
            </div>
            <label className={`confirm ${errors.confirmed ? "field-error" : ""}`}>
              <input type="checkbox" checked={form.confirmed} onChange={setValue("confirmed")} />
              <span>{t.confirm}</span>
            </label>
            {errors.confirmed ? <p className="error-text">{errors.confirmed}</p> : null}
            {submitError ? <p className="submit-error" role="alert">{submitError}</p> : null}
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
              {isSubmitting ? t.submitLoading : t.submit}
            </button>
            <aside className="fallback-card" aria-label="رابط بديل لتقديم طلب تأمين المركبات">
              <span className="fallback-icon">
                <Info size={20} aria-hidden="true" />
              </span>
              <div className="fallback-content">
                <p>في حال تعذر إرسال طلب التأمين عبر هذه الصفحة، يمكنك تقديم الطلب من خلال الرابط التالي:</p>
                <a className="fallback-link" href={fallbackFormUrl} target="_blank" rel="noopener noreferrer">
                  طلبات تأمين المركبات
                </a>
              </div>
            </aside>
          </motion.section>

            {requestNumber && trackingNumber ? (
              <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <CheckCircle2 size={42} aria-hidden="true" />
              <h2>{t.apiSuccessTitle}</h2>
              <p>{t.successBody}</p>
              <div className="success-status">
                <span>{t.currentStatus}</span>
                <strong>{t.trackReceived}</strong>
                <p>{trackingStatusDescription[language].RECEIVED}</p>
              </div>
              <div className="success-numbers">
                <div>
                  <span>{t.trackingNumber}</span>
                  <strong>{trackingNumber}</strong>
                </div>
                <div>
                  <span>{t.requestNumber}</span>
                  <strong>{requestNumber}</strong>
                </div>
              </div>
              <div className="success-actions">
                <button className="ghost-button" type="button" onClick={copyRequestNumber}>
                  <Copy size={18} aria-hidden="true" />
                  {copiedRequestNumber ? (language === "ar" ? "تم النسخ" : "Copied") : language === "ar" ? "نسخ رقم الطلب" : "Copy request number"}
                </button>
                <button className="submit-button" type="button" onClick={downloadRequestPdf}>
                  <Download size={18} aria-hidden="true" />
                  {language === "ar" ? "تنزيل الاستمارة PDF" : "Download PDF form"}
                </button>
              </div>
              </motion.section>
            ) : null}
          </fieldset>
        </form>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
