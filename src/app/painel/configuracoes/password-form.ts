/** Client-side checks of the change-password form; the server stays the authority on the password rule. */
export function passwordFormErrors(values: {
  current: string;
  next: string;
  confirm: string;
}) {
  const fields: Record<string, string> = {};
  if (!values.current) fields.current = "Informe a senha atual.";
  if (!values.next)
    fields.next = "Use 8 caracteres ou mais, com letras e números.";
  if (values.confirm !== values.next)
    fields.confirm = "As senhas não conferem.";
  return fields;
}
