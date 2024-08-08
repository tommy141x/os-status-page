"use client";
import { useState, useEffect, useCallback } from "react";
import { HeaderNav } from "@/components/headerNav";
import { Services } from "@/components/Services";
import { Incidents } from "@/components/Incidents";

export function Dashboard({ user }) {
  const [statusData, setStatusData] = useState(null);
  const [statusDataLoading, setStatusDataLoading] = useState(true);

  const [incidentsData, setIncidentsData] = useState([]);
  const [incidentsDataLoading, setIncidentsDataLoading] = useState(true);

  const [error, setError] = useState(null);

  const fetchStatusData = useCallback(async () => {
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
      setStatusDataLoading(false);
    }
  }, []);

  const fetchIncidentsData = useCallback(async () => {
    try {
      const response = await fetch("/api/incidents");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setIncidentsData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setIncidentsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatusData();
    fetchIncidentsData();

    const intervalId = setInterval(() => {
      fetchStatusData();
      fetchIncidentsData();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchStatusData, fetchIncidentsData]);

  const refreshData = () => {
    fetchStatusData();
    fetchIncidentsData();
  };

  if (statusDataLoading || incidentsDataLoading)
    return <div className="bg-background">Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!statusData || !incidentsData) return <div>No data available</div>;

  return (
    <HeaderNav
      user={user}
      tabs={[
        {
          value: "status",
          label: "Status",
          content: (
            <Services
              statusData={statusData}
              incidentsData={incidentsData}
              refreshData={refreshData} // Pass refresh function
            />
          ),
        },
        {
          value: "incidents",
          label: "Incidents",
          content: (
            <Incidents
              statusData={statusData}
              initIncidentsData={incidentsData}
              user={user}
              refreshData={refreshData} // Pass refresh function
            />
          ),
        },
      ]}
    />
  );
}
