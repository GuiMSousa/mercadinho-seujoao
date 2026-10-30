"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { IconButton } from "@ds/components/button";
import { Input } from "@ds/components/input";

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type" | "suffix">;

/** Password Input with a show/hide toggle that keeps the focus order natural. */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      size="lg"
      {...props}
      type={visible ? "text" : "password"}
      suffix={
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          icon={visible ? EyeOff : Eye}
          label={visible ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setVisible(!visible)}
        />
      }
    />
  );
}
