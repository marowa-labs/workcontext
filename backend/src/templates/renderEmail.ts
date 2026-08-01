import { render } from "@react-email/render";
import React from "react";

export async function renderEmail(component: React.ReactElement): Promise<string> {
  return render(component);
}
