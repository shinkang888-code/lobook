declare module "html-to-docx" {
  function HTMLtoDOCX(
    html: string,
    headerHTML: string | null,
    options?: Record<string, unknown>,
  ): Promise<ArrayBuffer | Blob>;
  export default HTMLtoDOCX;
}
