import localFont from "next/font/local";

// Hanken Grotesk (OFL, variable 400–700): self-hosted substitute for the reference's Neue Montreal.
// Only the latin subset ships to the app; it covers pt-BR, "R$" and the true minus "−".
export const fontSans = localFont({
  src: "./assets/fonts/HankenGrotesk-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-hanken",
});
