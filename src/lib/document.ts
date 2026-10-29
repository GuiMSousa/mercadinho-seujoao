export const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** CPF (`000.000.000-00`) up to 11 digits, CNPJ (`00.000.000/0000-00`) beyond; same mask as the design. */
export function formatDocument(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length > 11)
    return digits.replace(
      /^(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2}).*/,
      (_, a, b, c, d, e) => `${a}.${b}.${c}/${d}${e ? `-${e}` : ""}`,
    );
  if (digits.length > 3)
    return digits.replace(
      /^(\d{3})(\d{0,3})(\d{0,3})(\d{0,2}).*/,
      (_, a, b, c, d) =>
        [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : ""),
    );
  return digits;
}
