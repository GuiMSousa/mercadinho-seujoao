import { z } from "zod";

// Runs before hydration. Zod probes `new Function` to compile faster validators; the pages' CSP
// forbids eval, so every form would report a violation. Jitless parsing never probes.
z.config({ jitless: true });
