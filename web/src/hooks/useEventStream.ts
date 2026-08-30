"use client";

import { useEffect, useState } from "react";
import { AgentEventMessage } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useEventStream() {
  const [events, setEvents] = useState<AgentEventMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<AgentEventMessage | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connect() {
      try {
        const streamUrl = `${API_BASE}/api/v1/events/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          reconnectTimeout = setTimeout(connect, 3000);
        };

        // Listen to custom SSE events
        const handleMessage = (evt: MessageEvent) => {
          try {
            const data = JSON.parse(evt.data);
            const message: AgentEventMessage = {
              event: evt.type || "agent_event",
              data,
              timestamp: new Date().toISOString(),
            };
            setLastEvent(message);
            setEvents((prev) => [message, ...prev.slice(0, 49)]);
          } catch (e) {
            console.error("Failed to parse SSE payload", e);
          }
        };

        eventSource.addEventListener("connected", handleMessage);
        eventSource.addEventListener("agent_event", handleMessage);
        eventSource.addEventListener("metric_tick", handleMessage);
        eventSource.addEventListener("anomaly_alert", handleMessage);
        eventSource.addEventListener("decision_event", handleMessage);
        eventSource.addEventListener("rollback_event", handleMessage);
        eventSource.addEventListener("postmortem_ready", handleMessage);
      } catch (err) {
        console.error("SSE connection error", err);
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, []);

  return { events, isConnected, lastEvent };
}
