/** General form error; focusable so a failed submit can move focus here. */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" tabIndex={-1} className="text-body-md text-danger-fg">
      {message}
    </p>
  );
}
