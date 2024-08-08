// Dashboard.tsx
"use client";
import { useState, useEffect } from "react";
import { HeaderNav } from "@/components/headerNav";
import { Services } from "@/components/Services";
import { Incidents } from "@/components/Incidents";

export function Dashboard({ user }) {
  const [statusData, setStatusData] = useState(null);
  const [statusDataLoading, setstatusDataLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStatusData() {
      try {
        const response = await fetch("/api/status");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatusData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setstatusDataLoading(false);
      }
    }
    fetchStatusData();
  }, []);

  if (statusDataLoading) return <div className="bg-background">Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!statusData) return <div>No data available</div>;

  return (
    <HeaderNav
      user={user}
      tabs={[
        {
          value: "status",
          label: "Status",
          content: <Services statusData={statusData} />,
        },
        {
          value: "incidents",
          label: "Incidents",
          content: <Incidents statusData={statusData} user={user} />,
        },
      ]}
    />
  );
}
