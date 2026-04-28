import { marked } from 'marked';

export const copyToClipboard = async (value: string): Promise<void> => {
  try {
    const html = marked.parse(value) as string;
    const clipboardItem = new ClipboardItem({
      'text/plain': new Blob([value], { type: 'text/plain' }),
      'text/html': new Blob([html], { type: 'text/html' }),
    });
    await navigator.clipboard.write([clipboardItem]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to copy to clipboard: ', err);
  }
};
