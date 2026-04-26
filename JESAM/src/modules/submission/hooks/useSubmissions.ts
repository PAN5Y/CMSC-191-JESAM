import { useState, useCallback } from 'react';
import { Manuscript, ResearchMetadata, Author, ScreeningDecision } from '../types';

// Mock data for development
const mockManuscripts: Manuscript[] = [
  {
    id: '1',
    manuscriptId: 'JESAM-2024-001',
    dateSubmitted: '2024-04-20',
    title: 'Impact of Urban Green Spaces on Air Quality',
    authors: [
      { id: '1', name: 'John Smith', email: 'john@example.com', affiliation: 'University A', isCorresponding: true },
    ],
    abstract: 'This study examines the correlation between urban green spaces and air quality metrics...',
    keywords: ['urban', 'green-spaces', 'air-quality'],
    classification: 'Air',
    status: 'In Submission Queue',
    similarity: 2.1,
    formattingStatus: 'passed',
  },
  {
    id: '2',
    manuscriptId: 'JESAM-2024-002',
    dateSubmitted: '2024-04-18',
    title: 'Sustainable Water Management in Agricultural Regions',
    authors: [
      { id: '2', name: 'Jane Doe', email: 'jane@example.com', affiliation: 'University B', isCorresponding: true },
    ],
    abstract: 'A comprehensive study on sustainable water management practices...',
    keywords: ['water', 'agriculture', 'sustainability'],
    classification: 'Water',
    status: 'Administrative Check',
    similarity: 1.5,
    formattingStatus: 'passed',
  },
];

/**
 * Hook for managing manuscript submissions
 */
export function useSubmissions() {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>(mockManuscripts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManuscripts = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual Supabase call
      // const { data, error } = await supabase
      //   .from('manuscripts')
      //   .select('*')
      //   .order('dateSubmitted', { ascending: false });
      // setManuscripts(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch manuscripts');
    } finally {
      setLoading(false);
    }
  }, []);

  const getManuscriptById = useCallback(
    (id: string) => manuscripts.find(m => m.id === id),
    [manuscripts]
  );

  const createManuscript = useCallback(
    async (metadata: ResearchMetadata, authors: Author[]) => {
      setLoading(true);
      try {
        // TODO: Replace with actual Supabase call
        const newManuscript: Manuscript = {
          id: Date.now().toString(),
          manuscriptId: `JESAM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
          dateSubmitted: new Date().toISOString().split('T')[0],
          title: metadata.title,
          authors,
          abstract: metadata.abstract,
          keywords: metadata.keywords.split(',').map(k => k.trim()),
          classification: (metadata.focus as any) || 'Land',
          status: 'In Submission Queue',
          formattingStatus: 'pending',
        };

        setManuscripts(prev => [newManuscript, ...prev]);
        return newManuscript;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create manuscript';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateManuscriptStatus = useCallback(
    async (manuscriptId: string, status: string) => {
      setLoading(true);
      try {
        // TODO: Replace with actual Supabase call
        setManuscripts(prev =>
          prev.map(m =>
            m.id === manuscriptId ? { ...m, status: status as any } : m
          )
        );
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update manuscript');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const recordScreeningDecision = useCallback(
    async (decision: ScreeningDecision) => {
      setLoading(true);
      try {
        // TODO: Replace with actual Supabase call
        const newStatus =
          decision.decision === 'approve'
            ? 'Peer Review'
            : decision.decision === 'reject'
            ? 'Rejected'
            : 'Administrative Check';

        await updateManuscriptStatus(decision.manuscriptId, newStatus);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record decision');
      } finally {
        setLoading(false);
      }
    },
    [updateManuscriptStatus]
  );

  return {
    manuscripts,
    loading,
    error,
    fetchManuscripts,
    getManuscriptById,
    createManuscript,
    updateManuscriptStatus,
    recordScreeningDecision,
  };
}
