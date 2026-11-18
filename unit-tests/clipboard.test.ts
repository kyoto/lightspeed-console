import DOMPurify from 'dompurify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyMarkdownToClipboard, copyToClipboard } from '../src/clipboard';

// DOMPurify needs a DOM, which the node test environment doesn't have, so these tests only check
// that its output is what gets copied
vi.mock('dompurify', () => ({
  default: { sanitize: vi.fn(() => '<p>Sanitized</p>') },
}));

class FakeClipboardItem {
  static supports = vi.fn(() => true);
  items: Record<string, Blob>;
  constructor(items: Record<string, Blob>) {
    this.items = items;
  }
}

const stubClipboard = (clipboard: Partial<Clipboard>) => {
  vi.stubGlobal('navigator', { clipboard });
};

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('writes the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    await copyToClipboard('oc get pods');
    expect(writeText).toHaveBeenCalledWith('oc get pods');
  });

  it('logs an error instead of throwing when the write fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubClipboard({ writeText: vi.fn().mockRejectedValue(new Error('Denied')) });
    await expect(copyToClipboard('oc get pods')).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('copyMarkdownToClipboard', () => {
  const markdown = '**Bold** text';

  beforeEach(() => {
    FakeClipboardItem.supports.mockReturnValue(true);
    vi.stubGlobal('ClipboardItem', FakeClipboardItem);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('writes the rendered and sanitized HTML, plus the raw markdown as plain text', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    stubClipboard({ write, writeText });

    await copyMarkdownToClipboard(markdown);

    expect(write).toHaveBeenCalledTimes(1);
    const [item] = write.mock.calls[0][0];
    expect(item).toBeInstanceOf(FakeClipboardItem);
    const { 'text/html': html, 'text/plain': plain } = item.items;
    expect(html.type).toBe('text/html');
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(
      expect.stringContaining('<strong>Bold</strong>'),
    );
    expect(await html.text()).toBe('<p>Sanitized</p>');
    expect(plain.type).toBe('text/plain');
    expect(await plain.text()).toBe(markdown);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to plain text when ClipboardItem is unavailable', async () => {
    vi.stubGlobal('ClipboardItem', undefined);
    const write = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ write, writeText });

    await copyMarkdownToClipboard(markdown);

    expect(write).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(markdown);
  });

  it('falls back to plain text when ClipboardItem.supports is unavailable', async () => {
    vi.stubGlobal('ClipboardItem', class {});
    const write = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ write, writeText });

    await copyMarkdownToClipboard(markdown);

    expect(write).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(markdown);
  });

  it('falls back to plain text when HTML is not supported', async () => {
    FakeClipboardItem.supports.mockReturnValue(false);
    const write = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ write, writeText });

    await copyMarkdownToClipboard(markdown);

    expect(write).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(markdown);
  });

  it('falls back to plain text when clipboard.write is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });

    await copyMarkdownToClipboard(markdown);

    expect(writeText).toHaveBeenCalledWith(markdown);
  });

  it('warns and falls back to plain text when the rich write fails', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ write: vi.fn().mockRejectedValue(new Error('Denied')), writeText });

    await copyMarkdownToClipboard(markdown);

    expect(consoleWarn).toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(markdown);
  });
});
