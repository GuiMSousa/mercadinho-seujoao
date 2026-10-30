import { emailSchema } from "@/contracts/auth";

type Param = string | string[] | undefined;
const first = (value: Param) => (Array.isArray(value) ? value[0] : value);

/**
 * Where the reset form opens. The invite mail links to `?email=…&etapa=codigo` so the invitee goes
 * straight to the code step; asking for a new code there would replace the 48 h invite code.
 */
export function resetStart(params: { email?: Param; etapa?: Param }) {
  const parsed = emailSchema.safeParse(first(params.email) ?? "");
  const validEmail = parsed.success;
  return {
    email: parsed.success ? parsed.data : "",
    step:
      validEmail && first(params.etapa) === "codigo"
        ? (2 as const)
        : (1 as const),
  };
}
