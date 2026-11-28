import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Clock, FileText, Share2, Sparkles } from 'lucide-react';
import { BLOG_POSTS, getBlogPostBySlug, type BlogPost } from '../../data/blogPosts';

interface BlogViewProps {
  slug?: string | null;
  onSelectPost: (slug: string | null) => void;
  onBackHome: () => void;
  onStartWorkspace: () => void;
}

function setMetaTag(attr: 'name' | 'property', key: string, value: string) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

export const BlogView: React.FC<BlogViewProps> = ({
  slug,
  onSelectPost,
  onBackHome,
  onStartWorkspace,
}) => {
  const activePost: BlogPost | undefined = slug ? getBlogPostBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    const title = activePost
      ? `${activePost.title} | PulseNote AI Blog`
      : 'Clinical & Enterprise Documentation Blog | PulseNote AI';
    const description = activePost
      ? activePost.metaDescription
      : 'Practical guides on SOAP note templates, discharge summaries, and deterministic clinical documentation best practices.';
    const url = activePost
      ? `https://pulsenoteai.in/blog/${activePost.slug}`
      : 'https://pulsenoteai.in/blog';

    const previousTitle = document.title;
    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:type', activePost ? 'article' : 'website');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute('href') || 'https://pulsenoteai.in/';
    if (canonical) canonical.setAttribute('href', url);

    const ldScriptId = 'pulsenote-blog-jsonld';
    let scriptEl = document.getElementById(ldScriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = ldScriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const jsonLd = activePost
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: activePost.title,
          description: activePost.metaDescription,
          datePublished: activePost.publishedAt,
          dateModified: activePost.publishedAt,
          author: {
            '@type': 'Organization',
            name: activePost.author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'PulseNote AI',
            url: 'https://pulsenoteai.in',
          },
          mainEntityOfPage: url,
          keywords: activePost.keywords.join(', '),
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'PulseNote AI Documentation Blog',
          description,
          url,
          blogPost: BLOG_POSTS.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.metaDescription,
            datePublished: post.publishedAt,
            url: `https://pulsenoteai.in/blog/${post.slug}`,
          })),
        };

    scriptEl.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = previousTitle;
      if (canonical) canonical.setAttribute('href', prevCanonical);
      const existing = document.getElementById(ldScriptId);
      if (existing) existing.remove();
    };
  }, [activePost]);

  const linkedInShareUrl = activePost
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://pulsenoteai.in/blog/${activePost.slug}`)}`
    : `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://pulsenoteai.in/blog')}`;

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-100 selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0e14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackHome}
              className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 text-white font-semibold shadow-sm">
                P
              </div>
              <span className="text-base font-semibold tracking-tight text-white">PulseNote AI</span>
            </button>
            <span className="hidden text-slate-600 sm:inline">/</span>
            <button
              type="button"
              onClick={() => onSelectPost(null)}
              className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white sm:inline"
            >
              Blog
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Home
            </button>
            <button
              type="button"
              onClick={onStartWorkspace}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-400"
            >
              <Sparkles className="h-4 w-4" />
              Try Free
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        {activePost ? (
          <article className="mx-auto max-w-3xl">
            <button
              type="button"
              onClick={() => onSelectPost(null)}
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              <ArrowLeft className="h-4 w-4" />
              All clinical documentation guides
            </button>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
              <span className="rounded-md bg-indigo-500/15 px-2.5 py-1 text-indigo-300">
                {activePost.category}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {activePost.publishedAt}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {activePost.readTime}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl leading-tight">
              {activePost.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              {activePost.excerpt}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4">
              <div className="text-sm text-slate-400">
                By <span className="font-medium text-slate-200">{activePost.author}</span>
              </div>
              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share on LinkedIn
              </a>
            </div>

            <div className="mt-10 space-y-10">
              {activePost.sections.map((section, idx) => (
                <section key={idx} className="space-y-4">
                  <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-base leading-7 text-slate-300">
                      {p}
                    </p>
                  ))}
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-slate-200">
                      {section.bullets.map((item, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-14 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900 to-slate-900 p-7 sm:p-8">
              <h3 className="text-xl font-semibold text-white">
                Turn raw encounter notes into structured SOAP documents in seconds
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Deterministic clinical schemas with fact-checking against your transcript. Start free with 5 notes per month — no credit card required.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onStartWorkspace}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
                >
                  Open PulseNote Workspace
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPost(null)}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
                >
                  Read more guides
                </button>
              </div>
            </div>
          </article>
        ) : (
          <div>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                <BookOpen className="h-4 w-4" />
                Clinical & Enterprise Documentation Guides
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                PulseNote AI Blog
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Actionable templates and standards for primary care SOAP notes, hospital discharge summaries, and hallucination-free clinical documentation.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {BLOG_POSTS.map((post) => (
                <article
                  key={post.slug}
                  className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131722] p-6 transition-all hover:border-indigo-500/40 hover:bg-[#161b28]"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="font-medium text-indigo-300">{post.category}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-semibold leading-snug text-white group-hover:text-indigo-300 transition-colors">
                      <button
                        type="button"
                        onClick={() => onSelectPost(post.slug)}
                        className="text-left"
                      >
                        {post.title}
                      </button>
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs text-slate-500">{post.publishedAt}</span>
                    <button
                      type="button"
                      onClick={() => onSelectPost(post.slug)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      Read guide
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#131722] p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Ready to structure your next encounter?</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Try SOAP notes, discharge summaries, referrals, and RFCs free with 5 notes/month.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onStartWorkspace}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
