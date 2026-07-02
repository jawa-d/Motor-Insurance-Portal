import type { ChangeEvent, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
};

type InputProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  };

type TextareaProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  };

export function FloatingField(props: InputProps | TextareaProps) {
  const { id, label, value, error, required, multiline, ...controlProps } = props;
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          placeholder=" "
          {...(controlProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          placeholder=" "
          {...(controlProps as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {error ? (
        <p className="error-text" id={describedBy}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
