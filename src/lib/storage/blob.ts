export type BlobPointer = {
  key: string;
  url?: string;
};

export async function saveTextBlob(key: string, content: string): Promise<BlobPointer> {
  void content;
  return { key };
}
