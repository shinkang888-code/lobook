"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Sparkles,
  Strikethrough,
  Table,
  Underline,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { HncRibbonGroup, HncRibbonIconBtn } from "@/components/hancom/HncControls";
import type { PageSpec } from "@/lib/editor/types";
import { PAGE_PRESETS } from "@/lib/editor/pageSpec";
import { WORD_RIBBON_TABS, type WordRibbonTabId } from "@/lib/word/m365WordCatalog";
import { insertTableHtml } from "@/lib/word/wordDocumentUtils";

type WordM365RibbonProps = {
  editor: Editor | null;
  pageSpec: PageSpec;
  reviewMode: boolean;
  onToggleReview: () => void;
  onCopilotAction: (prompt: string) => void;
  disabled?: boolean;
};

export function WordM365Ribbon({
  editor,
  pageSpec,
  reviewMode,
  onToggleReview,
  onCopilotAction,
  disabled,
}: WordM365RibbonProps) {
  const [tab, setTab] = useState<WordRibbonTabId>("home");

  const presetLabel =
    pageSpec.preset_id === "custom"
      ? "사용자 정의"
      : PAGE_PRESETS[pageSpec.preset_id as keyof typeof PAGE_PRESETS]?.label ?? pageSpec.preset_id;

  const run = (fn: () => void) => {
    if (!editor || disabled) return;
    fn();
  };

  const insertLink = () => {
    if (!editor) return;
    const url = window.prompt("링크 URL", "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = () => {
    if (!editor) return;
    const url = window.prompt("이미지 URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="word-m365-ribbon">
      <div className="word-m365-ribbon-tabs">
        {WORD_RIBBON_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`word-m365-ribbon-tab ${tab === t.id ? "word-m365-ribbon-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="word-m365-ribbon-panel">
        {disabled && (
          <p className="px-2 text-[10px] text-slate-500">
            DOCX 네이티브 모드 — eigenpal 내장 툴바를 사용하세요.
          </p>
        )}

        {!disabled && tab === "home" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="글꼴">
              <HncRibbonIconBtn icon={Bold} label="굵게" large onClick={() => run(() => editor?.chain().focus().toggleBold().run())} />
              <HncRibbonIconBtn icon={Italic} label="기울임" large onClick={() => run(() => editor?.chain().focus().toggleItalic().run())} />
              <HncRibbonIconBtn icon={Underline} label="밑줄" large onClick={() => run(() => editor?.chain().focus().toggleUnderline().run())} />
              <HncRibbonIconBtn icon={Strikethrough} label="취소선" large onClick={() => run(() => editor?.chain().focus().toggleStrike().run())} />
            </HncRibbonGroup>
            <HncRibbonGroup label="스타일">
              <HncRibbonIconBtn icon={Heading1} label="제목1" large onClick={() => run(() => editor?.chain().focus().toggleHeading({ level: 1 }).run())} />
              <HncRibbonIconBtn icon={Heading2} label="제목2" large onClick={() => run(() => editor?.chain().focus().toggleHeading({ level: 2 }).run())} />
              <HncRibbonIconBtn icon={Heading3} label="제목3" large onClick={() => run(() => editor?.chain().focus().toggleHeading({ level: 3 }).run())} />
            </HncRibbonGroup>
            <HncRibbonGroup label="단락">
              <HncRibbonIconBtn icon={List} label="글머리" large onClick={() => run(() => editor?.chain().focus().toggleBulletList().run())} />
              <HncRibbonIconBtn icon={ListOrdered} label="번호" large onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run())} />
              <HncRibbonIconBtn icon={AlignLeft} label="왼쪽" large onClick={() => run(() => editor?.chain().focus().setTextAlign("left").run())} />
              <HncRibbonIconBtn icon={AlignCenter} label="가운데" large onClick={() => run(() => editor?.chain().focus().setTextAlign("center").run())} />
              <HncRibbonIconBtn icon={AlignRight} label="오른쪽" large onClick={() => run(() => editor?.chain().focus().setTextAlign("right").run())} />
            </HncRibbonGroup>
            <HncRibbonGroup label="편집">
              <HncRibbonIconBtn icon={Undo2} label="실행 취소" large onClick={() => run(() => editor?.chain().focus().undo().run())} />
              <HncRibbonIconBtn icon={Redo2} label="다시 실행" large onClick={() => run(() => editor?.chain().focus().redo().run())} />
            </HncRibbonGroup>
          </div>
        )}

        {!disabled && tab === "insert" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="삽입">
              <HncRibbonIconBtn icon={Link2} label="링크" large onClick={insertLink} />
              <HncRibbonIconBtn icon={ImageIcon} label="그림" large onClick={insertImage} />
              <HncRibbonIconBtn
                icon={Table}
                label="표"
                large
                onClick={() => run(() => editor?.chain().focus().insertContent(insertTableHtml()).run())}
              />
              <HncRibbonIconBtn
                icon={Minus}
                label="구분선"
                large
                onClick={() => run(() => editor?.chain().focus().setHorizontalRule().run())}
              />
            </HncRibbonGroup>
            <HncRibbonGroup label="M365">
              <HncRibbonIconBtn
                icon={Sparkles}
                label="필드"
                large
                onClick={() => toast.info("Content Assembly 스타일 필드 — 사이드 패널 참고")}
              />
            </HncRibbonGroup>
          </div>
        )}

        {!disabled && tab === "layout" && (
          <div className="hancom-ribbon-row items-center px-2">
            <HncRibbonGroup label="페이지">
              <span className="inline-block px-2 py-1 text-[11px] text-slate-600">
                {presetLabel} · {pageSpec.width_mm}×{pageSpec.height_mm}mm · {pageSpec.orientation === "portrait" ? "세로" : "가로"}
              </span>
            </HncRibbonGroup>
            <HncRibbonGroup label="여백(mm)">
              <span className="inline-block px-2 py-1 text-[10px] text-slate-500">
                상{pageSpec.margins.top} 하{pageSpec.margins.bottom} 좌{pageSpec.margins.left} 우{pageSpec.margins.right}
              </span>
            </HncRibbonGroup>
          </div>
        )}

        {!disabled && tab === "references" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="참고 자료">
              <HncRibbonIconBtn
                icon={ListOrdered}
                label="목차 삽입"
                large
                onClick={() => onCopilotAction("__insert_toc__")}
              />
            </HncRibbonGroup>
          </div>
        )}

        {!disabled && tab === "review" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="검토">
              <HncRibbonIconBtn
                icon={Sparkles}
                label={reviewMode ? "검토 끄기" : "검토 모드"}
                large
                active={reviewMode}
                onClick={onToggleReview}
              />
            </HncRibbonGroup>
          </div>
        )}

        {!disabled && tab === "copilot" && (
          <div className="hancom-ribbon-row">
            <HncRibbonGroup label="Copilot">
              <HncRibbonIconBtn
                icon={Sparkles}
                label="톤 다듬기"
                large
                onClick={() => onCopilotAction("선택한 문단을 출판용 격식체로 다듬어 주세요.")}
              />
              <HncRibbonIconBtn
                icon={Sparkles}
                label="요약"
                large
                onClick={() => onCopilotAction("이 챕터 내용을 3문장으로 요약해 주세요.")}
              />
              <HncRibbonIconBtn
                icon={Sparkles}
                label="확장"
                large
                onClick={() => onCopilotAction("핵심 내용을 유지하면서 문단을 보강해 주세요.")}
              />
            </HncRibbonGroup>
          </div>
        )}
      </div>
    </div>
  );
}
