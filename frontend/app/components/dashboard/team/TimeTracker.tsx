"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Play, Square, Clock, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { ScrollArea } from "../../ui/scroll-area";
import {
  timeTrackingService,
  TimeEntry,
} from "../../../lib/utils/timeTrackingService";
import { WorkspaceTask } from "../../../lib/utils/workspaceTaskService";
import { useToast } from "../../../hooks/use-toast";
import useUser from "../../../lib/utils/useUser";

interface TimeTrackerProps {
  taskId: string;
  onUpdate: (updatedTask: WorkspaceTask) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  taskId,
  onUpdate,
}) => {
  const { toast } = useToast();
  const { data: user } = useUser();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Manual entry form
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [manualDuration, setManualDuration] = useState("");
  const [manualDescription, setManualDescription] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTimeData();
    checkActiveTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [taskId]);

  useEffect(() => {
    if (activeTimer) {
      const startTime = new Date(activeTimer.start_time).getTime();
      timerRef.current = setInterval(() => {
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimer]);

  const fetchTimeData = async () => {
    setIsLoading(true);
    try {
      const data = await timeTrackingService.getTaskTimeEntries(taskId);
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch time entries", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkActiveTimer = async () => {
    try {
      const active = await timeTrackingService.getActiveTimer();
      // Only set if it belongs to this task
      if (active && active.task_id === taskId) {
        setActiveTimer(active);
      } else {
        setActiveTimer(null);
      }
    } catch (error) {
      console.error("Failed to check active timer", error);
    }
  };

  const handleStartTimer = async () => {
    try {
      const newEntry = await timeTrackingService.startTimer(taskId);
      setActiveTimer(newEntry);
      fetchTimeData(); // Refresh list to verify state if needed
      toast({ title: "Timer started" });
    } catch (error: any) {
      toast({
        title: "Error starting timer",
        description: error.response?.data?.error || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      await timeTrackingService.stopTimer(activeTimer.id);
      setActiveTimer(null);
      fetchTimeData();
      toast({ title: "Timer stopped" });
    } catch (error: any) {
      toast({
        title: "Error stopping timer",
        description: error.response?.data?.error || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleLogTime = async () => {
    if (!manualDuration) return;

    try {
      await timeTrackingService.logTime(taskId, {
        duration: parseInt(manualDuration, 10),
        start_time: new Date(`${manualDate}T12:00:00`), // Simple date handling
        end_time: new Date(`${manualDate}T13:00:00`), // Just for record
        description: manualDescription,
      });
      setIsLogModalOpen(false);
      setManualDuration("");
      setManualDescription("");
      fetchTimeData();
      toast({ title: "Time logged successfully" });
    } catch (error: any) {
      toast({
        title: "Error logging time",
        description: error.response?.data?.error || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) return;
    try {
      await timeTrackingService.deleteTimeEntry(entryId);
      fetchTimeData();
      toast({ title: "Entry deleted" });
    } catch (error: any) {
      toast({
        title: "Failed to delete",
        description: error.response?.data?.error,
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalMinutes = entries.reduce(
    (acc, curr) => acc + (curr.duration || 0),
    0,
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> Time Tracking{" "}
          <span className="ml-2 text-foreground normal-case bg-muted px-1.5 py-0.5 rounded text-[10px]">
            {totalHours}h Total
          </span>
        </Label>

        {activeTimer ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStopTimer}
            className="h-7 text-xs bg-red-100 text-red-600 hover:bg-red-200 border-red-200 border shadow-none animate-pulse">
            <Square className="h-3 w-3 mr-1.5 fill-current" />
            Stop ({formatDuration(elapsedTime)})
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartTimer}
            className="h-7 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800">
            <Play className="h-3 w-3 mr-1.5 fill-current" />
            Start Timer
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {entries.slice(0, 3).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-md border border-border/50 group">
            <div className="flex items-center gap-2">
              <div className="w-8 text-center font-mono text-muted-foreground">
                {format(new Date(entry.start_time), "MMM d")}
              </div>
              <div className="h-3 w-[1px] bg-border" />
              <span className="font-medium text-foreground">
                {entry.duration}m
              </span>
              {entry.description && (
                <span className="text-muted-foreground truncate max-w-[150px]">
                  - {entry.description}
                </span>
              )}
            </div>
            {user?.id === entry.user_id && (
              <button
                onClick={() => handleDeleteEntry(entry.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogTrigger asChild>
          <div className="flex justify-start">
            {entries.length === 0 && !activeTimer ? (
              <button className="text-[10px] text-muted-foreground italic pl-1 hover:underline hover:text-primary">
                No time tracked yet. Log manual time
              </button>
            ) : (
              <Button
                variant="link"
                className="h-auto p-0 text-[10px] text-muted-foreground hover:text-primary">
                View all entries / Log manual time
              </Button>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Time Entries</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <Label className="text-xs font-semibold">Log Manual Entry</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 60"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
              <Input
                placeholder="Description (optional)"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="h-8 text-xs bg-background"
              />
              <Button
                onClick={handleLogTime}
                size="sm"
                className="w-full h-8 text-xs">
                Log Time
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  History
                </span>
              </div>
            </div>

            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {entries.length === 0 && (
                  <div className="text-center text-muted-foreground text-xs py-8">
                    No time history found.
                  </div>
                )}
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50 border border-transparent hover:border-border transition-colors group">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{entry.duration}m</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(entry.start_time), "PP p")}
                        </span>
                      </div>
                      {entry.description && (
                        <span className="text-xs text-muted-foreground">
                          {entry.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {entry.user?.full_name}
                      </span>
                      {user?.id === entry.user_id && (
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
