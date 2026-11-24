/** What the browser offers: the camera needs HTTPS (or localhost), getUserMedia and BarcodeDetector. */
export type CameraEnvironment = {
  secure: boolean;
  hasMedia: boolean;
  hasDetector: boolean;
};

export const FALLBACK = "Use o leitor USB ou digite o código no campo.";

export function readCameraEnvironment(): CameraEnvironment {
  return {
    secure: window.isSecureContext,
    hasMedia: Boolean(navigator.mediaDevices?.getUserMedia),
    hasDetector: "BarcodeDetector" in window,
  };
}

/** Why the camera cannot read here, in words for the counter; null when it can. */
export function cameraProblem(env: CameraEnvironment) {
  if (!env.secure)
    return "A câmera só funciona com o sistema aberto em endereço seguro (https://).";
  if (!env.hasMedia) return "Este navegador não dá acesso à câmera.";
  if (!env.hasDetector)
    return "Este navegador não lê código de barras pela câmera. No celular, use o Chrome (Android).";
  return null;
}

/** The getUserMedia failure, as the person can act on it. */
export function cameraErrorMessage(error: unknown) {
  // A DOMException; read its name without relying on it extending Error.
  const name =
    typeof error === "object" && error && "name" in error
      ? String(error.name)
      : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "O acesso à câmera foi negado. Libere a câmera para este site nas configurações do navegador.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "Nenhuma câmera encontrada neste aparelho.";
  if (name === "NotReadableError")
    return "A câmera está em uso por outro aplicativo. Feche-o e tente de novo.";
  return "Não foi possível abrir a câmera.";
}
