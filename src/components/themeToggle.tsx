import "@theme-toggles/react/css/Expand.css";
import { Expand } from "@theme-toggles/react";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [isToggled, setToggle] = useState(false);
  // Load theme from local storage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") === "dark";
    setToggle(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme); // Adjust as needed for your theme management
  }, []);

  // Save theme to local storage and apply it to the document
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
