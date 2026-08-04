import type { Metadata } from 'next';
import { TimeLogForm } from "@/components/timebank/time-log-form";
import { TimeBalanceDisplay } from "@/components/timebank/time-balance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TimeTransaction } from "@/types/skillswap"; // Assuming you have this type
import { Clock, ListChecks, Hourglass } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Time Bank - SkillSwap',
  description: 'Log your skill exchanges and manage your time balance.',
};

// Mock data - replace with actual data fetching
const timeBalanceData = {
  currentBalance: 18.5,
  totalCredited: 35.0,
  totalSpent: 16.5,
};

const mockTransactions: TimeTransaction[] = [
  { id: "t1", userName: "Bob The Builder", skillName: "Graphic Design", hours: 3.0, date: "2023-03-15", type: "spent", description: "Logo design for startup" },
  { id: "t2", userName: "Alice Wonderland", skillName: "JS Tutoring", hours: 2.0, date: "2023-03-10", type: "credited" },
  { id: "t3", userName: "Charlie Brown", skillName: "Spanish Practice", hours: 1.5, date: "2023-03-05", type: "credited", description: "Conversation about travel" },
  { id: "t4", userName: "Diana Prince", skillName: "Yoga Session", hours: 1.0, date: "2023-02-28", type: "spent" },
  { id: "t5", userName: "Edward Scissorhands", skillName: "Garden Sculpting", hours: 5.0, date: "2023-02-20", type: "credited" },
];


export default function TimeBankPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Hourglass className="h-8 w-8 text-primary" /> Time Bank Management
        </h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto md:h-10">
          <TabsTrigger value="overview" className="py-2.5">Overview & Balance</TabsTrigger>
          <TabsTrigger value="logtime" className="py-2.5">Log New Exchange</TabsTrigger>
          <TabsTrigger value="history" className="py-2.5">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TimeBalanceDisplay 
            currentBalance={timeBalanceData.currentBalance}
            totalCredited={timeBalanceData.totalCredited}
            totalSpent={timeBalanceData.totalSpent}
          />
        </TabsContent>

        <TabsContent value="logtime">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" /> Log a Skill Exchange
              </CardTitle>
              <CardDescription>
                Record time spent giving or receiving help to update your balance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeLogForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-primary" /> Transaction History
              </CardTitle>
              <CardDescription>A record of all your time bank transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              {mockTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Skill</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.userName}</TableCell>
                        <TableCell>{transaction.skillName}</TableCell>
                        <TableCell className="text-right">{transaction.hours.toFixed(1)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={transaction.type === "credited" ? "default" : "destructive"} className="capitalize">
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                          {transaction.description || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
