import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/ui/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { useAuth } from '@/contexts/AuthContext';
import { useClerkUser } from '@/hooks/useClerkUser';

import { analyticsApi, AnalyticsData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  ArrowTrendingDownIcon, 
  LightBulbIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const Analytics = () => {
  const { backendUser, isLoading: isUserLoading } = useClerkUser();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!backendUser) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await analyticsApi.getAnalytics(backendUser.id);
        setAnalyticsData(data);
        
        // Process category data for chart
        const categoryChartData = Object.entries(data.by_category).map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }));
        setCategoryData(categoryChartData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load analytics data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!isUserLoading) {
      loadAnalytics();
    }
  }, [backendUser, isUserLoading, toast]);

  if (!backendUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Alert>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to view analytics.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Analyze your spending patterns and get AI-powered insights.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading analytics...</p>
          </div>
        ) : !analyticsData || categoryData.length === 0 ? (
          <Alert>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              No expense data available. Start by adding some expenses to see analytics.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Spending Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Expected</p>
                      <p className="text-2xl font-bold text-primary">
                        ${analyticsData?.expected_spend.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Actual</p>
                      <p className="text-2xl font-bold text-accent">
                        ${analyticsData?.actual_spend.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {analyticsData && analyticsData.savings >= 0 ? 'Savings' : 'Overspend'}
                    </p>
                    <p className={`text-2xl font-bold ${analyticsData && analyticsData.savings >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ${Math.abs(analyticsData?.savings || 0).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LightBulbIcon className="h-5 w-5 text-accent" />
                  AI-Powered Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-accent/20 bg-accent/5">
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                  <AlertDescription className="whitespace-pre-line">
                    {analyticsData?.ai_insight}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Daily Allowance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ${analyticsData?.allowance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Days Tracked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {analyticsData?.days_counted} days
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Overspend Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {analyticsData?.overspend_days} days
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;