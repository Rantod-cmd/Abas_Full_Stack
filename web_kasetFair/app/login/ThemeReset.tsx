"use client";

import { useEffect } from "react";

export function ThemeReset() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return null;
}
