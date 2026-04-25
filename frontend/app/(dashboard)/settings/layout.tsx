"use client";

import SettingsLayout from "../../components/settings/SettingsLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
