"use client";

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AgentEventMessage } from "@/types/api";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:8000";
}

const KNOWN_EVENT_TYPES = [
  "connected",
  "deployment_initiated",
  "metric_tick",
  "anomaly_detected",
  "anomaly_alert",
  "memory_retrieved",
  "decision_evaluated",
  "decision_event",
  "rollback_initiated",
  "rollback_event",
  "recovery_verified",
  "recovery_event",
  "postmortem_generated",
  "postmortem_ready",
  "deployment_healthy",
  "agent_activity",
  "security_alert",
];

export function useEventStream() {
  const [events, setEvents] = useState<AgentEventMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<AgentEventMessage | null>(null);
  const queryClient = useQueryClient();

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // 1. Load initial history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const baseUrl = getApiBase();
        const res = await fetch(`${baseUrl}/api/v1/events/history`);
        if (res.ok) {
          const history = await res.json();
          if (Array.isArray(history) && history.length > 0) {
            setEvents(history);
          }
        }
      } catch (err) {
        console.debug("Failed loading event history", err);
      }
    }
    loadHistory();
  }, []);

  // 2. Connect to real-time SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connect() {
      try {
        const baseUrl = getApiBase();
        const streamUrl = `${baseUrl}/api/v1/events/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          reconnectTimeout = setTimeout(connect, 3000);
        };

        const handleMessage = (evt: MessageEvent) => {
          try {
            const data = JSON.parse(evt.data);
            const eventName = evt.type && evt.type !== "message" ? evt.type : "agent_event";

            // Ignore internal transport status pings
            if (eventName === "connected" || eventName === "heartbeat") {
              return;
            }

            const message: AgentEventMessage = {
              event: eventName,
              data,
              timestamp: new Date().toISOString(),
            };

            setLastEvent(message);
            setEvents((prev) => [message, ...prev.slice(0, 99)]);

            // Automatically invalidate React Query data on significant SSE events
            if (
              [
                "deployment_initiated",
                "anomaly_detected",
                "decision_evaluated",
                "rollback_initiated",
                "recovery_verified",
                "postmortem_generated",
                "deployment_healthy",
              ].includes(eventName)
            ) {
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              queryClient.invalidateQueries({ queryKey: ["traces"] });
              queryClient.invalidateQueries({ queryKey: ["postmortems"] });
            }
          } catch (e) {
            console.error("Failed to parse SSE payload", e);
          }
        };

        // Attach listeners for all backend SSE event types
        KNOWN_EVENT_TYPES.forEach((evtType) => {
          eventSource?.addEventListener(evtType, handleMessage);
        });
        eventSource.onmessage = handleMessage;
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
  }, [queryClient]);

  return { events, isConnected, lastEvent, clearEvents };
}
