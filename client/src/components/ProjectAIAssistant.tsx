import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Users,
  ArrowRightCircle,
  Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface ProjectAIAssistantProps {
  projectId: number;
  userId?: number;
}

interface ProjectSummary {
  projectOverview: {
    name: string;
    status: string;
    timeframe: string;
    description: string;
    progressPercent?: number;
  };
  timelineAnalysis: {
    status: 'on-schedule' | 'ahead' | 'delayed';
    details: string;
    estimatedCompletion?: string;
  };
  keyIssues: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  teamInsights: {
    memberCount: number;
    performance: string;
    keyMembers?: Array<{
      name: string;
      role: string;
    }>;
  };
  nextSteps: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export function ProjectAIAssistant({ projectId, userId = 1 }: ProjectAIAssistantProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [proAccess, setProAccess] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [expanded, setExpanded] = useState(true);
  
  // Check if user has Pro access
  useEffect(() => {
    const checkProAccess = async () => {
      try {
        const response = await apiRequest('GET', `/api/users/${userId}/pro-access`);
        const data = await response.json();
        setProAccess(data.hasProAccess);
      } catch (error) {
        console.error('Error checking Pro access:', error);
        setProAccess(false);
      }
    };
    
    checkProAccess();
  }, [userId]);
  
  // Load project summary
  const loadSummary = async () => {
    if (!proAccess) return;
    
    setLoading(true);
    try {
      const response = await apiRequest('GET', `/api/projects/${projectId}/ai/summary?userId=${userId}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error loading project summary:', error);
      toast({
        title: 'Failed to load summary',
        description: 'Could not retrieve the project insights.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle asking a question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !proAccess) return;
    
    setAskingQuestion(true);
    try {
      const response = await apiRequest('POST', `/api/projects/${projectId}/ai/ask`, {
        question: question.trim(),
        userId
      });
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        title: 'Failed to get answer',
        description: 'Could not process your question at this time.',
        variant: 'destructive'
      });
    } finally {
      setAskingQuestion(false);
    }
  };
  
  // Load summary when tab changes to summary
  useEffect(() => {
    if (activeTab === 'summary' && !summary && proAccess) {
      loadSummary();
    }
  }, [activeTab, summary, proAccess]);
  
  if (proAccess === null) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Project AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render Pro subscription required message
  if (proAccess === false) {
    return (
      <Card className="mb-6 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Project AI Assistant
            <Badge variant="outline" className="ml-2">PRO</Badge>
          </CardTitle>
          <CardDescription>
            Unlock AI-powered project insights and assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground mb-4">
            Subscribe to our Pro plan to access AI-powered project analysis, 
            summaries, and get answers to your project questions.
          </p>
          <Button variant="default">
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Project AI Assistant
            <Badge variant="outline" className="ml-2">PRO</Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          AI-powered insights and assistance for your project
        </CardDescription>
      </CardHeader>
      
      {expanded && (
        <>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="summary" className="flex-1">Project Summary</TabsTrigger>
                <TabsTrigger value="ask" className="flex-1">Ask a Question</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : summary ? (
                  <div className="space-y-6">
                    {/* Project Overview Section */}
                    <div>
                      <h3 className="font-medium flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        Project Overview
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">{summary.projectOverview.description}</p>
                      {summary.projectOverview.progressPercent !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between mb-1 text-xs">
                            <span>Progress</span>
                            <span>{summary.projectOverview.progressPercent}%</span>
                          </div>
                          <Progress value={summary.projectOverview.progressPercent} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Timeline Analysis */}
                    <div>
                      <h3 className="font-medium flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        Timeline
                      </h3>
                      <div className="mb-1 flex gap-2 items-center">
                        <Badge 
                          variant={
                            summary.timelineAnalysis.status === 'on-schedule' ? 'outline' : 
                            summary.timelineAnalysis.status === 'ahead' ? 'default' : 'destructive'
                          }
                        >
                          {summary.timelineAnalysis.status === 'on-schedule' ? 'On Schedule' : 
                           summary.timelineAnalysis.status === 'ahead' ? 'Ahead of Schedule' : 'Delayed'}
                        </Badge>
                        {summary.timelineAnalysis.estimatedCompletion && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Est. completion: {summary.timelineAnalysis.estimatedCompletion}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{summary.timelineAnalysis.details}</p>
                    </div>
                    
                    <Separator />
                    
                    {/* Key Issues */}
                    {summary.keyIssues.length > 0 && (
                      <div>
                        <h3 className="font-medium flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Key Issues
                        </h3>
                        <ul className="space-y-2">
                          {summary.keyIssues.map((issue, i) => (
                            <li key={i} className="text-sm">
                              <div className="flex gap-2 items-center">
                                <Badge 
                                  variant={
                                    issue.severity === 'low' ? 'outline' : 
                                    issue.severity === 'medium' ? 'secondary' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {issue.severity}
                                </Badge>
                                <span className="font-medium">{issue.title}</span>
                              </div>
                              <p className="text-muted-foreground text-xs mt-1">{issue.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {/* Team Insights */}
                    <div>
                      <h3 className="font-medium flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-violet-500" />
                        Team ({summary.teamInsights.memberCount})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">{summary.teamInsights.performance}</p>
                      {summary.teamInsights.keyMembers && summary.teamInsights.keyMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {summary.teamInsights.keyMembers.map((member, i) => (
                            <Badge key={i} variant="outline" className="flex gap-1 items-center">
                              {member.name}
                              <span className="text-xs text-muted-foreground">({member.role})</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Next Steps */}
                    <div>
                      <h3 className="font-medium flex items-center gap-2 mb-2">
                        <ArrowRightCircle className="h-4 w-4 text-green-500" />
                        Next Steps
                      </h3>
                      <ul className="space-y-2">
                        {summary.nextSteps.map((step, i) => (
                          <li key={i} className="text-sm">
                            <div className="flex gap-2 items-center">
                              <Badge 
                                variant={
                                  step.priority === 'low' ? 'outline' : 
                                  step.priority === 'medium' ? 'secondary' : 'default'
                                }
                                className="text-xs"
                              >
                                {step.priority}
                              </Badge>
                              <span className="font-medium">{step.title}</span>
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">{step.description}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No project summary available.</p>
                    <Button onClick={loadSummary}>Generate Summary</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="ask">
                <form onSubmit={handleAskQuestion} className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ask a question about this project..." 
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      disabled={askingQuestion}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!question.trim() || askingQuestion}>
                      {askingQuestion ? 'Thinking...' : 'Ask'}
                    </Button>
                  </div>
                  
                  {askingQuestion && (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  )}
                  
                  {!askingQuestion && answer && (
                    <div className="border rounded-md p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Answer:</h4>
                      <p className="text-sm whitespace-pre-line">{answer}</p>
                    </div>
                  )}
                  
                  {!askingQuestion && !answer && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Ask questions about project timeline, team, issues, costs, or any other aspect of this project.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {[
                          "When will this project be completed?",
                          "What are the main issues?",
                          "Who are the key team members?",
                          "What materials are needed?"
                        ].map((q, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => setQuestion(q)}
                          >
                            {q}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="text-xs text-muted-foreground pt-0">
            <p>
              AI-generated content may not be completely accurate. Verify important information.
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}