const EMAIL = /^\S+@\S+\.\S+$/;

/** Same shape check for the "have a code" shortcut and the submit, so they cannot drift apart. */
export const isEmail = (value: string) => EMAIL.test(value.trim());

type Param = string | string[] | undefined;
const first = (value: Param) => (Array.isArray(value) ? value[0] : value);

/**
 * Where the reset form opens. The invite mail links to `?email=…&etapa=codigo` so the invitee goes
 * straight to the code step; asking for a new code there would replace the 48 h invite code.
 */
export function resetStart(params: { email?: Param; etapa?: Param }) {
  const email = first(params.email)?.trim() ?? "";
  const validEmail = EMAIL.test(email) && email.length <= 254;
  return {
    email: validEmail ? email : "",
    step:
      validEmail && first(params.etapa) === "codigo"
        ? (2 as const)
        : (1 as const),
  };
}
