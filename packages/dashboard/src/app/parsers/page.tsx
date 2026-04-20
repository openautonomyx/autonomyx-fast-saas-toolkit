/**
 * Parsers Page - Manage data parsers
 * Uses configurable UI theme
 */

"use client";

import { useState } from 'react';
import { UniversalShell } from '../../components/UniversalShell';
import { UniversalButton } from '../../components/UniversalButton';
import { UniversalInput } from '../../components/UniversalInput';
import { UniversalModal } from '../../components/UniversalModal';

// Parser configuration
const PARSERS = [
  { id: 'airtable', name: 'Airtable', icon: '📊', description: 'Parse Airtable bases, tables, and records' },
  { id: 'notion', name: 'Notion', icon: '📗', description: 'Query Notion databases and fetch page content' },
  { id: 'excel', name: 'Excel', icon: '📘', description: 'Parse Excel files (.xlsx, .xls, .xlsm)' },
  { id: 'google-sheets', name: 'Google Sheets', icon: '📙', description: 'Parse Google Sheets with API integration' },
  { id: 'github', name: 'GitHub API', icon: '🐙', description: 'Fetch issues, PRs, releases from GitHub' },
  { id: 'wikipedia', name: 'Wikipedia', icon: '📚', description: 'Extract tables and content from Wikipedia' },
  { id: 'wikidata', name: 'Wikidata', icon: '🗃️', description: 'Query Wikidata with SPARQL' },
  { id: 'wordpress', name: 'WordPress', icon: '📝', description: 'Fetch posts, pages, media from WordPress' },
  { id: 'html-tables', name: 'HTML Tables', icon: '🌐', description: 'Extract tables from any web page' },
  { id: 'pdf-tables', name: 'PDF Tables', icon: '📄', description: 'Extract tables from PDF documents' },
  { id: 'markdown', name: 'Markdown', icon: '📋', description: 'Parse markdown tables' },
  { id: 'nextjs-ssr', name: 'Next.js SSR', icon: '⚛️', description: 'Parse server-rendered Next.js pages' },
];

export default function ParsersPage() {
  const [selectedParser, setSelectedParser] = useState<typeof PARSERS[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openParser = (parser: typeof PARSERS[0]) => {
    setSelectedParser(parser);
    setIsModalOpen(true);
  };

  return (
    <UniversalShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Data Parsers</h1>
          <p className="text-muted-foreground mt-1">
            Extract structured data from 12+ data sources
          </p>
        </div>

        {/* Parser Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARSERS.map((parser) => (
            <div
              key={parser.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openParser(parser)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{parser.icon}</span>
                <div>
                  <h3 className="font-medium">{parser.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {parser.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Parser Modal */}
        <UniversalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Parse ${selectedParser?.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure parser parameters for {selectedParser?.name}
            </p>
            <UniversalInput label="URL / Source" placeholder="Enter URL or source identifier" />
            <div className="flex gap-2 pt-4">
              <UniversalButton>Parse Data</UniversalButton>
              <UniversalButton variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</UniversalButton>
            </div>
          </div>
        </UniversalModal>
      </div>
    </UniversalShell>
  );
}