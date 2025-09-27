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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Trash2 } from 'lucide-react';

interface CandidateListProps {
  candidates: Candidate[];
  onSelectCandidate: (id: string) => void;
  onDeleteSelected: (ids: string[]) => void;
}

export function CandidateList({
  candidates,
  onSelectCandidate,
  onDeleteSelected,
}: CandidateListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'name_asc'>(
    'score_desc'
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAndSortedCandidates.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectSingle = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const getScoreBadgeVariant = (score: number | null) => {
    if (score === null) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  }

  const handleDeleteClick = () => {
    onDeleteSelected(selectedIds);
    setSelectedIds([]);
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Candidate Dashboard</CardTitle>
             <CardDescription>
                Click on a row to view detailed interview results for a candidate.
            </CardDescription>
            <div className="flex flex-col md:flex-row gap-4 pt-2">
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
                 {selectedIds.length > 0 && (
                    <Button variant="destructive" onClick={handleDeleteClick} className="ml-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedIds.length})
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                 <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={selectedIds.length > 0 && selectedIds.length === filteredAndSortedCandidates.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                    />
                 </TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Summary</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredAndSortedCandidates.map((candidate) => (
                <TableRow
                    key={candidate.id}
                    data-state={selectedIds.includes(candidate.id) && "selected"}
                >
                    <TableCell>
                         <Checkbox 
                            checked={selectedIds.includes(candidate.id)}
                            onCheckedChange={(checked) => handleSelectSingle(candidate.id, !!checked)}
                            aria-label="Select row"
                         />
                    </TableCell>
                    <TableCell 
                        className="font-medium cursor-pointer"
                        onClick={() => onSelectCandidate(candidate.id)}
                    >
                        {candidate.name}
                    </TableCell>
                    <TableCell 
                        className="text-right cursor-pointer"
                        onClick={() => onSelectCandidate(candidate.id)}
                    >
                        <Badge variant={getScoreBadgeVariant(candidate.interview.score)}>{candidate.interview.score ?? 'N/A'}</Badge>
                    </TableCell>
                    <TableCell 
                        className="max-w-md truncate cursor-pointer"
                        onClick={() => onSelectCandidate(candidate.id)}
                    >
                    {candidate.interview.summary}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
            </div>
             {filteredAndSortedCandidates.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    No candidates found.
                </div>
             )}
        </CardContent>
    </Card>
  );
}