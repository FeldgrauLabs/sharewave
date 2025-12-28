import { Card, CardContent } from "@/components/ui/card";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";

interface CompoundTableProps {
  data: Array<{ year: number; total: number; totalContributed: number }>;
}

export default function CompoundTable({ data }: CompoundTableProps) {
  const formatNumbers = (value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Total Contributed ($)</TableHead>
              <TableHead className="text-right">Total Gain ($)</TableHead>
              <TableHead className="text-right">Total Value ($)</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((point) => (
              <TableRow key={point.year}>
                <TableCell>{point.year}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumbers(point.totalContributed)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumbers(point.total - point.totalContributed)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatNumbers(point.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}