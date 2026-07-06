import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Clock3,
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
import { type CSSProperties, type ChangeEvent, useMemo, useState } from "react";
import { DocumentUpload } from "./components/DocumentUpload";
import { FloatingField } from "./components/FloatingField";
import { ProgressSteps } from "./components/ProgressSteps";
import { UploadZone } from "./components/UploadZone";
import { translations, type Language } from "./i18n";
import { ApiError } from "./services/api";
import { submitMotorRequest, trackMotorRequest, type MotorRequestTracking, type PublicMotorRequestStatus } from "./services/motor-request";
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
  const [form, setForm] = useState<FormState>(initialForm);
  const [vehicleImages, setVehicleImages] = useState<UploadFile[]>([]);
  const [documents, setDocuments] = useState<Partial<Record<DocumentKey, UploadFile>>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingLookup, setTrackingLookup] = useState<MotorRequestTracking | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[language];
  const direction = language === "ar" ? "rtl" : "ltr";

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
    if (isSubmitting) return;

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
        const result = await submitMotorRequest({ form, vehicleImages, documents, agentCode });
        resetForm();
        setRequestNumber(result.requestNumber);
        setTrackingNumber(result.trackingNumber);
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      } catch (error) {
        setSubmitError(getSubmitErrorMessage(error));
      } finally {
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
    <div className={darkMode ? "app dark" : "app"} dir={direction} lang={language}>
      <header className="site-header">
        <a className="brand" href="#top" aria-label={t.brand}>
          <img src="/brand/iraq-takaful-logo.png" alt={t.brand} />
          <span>{t.portal}</span>
        </a>
        <div className="header-actions">
          <a className="icon-button" href="#support">
            <Phone size={18} aria-hidden="true" />
            {t.support}
          </a>
          <button className="icon-button" type="button" onClick={() => setLanguage(language === "ar" ? "en" : "ar")}>
            <Globe2 size={18} aria-hidden="true" />
            {t.language}
          </button>
          <button className="icon-button" type="button" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            {darkMode ? t.light : t.dark}
          </button>
        </div>
      </header>

      <main id="top">
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
            <a className="ghost-link" href="#track-request">
              <MapPinned size={20} aria-hidden="true" />
              {t.trackRequest}
            </a>
            <a className="ghost-link" href="#support">
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
            <button className="submit-button" type="submit" disabled={isTracking}>
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

        <ProgressSteps steps={steps} completed={completed} labels={{ completed: t.completed, pending: t.pending }} />

        <form id="request-form" className="request-form" onSubmit={submit} noValidate>
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
              <strong>
                {t.trackingNumber}: {trackingNumber}
              </strong>
              <strong>
                {t.requestNumber}: {requestNumber}
              </strong>
            </motion.section>
          ) : null}
        </form>
      </main>
    </div>
  );
}

export default App;
