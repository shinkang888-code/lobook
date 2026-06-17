export type AionAssistantPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: "cowork" | "ppt" | "word" | "excel";
};

export const AION_ASSISTANT_PRESETS: AionAssistantPreset[] = [
  {
    id: "cowork",
    label: "Cowork",
    description: "책 원고 기반 멀티스텝 작업",
    icon: "cowork",
    prompt:
      "이 책의 내용을 바탕으로 편집·구조화·출판 준비 작업을 단계별로 진행해 주세요. 각 단계마다 결과를 요약해 주세요.",
  },
  {
    id: "ppt",
    label: "PPT Creator",
    description: "발표용 슬라이드 기획",
    icon: "ppt",
    prompt:
      "이 책 내용으로 발표용 PPT 슬라이드 아웃라인을 만들어 주세요. 표지, 목차, 핵심 메시지, 마무리 슬라이드를 포함하세요.",
  },
  {
    id: "word",
    label: "Word Creator",
    description: "출판용 Word 문서 구조",
    icon: "word",
    prompt:
      "이 책을 출판 가능한 Word 문서 구조(머리말, 본문, 각주, 참고문헌)로 재구성하는 계획을 작성해 주세요.",
  },
  {
    id: "excel",
    label: "Excel Creator",
    description: "데이터·통계 시트 설계",
    icon: "excel",
    prompt:
      "책 내용에서 표로 정리할 수 있는 데이터를 추출하고, Excel 시트 구조(컬럼, 시트명)를 제안해 주세요.",
  },
];

export function buildAionUiEmbedUrl(baseUrl: string, bookId: string, preset?: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("bookstudio", bookId);
  if (preset) url.searchParams.set("assistant", preset);
  return url.toString();
}
