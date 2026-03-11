import { useState, useRef, useEffect } from "react";
import type { Prospect } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Trash2, Pencil, Flame, ThumbsUp, Minus, DollarSign, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditProspectForm } from "./edit-prospect-form";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

function InlineSalaryEditor({ prospect }: { prospect: Prospect }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(prospect.targetSalary != null ? String(prospect.targetSalary) : "");
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      savedRef.current = false;
    }
  }, [editing]);

  const mutation = useMutation({
    mutationFn: async (salary: number | null) => {
      await apiRequest("PATCH", `/api/prospects/${prospect.id}`, { targetSalary: salary });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update salary", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (savedRef.current || mutation.isPending) return;
    savedRef.current = true;
    const raw = value.replace(/[^0-9]/g, "");
    const salary = raw === "" ? null : parseInt(raw, 10);
    if (salary !== null && salary < 0) return;
    mutation.mutate(salary);
  };

  if (editing) {
    return (
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          className="h-6 text-xs pl-5 pr-2 w-28"
          data-testid={`input-inline-salary-${prospect.id}`}
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            setValue(raw);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={handleSave}
        />
      </div>
    );
  }

  if (prospect.targetSalary == null) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline"
      onClick={(e) => {
        e.stopPropagation();
        setValue(String(prospect.targetSalary ?? ""));
        setEditing(true);
      }}
      data-testid={`text-salary-${prospect.id}`}
    >
      <DollarSign className="w-3 h-3" />
      {formatCurrency(prospect.targetSalary)}
    </span>
  );
}

function InterestIndicator({ level }: { level: string }) {
  switch (level) {
    case "High":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400" data-testid="interest-high">
          <Flame className="w-3 h-3" />
          High
        </span>
      );
    case "Medium":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 dark:text-amber-400" data-testid="interest-medium">
          <ThumbsUp className="w-3 h-3" />
          Medium
        </span>
      );
    case "Low":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground" data-testid="interest-low">
          <Minus className="w-3 h-3" />
          Low
        </span>
      );
    default:
      return null;
  }
}

function NotesModal({ prospect }: { prospect: Prospect }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(prospect.notes ?? "");

  useEffect(() => {
    if (open) {
      setDraft(prospect.notes ?? "");
    }
  }, [open, prospect.notes]);

  const mutation = useMutation({
    mutationFn: async (notes: string | null) => {
      await apiRequest("PATCH", `/api/prospects/${prospect.id}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to save notes", variant: "destructive" });
    },
  });

  const hasNotes = !!prospect.notes;

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        data-testid={`button-notes-${prospect.id}`}
      >
        <StickyNote
          className={`w-3.5 h-3.5 ${hasNotes ? "text-amber-500" : "text-muted-foreground/40"}`}
        />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Notes — {prospect.companyName}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add notes about this opportunity…"
            className="min-h-[120px]"
            data-testid={`textarea-notes-${prospect.id}`}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              data-testid={`button-notes-cancel-${prospect.id}`}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => {
                const value = draft.trim() === "" ? null : draft;
                mutation.mutate(value);
              }}
              data-testid={`button-notes-save-${prospect.id}`}
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProspectCard({ prospect }: { prospect: Prospect }) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/prospects/${prospect.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      toast({ title: "Prospect deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete prospect", variant: "destructive" });
    },
  });

  return (
    <>
      <div
        className="group bg-card border border-card-border rounded-md p-3 space-y-2 hover-elevate cursor-pointer transition-all duration-150"
        onClick={() => setEditOpen(true)}
        data-testid={`card-prospect-${prospect.id}`}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm leading-tight truncate" data-testid={`text-company-${prospect.id}`}>
              {prospect.companyName}
            </h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5" data-testid={`text-role-${prospect.id}`}>
              {prospect.roleTitle}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              data-testid={`button-edit-${prospect.id}`}
            >
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-${prospect.id}`}
            >
              <Trash2 className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <InterestIndicator level={prospect.interestLevel} />
          <InlineSalaryEditor prospect={prospect} />
          <NotesModal prospect={prospect} />
        </div>

        {prospect.jobUrl && (
          <a
            href={prospect.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
            data-testid={`link-job-url-${prospect.id}`}
          >
            <ExternalLink className="w-3 h-3" />
            Posting
          </a>
        )}

      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Prospect</DialogTitle>
          </DialogHeader>
          <EditProspectForm prospect={prospect} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
