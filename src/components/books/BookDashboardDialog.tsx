"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookDashboard } from "@/components/books/BookDashboard";

type BookDashboardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookDashboardDialog({ open, onOpenChange }: BookDashboardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,880px)] w-[min(96vw,960px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-lg">전자책 관리</DialogTitle>
          <DialogDescription>전자책을 만들고, 열고, 삭제할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <BookDashboard onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
