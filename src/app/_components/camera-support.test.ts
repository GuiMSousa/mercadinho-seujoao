import { expect, it } from "vitest";
import { cameraErrorMessage, cameraProblem } from "./camera-support";

const ready = { secure: true, hasMedia: true, hasDetector: true };

it("names the first thing missing: HTTPS, camera access, then barcode reading", () => {
  expect(cameraProblem(ready)).toBeNull();
  expect(
    cameraProblem({ secure: false, hasMedia: false, hasDetector: false }),
  ).toMatch(/https:\/\//);
  expect(cameraProblem({ ...ready, hasMedia: false })).toMatch(
    /acesso à câmera/,
  );
  expect(cameraProblem({ ...ready, hasDetector: false })).toMatch(/Chrome/);
});

it("turns getUserMedia failures into something to do", () => {
  const failure = (name: string) =>
    cameraErrorMessage(Object.assign(new Error("x"), { name }));
  expect(failure("NotAllowedError")).toMatch(/negado/);
  expect(failure("NotFoundError")).toMatch(/Nenhuma câmera/);
  expect(failure("NotReadableError")).toMatch(/em uso/);
  expect(cameraErrorMessage("??")).toBe("Não foi possível abrir a câmera.");
});
