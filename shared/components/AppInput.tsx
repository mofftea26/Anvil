import React from "react";
import { Input, type InputProps } from "../ui";

export type AppInputProps = InputProps;

export function AppInput(props: AppInputProps) {
  return <Input {...props} />;
}
