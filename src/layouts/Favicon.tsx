// FetchLogo.jsx
import React from "react";
import useSWR from "swr";

const fetcher = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch logo");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching logo:", error);
    return "/logo.png";
  }
};

const Favicon = () => {
  const { data: logoUrl } = useSWR("/api/upload", fetcher);
  return <link rel="icon" type="image/png" href={logoUrl || "/logo.png"} />;
};

export default Favicon;
