/**
 * Azure Architecture Center 패턴 카탈로그 — Book Studio 모듈 매핑
 * @see https://github.com/shinkang888-code/architecture-center
 * @see https://learn.microsoft.com/azure/architecture
 */

export type ArchitectureCategory =
  | "ai-rag"
  | "document"
  | "web-app"
  | "design-principles"
  | "patterns"
  | "deployment";

export type BookStudioModule =
  | "cowork-chat"
  | "import-pipeline"
  | "export-pipeline"
  | "word-editor"
  | "hwp-editor"
  | "ppt-generation"
  | "markitdown"
  | "vercel-hosting";

export type ArchitecturePattern = {
  id: string;
  category: ArchitectureCategory;
  label: string;
  description: string;
  docPath?: string;
  learnUrl?: string;
  bookStudioModules: BookStudioModule[];
  priority: "high" | "medium" | "low";
};

export const BOOK_STUDIO_STACK = {
  frontend: "Next.js 16 + React 19 + Tailwind + shadcn/ui",
  deployment: "Vercel (Edge/Serverless)",
  storage: "Supabase + 로컬 .data 폴백",
  ai: "OpenAI API (Cowork Chat, PPT, Word Copilot)",
  documentEngines: ["TipTap", "eigenpal DOCX", "RHWP", "markitdown", "mammoth"],
} as const;

export const ARCHITECTURE_PATTERNS: ArchitecturePattern[] = [
  {
    id: "rag-solution",
    category: "ai-rag",
    label: "RAG 솔루션 설계",
    description: "책 원고를 컨텍스트로 AI Cowork·Copilot에 전달하는 Retrieval-Augmented Generation 패턴",
    docPath: "docs/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide.md",
    learnUrl: "https://learn.microsoft.com/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide",
    bookStudioModules: ["cowork-chat", "word-editor"],
    priority: "high",
  },
  {
    id: "rag-chunking",
    category: "ai-rag",
    label: "RAG 청킹 단계",
    description: "챕터·섹션 단위로 원고를 분할해 AI 검색·생성 품질 향상",
    docPath: "docs/ai-ml/guide/rag/rag-chunking-phase.md",
    learnUrl: "https://learn.microsoft.com/azure/architecture/ai-ml/guide/rag/rag-chunking-phase",
    bookStudioModules: ["cowork-chat", "markitdown"],
    priority: "high",
  },
  {
    id: "foundry-chat",
    category: "ai-rag",
    label: "Microsoft Foundry Chat",
    description: "프로덕션급 AI 채팅 참조 아키텍처 — Studio Chat 베이스라인",
    docPath: "docs/ai-ml/architecture/baseline-microsoft-foundry-chat.yml",
    learnUrl: "https://learn.microsoft.com/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat",
    bookStudioModules: ["cowork-chat"],
    priority: "medium",
  },
  {
    id: "ai-agents",
    category: "ai-rag",
    label: "AI 에이전트 오케스트레이션",
    description: "AionUi 멀티에이전트·Cowork 워크플로 자동화 패턴",
    docPath: "docs/ai-ml/guide/ai-agent-design-patterns.md",
    learnUrl: "https://learn.microsoft.com/azure/architecture/ai-ml/guide/ai-agent-design-patterns",
    bookStudioModules: ["cowork-chat", "ppt-generation"],
    priority: "medium",
  },
  {
    id: "doc-multi-modal",
    category: "document",
    label: "비정형 콘텐츠 처리",
    description: "HWP·DOCX·PDF 등 다양한 형식에서 텍스트·메타데이터 추출",
    docPath: "docs/ai-ml/idea/multi-modal-content-processing.yml",
    learnUrl: "https://learn.microsoft.com/azure/architecture/ai-ml/idea/multi-modal-content-processing",
    bookStudioModules: ["import-pipeline", "hwp-editor", "word-editor"],
    priority: "high",
  },
  {
    id: "doc-generate",
    category: "document",
    label: "데이터 기반 문서 생성",
    description: "책 구조·챕터 데이터에서 EPUB·DOCX·PPT 자동 생성",
    docPath: "docs/ai-ml/idea/generate-documents-from-your-data.yml",
    learnUrl: "https://learn.microsoft.com/azure/architecture/ai-ml/idea/generate-documents-from-your-data",
    bookStudioModules: ["export-pipeline", "ppt-generation"],
    priority: "high",
  },
  {
    id: "doc-classification",
    category: "document",
    label: "문서 분류 자동화",
    description: "가져온 파일 형식·챕터 소스 자동 판별 파이프라인",
    docPath: "docs/ai-ml/architecture/automate-document-classification-durable-functions.yml",
    learnUrl: "https://learn.microsoft.com/azure/architecture/ai-ml/architecture/automate-document-classification-durable-functions",
    bookStudioModules: ["import-pipeline", "markitdown"],
    priority: "medium",
  },
  {
    id: "modern-web-app",
    category: "web-app",
    label: "Modern Web App 패턴",
    description: "Next.js SPA + API Routes + 서버리스 배포 모범 사례",
    docPath: "docs/web-apps/guides/enterprise-app-patterns/modern-web-app/dotnet/guidance.yml",
    learnUrl: "https://learn.microsoft.com/azure/architecture/web-apps/guides/enterprise-app-patterns/modern-web-app/dotnet/guidance",
    bookStudioModules: ["vercel-hosting"],
    priority: "high",
  },
  {
    id: "reliable-web-app",
    category: "web-app",
    label: "Reliable Web App 패턴",
    description: "자가 치유·중복·운영 설계 — Book Studio 안정성 가이드",
    docPath: "docs/web-apps/guides/enterprise-app-patterns/reliable-web-app/dotnet/guidance.yml",
    learnUrl: "https://learn.microsoft.com/azure/architecture/web-apps/guides/enterprise-app-patterns/reliable-web-app/dotnet/guidance",
    bookStudioModules: ["vercel-hosting"],
    priority: "medium",
  },
  {
    id: "static-content",
    category: "patterns",
    label: "정적 콘텐츠 호스팅",
    description: "EPUB·미리보기·보내기 자산의 CDN·엣지 배포",
    docPath: "docs/patterns/static-content-hosting.yml",
    learnUrl: "https://learn.microsoft.com/azure/architecture/patterns/static-content-hosting",
    bookStudioModules: ["export-pipeline", "vercel-hosting"],
    priority: "medium",
  },
  {
    id: "pub-sub",
    category: "patterns",
    label: "Publisher-Subscriber",
    description: "가져오기·변환·보내기 이벤트 비동기 파이프라인",
    docPath: "docs/patterns/publisher-subscriber.md",
    learnUrl: "https://learn.microsoft.com/azure/architecture/patterns/publisher-subscriber",
    bookStudioModules: ["import-pipeline", "export-pipeline"],
    priority: "low",
  },
  {
    id: "self-healing",
    category: "design-principles",
    label: "자가 치유 설계",
    description: "import 실패·AI API 오류 시 폴백·재시도 전략",
    docPath: "docs/guide/design-principles/self-healing.md",
    learnUrl: "https://learn.microsoft.com/azure/architecture/guide/design-principles/self-healing",
    bookStudioModules: ["import-pipeline", "cowork-chat"],
    priority: "medium",
  },
  {
    id: "scale-out",
    category: "design-principles",
    label: "확장 설계",
    description: "챕터·페이지 증가에 대응하는 수평 확장 구조",
    docPath: "docs/guide/design-principles/scale-out.md",
    learnUrl: "https://learn.microsoft.com/azure/architecture/guide/design-principles/scale-out",
    bookStudioModules: ["vercel-hosting"],
    priority: "low",
  },
  {
    id: "managed-services",
    category: "deployment",
    label: "관리형 서비스 활용",
    description: "Supabase·Vercel·OpenAI 등 PaaS/SaaS 우선 전략",
    docPath: "docs/guide/design-principles/managed-services.md",
    learnUrl: "https://learn.microsoft.com/azure/architecture/guide/design-principles/managed-services",
    bookStudioModules: ["vercel-hosting", "cowork-chat"],
    priority: "high",
  },
];

export const ARCHITECTURE_CATEGORIES: { id: ArchitectureCategory; label: string }[] = [
  { id: "ai-rag", label: "AI / RAG" },
  { id: "document", label: "문서 처리" },
  { id: "web-app", label: "웹 앱" },
  { id: "design-principles", label: "설계 원칙" },
  { id: "patterns", label: "클라우드 패턴" },
  { id: "deployment", label: "배포" },
];

export const MODULE_LABELS: Record<BookStudioModule, string> = {
  "cowork-chat": "AI Cowork",
  "import-pipeline": "가져오기",
  "export-pipeline": "보내기",
  "word-editor": "Word 편집",
  "hwp-editor": "HWP 편집",
  "ppt-generation": "PPT 생성",
  markitdown: "MarkItDown",
  "vercel-hosting": "Vercel 배포",
};

export function patternsByCategory(category: ArchitectureCategory): ArchitecturePattern[] {
  return ARCHITECTURE_PATTERNS.filter((p) => p.category === category);
}

export function patternsForModule(module: BookStudioModule): ArchitecturePattern[] {
  return ARCHITECTURE_PATTERNS.filter((p) => p.bookStudioModules.includes(module));
}
