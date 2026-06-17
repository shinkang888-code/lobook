export async function uploadEditorImage(blob: Blob | File, bookId: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("bookId", bookId);

  const res = await fetch("/api/upload/image", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "이미지 업로드 실패");
  }

  return data.url as string;
}
