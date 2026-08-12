import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, Hourglass, ShieldCheck, Info } from "lucide-react";

interface TimeBalanceProps {
  currentBalance: number; // in hours
  reservedHours?: number; // in hours
  availableHours?: number; // in hours
  totalCredited?: number; // in hours
  totalSpent?: number; // in hours
}

export function TimeBalanceDisplay({
  currentBalance,
  reservedHours = 0,
  availableHours = currentBalance,
  totalCredited,
  totalSpent,
}: TimeBalanceProps) {
  return (
    <Card className="shadow-xl border border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-7 w-7 text-primary" /> Your Time Bank Overview
        </CardTitle>
        <CardDescription>
          An audit-verified summary of your total, reserved, and available time credits.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Balance Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-6 bg-gradient-to-br from-primary/90 to-primary rounded-xl shadow-md text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Total Balance</p>
            <p className="text-4xl font-bold mt-1">
              {currentBalance.toFixed(1)} <span className="text-xl font-medium">hrs</span>
            </p>
            <p className="text-[11px] opacity-75 mt-1">Net accrued community time</p>
          </div>

          <div className="text-center p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
              <Hourglass className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Reserved Hours</p>
            </div>
            <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {reservedHours.toFixed(1)} <span className="text-xl font-medium">hrs</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Locked in accepted exchanges</p>
          </div>

          <div className="text-center p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Available Balance</p>
            </div>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              {availableHours.toFixed(1)} <span className="text-xl font-medium">hrs</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Ready for new proposals</p>
          </div>
        </div>

        {/* Accrued Credits vs Debits breakdown */}
        {(totalCredited !== undefined || totalSpent !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totalCredited !== undefined && (
              <div className="p-4 bg-secondary/50 border border-border/50 rounded-lg flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Time Earned</p>
                  <p className="text-lg font-bold">{totalCredited.toFixed(1)} hours</p>
                </div>
              </div>
            )}
            {totalSpent !== undefined && (
              <div className="p-4 bg-secondary/50 border border-border/50 rounded-lg flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-rose-500" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Time Spent</p>
                  <p className="text-lg font-bold">{totalSpent.toFixed(1)} hours</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start p-4 bg-muted/60 border-l-4 border-primary rounded-r-md">
          <Info className="h-5 w-5 mr-3 mt-0.5 shrink-0 text-primary" />
          <p className="text-xs text-foreground leading-relaxed">
            Your Time Bank balance represents zero-sum community time. Hours are reserved upon exchange acceptance and atomically transferred only when both participants confirm completion.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
