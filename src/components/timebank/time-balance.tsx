import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, Info } from "lucide-react";

interface TimeBalanceProps {
  currentBalance: number; // in hours
  totalCredited?: number; // in hours
  totalSpent?: number; // in hours
}

export function TimeBalanceDisplay({ currentBalance, totalCredited, totalSpent }: TimeBalanceProps) {
  return (
    <Card className="shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" /> Your Time Bank
        </CardTitle>
        <CardDescription>
          An overview of your time contributions and exchanges.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-6 bg-gradient-to-br from-primary/80 to-primary rounded-lg shadow-md">
          <p className="text-sm font-medium text-primary-foreground/80">Current Balance</p>
          <p className="text-5xl font-bold text-primary-foreground">
            {currentBalance.toFixed(1)} <span className="text-3xl">hours</span>
          </p>
        </div>
        
        {(totalCredited !== undefined || totalSpent !== undefined) && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {totalCredited !== undefined && (
                    <div className="p-4 bg-secondary/50 rounded-lg flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Time Credited</p>
                            <p className="text-xl font-semibold">{totalCredited.toFixed(1)} hours</p>
                        </div>
                    </div>
                )}
                {totalSpent !== undefined && (
                    <div className="p-4 bg-secondary/50 rounded-lg flex items-center gap-3">
                        <TrendingDown className="h-8 w-8 text-red-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Time Spent</p>
                            <p className="text-xl font-semibold">{totalSpent.toFixed(1)} hours</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="flex items-start p-3 bg-accent/10 border-l-4 border-accent text-accent-foreground rounded-md">
            <Info className="h-5 w-5 mr-3 mt-0.5 shrink-0 text-accent"/>
            <p className="text-sm">
                Your time balance reflects the net hours from skills you&apos;ve offered versus skills you&apos;ve received. Keep contributing to earn more time!
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
