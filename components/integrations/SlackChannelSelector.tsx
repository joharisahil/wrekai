"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Channel = {
  id: string;
  name: string;
  memberCount: number;
};

export function SlackChannelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  async function openModal() {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/slack/channels", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        channels?: Channel[];
        selectedChannels?: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load Slack channels.");
      }

      setChannels(payload.channels ?? []);
      setSelectedChannels(payload.selectedChannels ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load Slack channels.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleChannel(channelId: string) {
    setSelectedChannels((current) =>
      current.includes(channelId)
        ? current.filter((id) => id !== channelId)
        : [...current, channelId],
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/slack/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedChannels,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save Slack channels.");
      }

      setIsOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save Slack channels.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={openModal}>
        Manage Channels
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Manage Slack Channels</h3>
                <p className="text-sm text-slate-500">
                  Choose which channels Clareeva should use for feedback analysis.
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading channels...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : channels.length > 0 ? (
                <div className="space-y-2">
                  {channels.map((channel) => {
                    const checked = selectedChannels.includes(channel.id);

                    return (
                      <label
                        key={channel.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors",
                          checked
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleChannel(channel.id)}
                            className="size-4 rounded border-slate-300"
                          />
                          <div>
                            <p className="font-medium"># {channel.name}</p>
                            <p className={cn("text-xs", checked ? "text-slate-200" : "text-slate-500")}>
                              {channel.memberCount} members
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No channels available for this Slack workspace.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-slate-950 text-white hover:bg-slate-800"
                onClick={handleSave}
                disabled={isLoading || isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
