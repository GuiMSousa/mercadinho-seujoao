import { createCn } from "cn/config";

// The design system renames Tailwind scales (text-body-lg, rounded-control, h-control-md).
// Unconfigured, cn() reads text-body-lg as a text color and drops it when text-strong follows.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "body-lg",
            "body-md",
            "body-sm",
            "caption",
            "counter",
            "counter-total",
            "currency",
          ],
        },
      ],
      tracking: [{ tracking: ["display"] }],
      rounded: [{ rounded: ["control", "card", "dialog"] }],
      h: [
        {
          h: [
            "control-sm",
            "control-md",
            "control-lg",
            "control-counter",
            "control-counter-lg",
          ],
        },
      ],
      size: [
        { size: ["control-sm", "control-md", "control-lg", "control-counter"] },
      ],
    },
  },
});
