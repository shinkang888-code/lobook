/**
 * microsoft-365-docs Word 기능 카탈로그 (documentprocessing + copilot)
 * @see https://github.com/shinkang888-code/microsoft-365-docs
 */

export type M365WordFeature = {
  id: string;
  category: "home" | "insert" | "layout" | "references" | "review" | "copilot" | "assembly";
  label: string;
  description: string;
  docPath?: string;
  action?: string;
};

export const M365_WORD_FEATURES: M365WordFeature[] = [
  {
    id: "content-assembly",
    category: "assembly",
    label: "Content Assembly",
    description: "Word 템플릿·콘텐츠 컨트롤 필드로 문서 자동 생성",
    docPath: "microsoft-365/documentprocessing/content-assembly.md",
    action: "template-fields",
  },
  {
    id: "modern-template",
    category: "assembly",
    label: "Modern Template",
    description: "표·텍스트 필드가 있는 현대적 Word 템플릿",
    docPath: "microsoft-365/documentprocessing/content-assembly-modern-template.md",
  },
  {
    id: "conditional-sections",
    category: "assembly",
    label: "조건부 섹션",
    description: "조건에 따라 포함/제외되는 문서 블록",
    docPath: "microsoft-365/documentprocessing/content-assembly-conditional-sections.md",
  },
  {
    id: "agreements-tab",
    category: "insert",
    label: "Agreements 탭",
    description: "Word Agreements 탭 — 템플릿·섹션·필드 관리",
    docPath: "microsoft-365/documentprocessing/solutions/agreements-create-template.md",
  },
  {
    id: "esignature-word",
    category: "insert",
    label: "eSignature (Insert)",
    description: "Insert 리본에서 서명 필드 삽입·사이드 패널",
    docPath: "microsoft-365/documentprocessing/esignature-create-request-word.md",
    action: "insert-field",
  },
  {
    id: "translation",
    category: "review",
    label: "문서 번역",
    description: "SharePoint 리본 Translate — 다국어 문서",
    docPath: "microsoft-365/documentprocessing/translation.md",
  },
  {
    id: "reviewing-mode",
    category: "review",
    label: "Reviewing Mode",
    description: "변경 추적·redline 협상 검토",
    docPath: "microsoft-365/documentprocessing/solutions/agreements-offline-negotiation.md",
    action: "toggle-review",
  },
  {
    id: "style-editing",
    category: "copilot",
    label: "Copilot Style Editing",
    description: "브랜드 톤·스타일에 맞게 문단 재작성",
    docPath: "copilot/copilot-tuning-style-editing-template.md",
    action: "copilot-rewrite",
  },
  {
    id: "document-writing",
    category: "copilot",
    label: "Copilot Document Writing",
    description: "장문 문서 구조·초안 생성",
    docPath: "copilot/copilot-tuning-document-writing-template.md",
    action: "copilot-draft",
  },
  {
    id: "word-agents",
    category: "copilot",
    label: "Word Agents",
    description: "Copilot Word·Excel·PPT 에이전트",
    docPath: "copilot/wordexcelppt-agents.md",
  },
];

export const WORD_RIBBON_TABS = [
  { id: "home", label: "홈" },
  { id: "insert", label: "삽입" },
  { id: "layout", label: "레이아웃" },
  { id: "references", label: "참고 자료" },
  { id: "review", label: "검토" },
  { id: "copilot", label: "Copilot" },
] as const;

export type WordRibbonTabId = (typeof WORD_RIBBON_TABS)[number]["id"];

export function featuresByCategory(category: M365WordFeature["category"]): M365WordFeature[] {
  return M365_WORD_FEATURES.filter((f) => f.category === category);
}
