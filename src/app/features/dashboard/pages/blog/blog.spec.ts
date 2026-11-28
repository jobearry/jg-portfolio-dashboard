import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { site } from '../../../../core/config/site.config';
import { NotionPageCard } from './core';
import { Blog } from './blog';

describe('Blog', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(payload: NotionPageCard[]): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Blog);
    fixture.detectChanges();

    http.expectOne((request) => request.url.includes('v1/notion')).flush(payload);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('uses the shared centered content column', async () => {
    const element = await render([]);
    const section = element.querySelector('section');

    expect(section?.classList.contains('mx-auto')).toBe(true);
    expect(section?.classList.contains('max-w-5xl')).toBe(true);
    expect(section?.classList.contains('px-2')).toBe(true);
    expect(section?.classList.contains('sm:px-6')).toBe(true);
    expect(section?.classList.contains('lg:px-10')).toBe(true);
  });

  it('renders numbered entries with rewritten Notion URLs', async () => {
    const element = await render([
      { url: 'https://www.notion.so/first-post-123', date: '2026-01-01', title: 'First' },
      { url: 'https://www.notion.so/second-post-456', date: '2026-02-01', title: 'Second' },
    ]);

    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('a'));
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe(
      `https://${site.notion.publicDomain}/first-post-123`,
    );
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(links[0].getAttribute('rel')).toContain('noopener');
    expect(element.textContent).toContain('01');
    expect(element.textContent).toContain('02');
    expect(element.textContent).toContain('opens in a new tab');
  });

  it('shows an empty state for an empty response', async () => {
    const element = await render([]);

    expect(element.querySelector('[role="status"]')?.textContent).toContain('No blog entries');
    expect(element.querySelectorAll('a').length).toBe(0);
  });
});
