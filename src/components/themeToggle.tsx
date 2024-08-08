import "@theme-toggles/react/css/Expand.css";
import { Expand } from "@theme-toggles/react";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [isToggled, setToggle] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      const isDark = savedTheme === "dark";
      setToggle(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      // Detect user's system preference if no theme is saved
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setToggle(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isToggled ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isToggled);
  }, [isToggled]);

  return (
    <Expand
      className="text-foreground"
      toggled={isToggled}
      toggle={setToggle}
      duration={750}
    />
  );
}
