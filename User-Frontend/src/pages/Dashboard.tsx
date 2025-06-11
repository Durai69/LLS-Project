
import MainLayout from '@/components/MainLayout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSurvey } from '@/contexts/SurveyContext';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { getSurveyProgress, surveySubmissions } = useSurvey();
  const progress = getSurveyProgress();
  const progressPercentage = Math.round((progress.completed / progress.total) * 100);

  // Calculate department ratings for the chart
  const departmentRatings = [
    { name: 'IT', rating: 85 },
    { name: 'HR', rating: 90 },
    { name: 'QA', rating: 85 },
    { name: 'SCM', rating: 70 },
    { name: 'TPM', rating: 88 },
    { name: 'CSD', rating: 95 },
  ];

  const handleBarClick = (data: any) => {
    if (data.rating < 80) {
      // In a real app, this would navigate to a detailed view or show remarks
      console.log(`Clicked on ${data.name} with low rating: ${data.rating}`);
    }
  };

  return (
    <MainLayout>
      <div className="px-6">
        <h2 className="text-2xl font-semibold mb-6">
          Your Department Rating
        </h2>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentRatings} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} />
                    <Tooltip />
                    <Bar dataKey="rating" onClick={handleBarClick}>
                      {departmentRatings.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name === 'SCM' ? '#FF6B6B' : '#e5e7ff'} 
                          stroke={entry.rating >= 80 ? '#9b87f5' : '#FF6B6B'} 
                          strokeWidth={1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                *Click on Red Graph to view the remarks / improvement suggestions
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-medium mb-2">Survey Progress = {progress.completed}/{progress.total}</h3>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
