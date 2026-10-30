import {
  codeSchema,
  documentSchema,
  emailSchema,
  passwordRuleSchema,
  signupRequestSchema,
  storeNameSchema,
} from "@/contracts/auth";
import { fieldError, fieldErrors } from "../validate";
import type { SignupValues } from "./signup-steps";

/** Same rules as the API (src/contracts/auth.ts), so the form never disagrees with the server. */
export function validateAccount(v: SignupValues) {
  const fields = fieldErrors({
    name: [signupRequestSchema.shape.name, v.name],
    email: [emailSchema, v.email],
    password: [passwordRuleSchema, v.password],
  });
  if (v.confirm !== v.password) fields.confirm = "As senhas não conferem.";
  return fields;
}

export function validateStore(v: SignupValues) {
  return fieldErrors({
    storeName: [storeNameSchema, v.storeName],
    document: [documentSchema, v.document],
    terms: [signupRequestSchema.shape.terms, v.terms],
  });
}

export const validateCode = (code: string) => fieldError(codeSchema, code);

/** Body of POST /api/auth/signup; compare two of them to know whether anything changed. */
export const signupPayload = (v: SignupValues) => ({
  name: v.name,
  email: v.email,
  password: v.password,
  storeName: v.storeName,
  document: v.document,
  phone: v.phone.trim() || undefined,
  kind: v.kind,
  terms: v.terms,
});
