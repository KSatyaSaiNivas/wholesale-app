export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  helpText,
  multiline = false,
  ...props
}) {
  const Component = multiline ? "textarea" : "input";

  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-ink/90">{label}</span>
      <Component
        className="field"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        rows={multiline ? 5 : undefined}
        type={multiline ? undefined : type}
        value={value}
        {...props}
      />
      {helpText ? <span className="text-xs text-slate-500">{helpText}</span> : null}
    </label>
  );
}
