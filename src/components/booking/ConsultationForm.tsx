"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { SigilBadge } from "@/components/ornaments/SigilOrnament";
import { SigilStar } from "@/components/ornaments/SigilStar";
import { ChromeButton } from "@/components/ui/ChromeButton";
import { bookingContent } from "@/content/site-content";
import { instagramProfile, whatsapp } from "@/config/site-config";
import { submitConsultation, type ConsultationState } from "@/app/actions/consultation";

import { ReferenceUploader } from "./ReferenceUploader";
import styles from "./ConsultationForm.module.css";

const copy = bookingContent.form;
const initialState: ConsultationState = { status: "idle" };

export function ConsultationForm() {
  const [state, formAction, pending] = useActionState(submitConsultation, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const mountedAt = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const reduce = useReducedMotion();

  const ids = {
    name: useId(),
    email: useId(),
    phone: useId(),
    idea: useId(),
    placement: useId(),
    size: useId(),
    privacy: useId(),
  };

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  // Reset the form and move focus to the confirmation once the send succeeds.
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      statusRef.current?.focus();
    }
  }, [state.status]);

  const fieldErrors = state.status === "invalid" ? state.fieldErrors : {};
  const errorFor = (field: keyof typeof fieldErrors) => fieldErrors[field];

  /* ---------------------------------------------------------------------- */
  /* Success view                                                            */
  /* ---------------------------------------------------------------------- */
  if (state.status === "success") {
    return (
      <motion.div
        className={styles.success}
        role="status"
        aria-live="polite"
        ref={statusRef}
        tabIndex={-1}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <SigilBadge size={44} />
        <h3 className={styles.successTitle}>{copy.successTitle}</h3>
        <p className={styles.successBody}>{copy.successBody}</p>
      </motion.div>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formData.set("elapsedMs", String(Date.now() - mountedAt.current));
        return formAction(formData);
      }}
      className={styles.form}
      noValidate
      onChange={() => setElapsed(Date.now() - mountedAt.current)}
    >
      <p className={styles.formTitle}>
        <SigilStar size={12} />
        <span>{copy.title}</span>
        <SigilStar size={12} />
      </p>

      {/* Honeypot — hidden from users and assistive tech, irresistible to bots. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="website">Non compilare questo campo</label>
        <input id="website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="elapsedMs" value={elapsed} readOnly />

      <div className={styles.row}>
        <Field
          id={ids.name}
          name="name"
          label={copy.fields.name.label}
          placeholder={copy.fields.name.placeholder}
          autoComplete="name"
          required
          error={errorFor("name")}
        />
        <Field
          id={ids.email}
          name="email"
          type="email"
          label={copy.fields.email.label}
          placeholder={copy.fields.email.placeholder}
          autoComplete="email"
          required
          error={errorFor("email")}
        />
      </div>

      <Field
        id={ids.phone}
        name="phone"
        type="tel"
        label={copy.fields.phone.label}
        optionalHint={copy.fields.phone.optionalHint}
        placeholder={copy.fields.phone.placeholder}
        autoComplete="tel"
        error={errorFor("phone")}
      />

      <Field
        id={ids.idea}
        name="idea"
        as="textarea"
        rows={3}
        label={copy.fields.idea.label}
        placeholder={copy.fields.idea.placeholder}
        required
        error={errorFor("idea")}
      />

      <div className={styles.row}>
        <SelectField
          id={ids.placement}
          name="placement"
          label={copy.fields.placement.label}
          placeholder={copy.fields.placement.placeholder}
          options={bookingContent.placementOptions}
          required
          error={errorFor("placement")}
        />
        <SelectField
          id={ids.size}
          name="size"
          label={copy.fields.size.label}
          placeholder={copy.fields.size.placeholder}
          options={bookingContent.sizeOptions}
          required
          error={errorFor("size")}
        />
      </div>

      <fieldset className={styles.uploadGroup}>
        <legend className={styles.legend}>
          {copy.fields.references.label}
          <span className={styles.optional}>({copy.fields.references.optionalHint})</span>
        </legend>
        <ReferenceUploader name="references" error={errorFor("references")} />
      </fieldset>

      <div className={styles.consent}>
        <input
          id={ids.privacy}
          type="checkbox"
          name="privacy"
          className={styles.checkbox}
          aria-invalid={errorFor("privacy") ? true : undefined}
          aria-describedby={errorFor("privacy") ? `${ids.privacy}-error` : undefined}
        />
        <label htmlFor={ids.privacy} className={styles.consentLabel}>
          {copy.fields.privacy.label}
        </label>
      </div>
      {errorFor("privacy") ? (
        <p id={`${ids.privacy}-error`} className={styles.fieldError} role="alert">
          {errorFor("privacy")}
        </p>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Status messages                                                     */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence mode="wait">
        {state.status === "error" || state.status === "not-configured" ? (
          <motion.div
            key={state.status}
            className={state.status === "not-configured" ? styles.warning : styles.alert}
            role="alert"
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.24 }}
          >
            <strong className={styles.alertTitle}>
              {state.status === "not-configured" ? copy.unconfiguredTitle : copy.errorTitle}
            </strong>
            <span>{state.message}</span>
            <span className={styles.alertChannels}>
              {whatsapp.url ? (
                <a href={whatsapp.url} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              ) : null}
              <a href={instagramProfile.url} target="_blank" rel="noopener noreferrer">
                {instagramProfile.handleWithAt}
              </a>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {state.status === "invalid" ? (
        <p className={styles.alertInline} role="alert">
          Controlla i campi evidenziati e riprova.
        </p>
      ) : null}

      <ChromeButton
        type="submit"
        size="lg"
        variant="solid"
        block
        tracked
        disabled={pending}
        icon={<SigilBadge size={22} />}
        className={styles.submit}
      >
        {pending ? copy.submitting : copy.submit}
      </ChromeButton>

      {/* Politely announced to assistive tech without stealing focus. */}
      <span className="sr-only" role="status" aria-live="polite">
        {pending ? copy.submitting : ""}
      </span>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Fields                                                                     */
/* -------------------------------------------------------------------------- */

function Field({
  id,
  name,
  label,
  placeholder,
  type = "text",
  as = "input",
  rows,
  autoComplete,
  required,
  optionalHint,
  description,
  descriptionId,
  error,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  as?: "input" | "textarea";
  rows?: number;
  autoComplete?: string;
  required?: boolean;
  optionalHint?: string;
  description?: string;
  descriptionId?: string;
  error?: string;
}) {
  const errorId = `${id}-error`;
  const describedBy = [description ? descriptionId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const shared = {
    id,
    name,
    placeholder,
    required,
    autoComplete,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy || undefined,
    className: styles.control,
    "data-invalid": error ? "" : undefined,
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optionalHint ? <span className={styles.optional}>({optionalHint})</span> : null}
      </label>

      {as === "textarea" ? (
        <textarea {...shared} rows={rows} className={`${styles.control} ${styles.textarea}`} />
      ) : (
        <input {...shared} type={type} />
      )}

      {description ? (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  placeholder,
  options,
  required,
  error,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: readonly string[];
  required?: boolean;
  error?: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.selectWrap}>
        <select
          id={id}
          name={name}
          required={required}
          defaultValue=""
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${styles.control} ${styles.select}`}
          data-invalid={error ? "" : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className={styles.selectChevron} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path
              d="M6 9.5 12 15l6-5.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {error ? (
        <p id={errorId} className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
