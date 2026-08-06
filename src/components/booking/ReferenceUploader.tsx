"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useId, useRef, useState } from "react";

import { CloseIcon, UploadIcon } from "@/components/ui/Icons";
import { bookingContent } from "@/content/site-content";
import { consultationUpload } from "@/config/site-config";

import styles from "./ReferenceUploader.module.css";

const copy = bookingContent.form.fields.references;

/**
 * Drag-and-drop / click-to-select reference picker.
 *
 * Files are held locally and only travel with the form submission — nothing is
 * uploaded on selection. Validation runs here for immediate feedback and again
 * on the server, which is the authority.
 */
export function ReferenceUploader({
  name,
  error,
  describedBy,
}: {
  name: string;
  error?: string;
  describedBy?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const hintId = useId();
  const errorId = useId();
  const reduce = useReducedMotion();

  const validate = useCallback((candidates: File[]): { accepted: File[]; error: string | null } => {
    const accepted: File[] = [];

    for (const file of candidates) {
      if (!(consultationUpload.acceptedMimeTypes as readonly string[]).includes(file.type)) {
        return { accepted, error: `Formati ammessi: ${consultationUpload.humanReadableTypes}.` };
      }
      if (file.size > consultationUpload.maxFileSizeBytes) {
        return {
          accepted,
          error: `“${file.name}” supera i ${Math.round(
            consultationUpload.maxFileSizeBytes / (1024 * 1024),
          )} MB.`,
        };
      }
      accepted.push(file);
    }

    return { accepted, error: null };
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const candidates = Array.from(incoming);
      const { accepted, error: validationError } = validate(candidates);

      if (validationError) {
        setLocalError(validationError);
        return;
      }

      setFiles((current) => {
        const merged = [...current];
        for (const file of accepted) {
          const duplicate = merged.some((f) => f.name === file.name && f.size === file.size);
          if (!duplicate) merged.push(file);
        }

        if (merged.length > consultationUpload.maxFiles) {
          setLocalError(`Puoi allegare al massimo ${consultationUpload.maxFiles} file.`);
          return merged.slice(0, consultationUpload.maxFiles);
        }

        setLocalError(null);
        return merged;
      });
    },
    [validate],
  );

  /**
   * The native input is the source of truth for what gets submitted, so its
   * FileList is rebuilt from state whenever the selection changes.
   */
  const syncInput = useCallback((next: File[]) => {
    const input = inputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    next.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
  }, []);

  const handleSelection = (incoming: FileList | File[]) => {
    addFiles(incoming);
    // State updates are async; recompute the merged list for the input.
    const candidates = Array.from(incoming);
    const { accepted } = validate(candidates);
    const merged = [...files];
    for (const file of accepted) {
      if (!merged.some((f) => f.name === file.name && f.size === file.size)) merged.push(file);
    }
    syncInput(merged.slice(0, consultationUpload.maxFiles));
  };

  const removeFile = (target: File) => {
    const next = files.filter((f) => f !== target);
    setFiles(next);
    syncInput(next);
    setLocalError(null);
  };

  const message = error ?? localError;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.dropzone}
        data-dragging={dragging ? "" : undefined}
        data-invalid={message ? "" : undefined}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length) handleSelection(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          id={name}
          type="file"
          name={name}
          multiple
          accept={consultationUpload.acceptAttribute}
          className={styles.input}
          aria-describedby={[hintId, message ? errorId : null, describedBy]
            .filter(Boolean)
            .join(" ")}
          onChange={(event) => {
            if (event.target.files?.length) handleSelection(event.target.files);
          }}
        />

        <label htmlFor={name} className={styles.label}>
          <UploadIcon size={26} className={styles.uploadIcon} />
          <span className={styles.dropTitle}>{copy.dropzoneTitle}</span>
          <span className={styles.dropAction}>{copy.dropzoneAction}</span>
        </label>

        <p id={hintId} className={styles.hint}>
          {consultationUpload.humanReadableTypes} · max{" "}
          {Math.round(consultationUpload.maxFileSizeBytes / (1024 * 1024))} MB per file · fino a{" "}
          {consultationUpload.maxFiles} file
        </p>
      </div>

      <AnimatePresence initial={false}>
        {files.length > 0 ? (
          <motion.ul
            className={styles.list}
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {files.map((file) => (
              <motion.li
                key={`${file.name}-${file.size}`}
                className={styles.file}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.fileMeta}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>{formatSize(file.size)}</span>
                </span>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeFile(file)}
                  aria-label={`${copy.removeLabel} ${file.name}`}
                >
                  <CloseIcon size={15} />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      {message ? (
        <p id={errorId} className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
