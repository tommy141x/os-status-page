import yaml from "js-yaml";

export async function fetchSettings() {
  const response = await fetch("/api/settings");
  const settingsData = await response.text();
  return yaml.load(settingsData);
}

export async function saveSettings(settings) {
  const yamlData = yaml.dump(settings);
  await fetch("/api/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-yaml",
    },
    body: yamlData,
  });
}

export async function fetchUsers() {
  const response = await fetch("/api/users");
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
