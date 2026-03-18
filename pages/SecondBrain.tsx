import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { secondBrain } from '../lib/secondBrain';

interface Document {
  id: string;
  title: string;
  content: string;
  content_type: string;
  category: string;
  tags: string[];
  source: string;
  created_at: string;
}

const CATEGORIES = ['all', 'root', 'identity', 'professional', 'personal', 'ai-assistant', 'financial', 'learning', 'template'] as const;

const categoryLabels: Record<string, string> = {
  all: 'All',
  root: 'Root',
  identity: 'Identity',
  professional: 'Professional',
  personal: 'Personal',
  'ai-assistant': 'AI Assistant',
  financial: 'Financial',
  learning: 'Learning',
  template: 'Template',
};

const categoryColors: Record<string, string> = {
  root: 'border-red-500/40 text-red-400 bg-red-500/10',
  identity: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
  professional: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  personal: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  'ai-assistant': 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
  financial: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  learning: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
  template: 'border-slate-500/40 text-slate-400 bg-slate-500/10',
};

export default function SecondBrain() {
  const { category: routeCategory } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Sync state from route on mount / route change
  useEffect(() => {
    if (routeCategory && CATEGORIES.includes(routeCategory as typeof CATEGORIES[number])) {
      setActiveCategory(routeCategory);
    } else {
      setActiveCategory('all');
    }
  }, [routeCategory]);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      const { data, error } = await secondBrain
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Second Brain fetch error:', error);
      } else {
        setDocuments(data || []);
      }
      setLoading(false);
    };
    fetchDocs();
  }, []);

  const filtered = useMemo(() => {
    let docs = documents;
    if (activeCategory !== 'all') {
      docs = docs.filter(d => d.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [documents, activeCategory, search]);

  const handleCategoryClick = (cat: string) => {
    setExpandedId(null);
    setActiveCategory(cat);
    if (cat === 'all') {
      navigate('/second-brain');
    } else {
      navigate(`/second-brain/${cat}`);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    for (const doc of documents) {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    }
    return counts;
  }, [documents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            🧠 Second Brain
          </h1>
          <p className="text-xs text-slate-500 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {documents.length} documents indexed
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents by title or content..."
          className="w-full pl-10 pr-4 py-2.5 text-xs border bg-[#0d0d0d] border-[#1e293b] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/50 transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 py-1.5 text-xs border transition-all ${
                isActive
                  ? 'border-green-500/50 text-green-400 bg-green-500/10'
                  : 'border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {categoryLabels[cat] || cat} <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-600 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Loading documents...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-600 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            No documents found.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(doc => {
            const isExpanded = expandedId === doc.id;
            const badgeClass = categoryColors[doc.category] || 'border-slate-500/40 text-slate-400 bg-slate-500/10';

            return (
              <div
                key={doc.id}
                onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                className={`border bg-[#0d0d0d] p-4 cursor-pointer transition-all hover:border-green-500/30 ${
                  isExpanded ? 'border-green-500/40 col-span-1 md:col-span-2 xl:col-span-3' : 'border-[#1e293b]'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3
                    className="text-sm font-medium text-slate-200 leading-tight"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {doc.title}
                  </h3>
                  <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] border ${badgeClass}`}>
                    {categoryLabels[doc.category] || doc.category}
                  </span>
                </div>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {doc.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-[10px] text-slate-500 border border-[#1e293b] bg-[#111]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content Preview / Full */}
                <p
                  className={`text-xs text-slate-500 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {isExpanded ? doc.content : doc.content.slice(0, 150) + (doc.content.length > 150 ? '...' : '')}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e293b]">
                  <span className="text-[10px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {isExpanded ? 'Click to collapse' : 'Click to expand'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
