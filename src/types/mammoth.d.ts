declare module "mammoth" {
  interface Result {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface Mammoth {
    extractRawText(input: { buffer: Buffer }): Promise<Result>;
  }

  const mammoth: Mammoth;
  export = mammoth;
}
