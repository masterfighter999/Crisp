'use client';
import { useMemo, useState } from 'react';
import type { Candidate } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface CandidateListProps {
  candidates: Candidate[];
  onSelectCandidate: (id: string) => void;
}

export function CandidateList({
  candidates,
  onSelectCandidate,
}: CandidateListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'name_asc'>(
    'score_desc'
  );

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score_desc':
          return (b.interview.score ?? 0) - (a.interview.score ?? 0);
        case 'score_asc':
          return (a.interview.score ?? 0) - (b.interview.score ?? 0);
        case 'name_asc':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [candidates, searchTerm, sortBy]);
  
  const getScoreBadgeVariant = (score: number | null) => {
    if (score === null) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Candidate Dashboard</CardTitle>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="score_desc">Score: High to Low</SelectItem>
                    <SelectItem value="score_asc">Score: Low to High</SelectItem>
                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Summary</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredAndSortedCandidates.map((candidate) => (
                <TableRow
                    key={candidate.id}
                    onClick={() => onSelectCandidate(candidate.id)}
                    className="cursor-pointer"
                >
                    <TableCell className="font-medium">{candidate.name}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant={getScoreBadgeVariant(candidate.interview.score)}>{candidate.interview.score ?? 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                    {candidate.interview.summary}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
