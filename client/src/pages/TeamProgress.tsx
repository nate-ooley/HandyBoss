import React, { useState } from 'react';
import { SideNavigation } from '../components/SideNavigation';
import { BossManHeader } from '../components/BossManHeader';
import BossManCharacter from '../components/BossManCharacter.tsx';
import { 
  Award, 
  Trophy, 
  Zap, 
  Star, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle, 
  User, 
  Users,
  Clock8,
  SquareStack
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

// Types for team members and achievements
interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  level: number;
  points: number;
  badges: string[];
  tasksCompleted: number;
  daysOnTime: number;
  jobsitesVisited: number;
  safetyScore: number;
  streak: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress: number;
  completed: boolean;
}

interface Leaderboard {
  id: number;
  category: string;
  icon: React.ReactNode;
  members: {
    memberId: number;
    score: number;
  }[];
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  reward: string;
  pointsValue: number;
  deadline: string;
  progress: number;
  icon: React.ReactNode;
}

export default function TeamProgress() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sample data for team members
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Mike Johnson',
      role: 'Site Foreman',
      level: 12,
      points: 12750,
      badges: ['safety-expert', 'team-motivator', 'efficiency-master'],
      tasksCompleted: 47,
      daysOnTime: 25,
      jobsitesVisited: 8,
      safetyScore: 98,
      streak: 14
    },
    {
      id: 2,
      name: 'Carlos Rodriguez',
      role: 'Electrician',
      level: 8,
      points: 8420,
      badges: ['tech-wizard', 'accuracy-king'],
      tasksCompleted: 36,
      daysOnTime: 22,
      jobsitesVisited: 6,
      safetyScore: 92,
      streak: 7
    },
    {
      id: 3,
      name: 'Sarah Thompson',
      role: 'Project Manager',
      level: 15,
      points: 15300,
      badges: ['scheduler-pro', 'client-liaison', 'team-builder'],
      tasksCompleted: 51,
      daysOnTime: 30,
      jobsitesVisited: 12,
      safetyScore: 95,
      streak: 21
    },
    {
      id: 4,
      name: 'Dave Wilson',
      role: 'Carpenter',
      level: 7,
      points: 7150,
      badges: ['craftsman'],
      tasksCompleted: 29,
      daysOnTime: 18,
      jobsitesVisited: 5,
      safetyScore: 87,
      streak: 5
    },
    {
      id: 5,
      name: 'Jasmine Lee',
      role: 'Safety Officer',
      level: 11,
      points: 11340,
      badges: ['safety-guru', 'record-keeper'],
      tasksCompleted: 42,
      daysOnTime: 29,
      jobsitesVisited: 9,
      safetyScore: 100,
      streak: 18
    }
  ];
  
  // Sample achievements
  const achievements: Achievement[] = [
    {
      id: 1,
      name: 'Safety First',
      description: 'Complete 10 safety inspections with perfect scores',
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      points: 500,
      tier: 'gold',
      progress: 100,
      completed: true
    },
    {
      id: 2,
      name: 'Efficiency Expert',
      description: 'Complete 5 projects ahead of schedule',
      icon: <Clock className="h-8 w-8 text-blue-500" />,
      points: 750,
      tier: 'silver',
      progress: 60,
      completed: false
    },
    {
      id: 3,
      name: 'Team Player',
      description: 'Collaborate with 15 different crew members',
      icon: <Users className="h-8 w-8 text-purple-500" />,
      points: 300,
      tier: 'bronze',
      progress: 80,
      completed: false
    },
    {
      id: 4,
      name: 'Perfect Attendance',
      description: 'Maintain a 30-day on-time streak',
      icon: <Calendar className="h-8 w-8 text-amber-500" />,
      points: 1000,
      tier: 'platinum',
      progress: 70,
      completed: false
    }
  ];
  
  // Sample leaderboards
  const leaderboards: Leaderboard[] = [
    {
      id: 1,
      category: 'Productivity',
      icon: <Zap className="h-5 w-5" />,
      members: [
        { memberId: 3, score: 51 },
        { memberId: 1, score: 47 },
        { memberId: 5, score: 42 },
        { memberId: 2, score: 36 },
        { memberId: 4, score: 29 }
      ]
    },
    {
      id: 2,
      category: 'Safety Rating',
      icon: <CheckCircle className="h-5 w-5" />,
      members: [
        { memberId: 5, score: 100 },
        { memberId: 1, score: 98 },
        { memberId: 3, score: 95 },
        { memberId: 2, score: 92 },
        { memberId: 4, score: 87 }
      ]
    },
    {
      id: 3,
      category: 'Attendance',
      icon: <Clock8 className="h-5 w-5" />,
      members: [
        { memberId: 3, score: 30 },
        { memberId: 5, score: 29 },
        { memberId: 1, score: 25 },
        { memberId: 2, score: 22 },
        { memberId: 4, score: 18 }
      ]
    }
  ];
  
  // Active challenges
  const challenges: Challenge[] = [
    {
      id: 1,
      title: 'Perfect Week',
      description: 'Have all team members arrive on time every day this week',
      reward: '1,000 Team Points + Safety Bonus',
      pointsValue: 1000,
      deadline: '3 days left',
      progress: 70,
      icon: <Calendar className="h-6 w-6 text-primary" />
    },
    {
      id: 2,
      title: 'Safety Streak',
      description: 'Complete 14 days without a safety incident',
      reward: 'Level Up Safety Rating + 500 Points',
      pointsValue: 500,
      deadline: '5 days left',
      progress: 65,
      icon: <CheckCircle className="h-6 w-6 text-green-500" />
    },
    {
      id: 3,
      title: 'Rapid Response',
      description: 'Respond to all client requests within 30 minutes',
      reward: 'Client Satisfaction Badge + 750 Points',
      pointsValue: 750,
      deadline: '2 days left',
      progress: 90,
      icon: <Zap className="h-6 w-6 text-amber-500" />
    }
  ];
  
  // Find team member by ID
  const findTeamMember = (id: number) => {
    return teamMembers.find(member => member.id === id);
  };
  
  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Get badge icon
  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'safety-expert':
      case 'safety-guru':
        return <CheckCircle className="h-4 w-4" />;
      case 'team-motivator':
      case 'team-builder':
        return <Users className="h-4 w-4" />;
      case 'efficiency-master':
      case 'scheduler-pro':
        return <Clock className="h-4 w-4" />;
      case 'tech-wizard':
        return <Zap className="h-4 w-4" />;
      case 'accuracy-king':
        return <TrendingUp className="h-4 w-4" />;
      case 'client-liaison':
        return <User className="h-4 w-4" />;
      case 'craftsman':
        return <Star className="h-4 w-4" />;
      case 'record-keeper':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };
  
  // Get tier color
  const getTierColor = (tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string => {
    switch (tier) {
      case 'bronze': return 'bg-amber-700';
      case 'silver': return 'bg-slate-400';
      case 'gold': return 'bg-amber-400';
      case 'platinum': return 'bg-cyan-300';
      default: return 'bg-gray-500';
    }
  };
  
  // Get level progress percentage
  const getLevelProgress = (member: TeamMember): number => {
    // Simple algorithm: points needed for next level = current level * 1000
    const pointsForNextLevel = (member.level + 1) * 1000;
    const pointsFromLastLevel = member.level * 1000;
    const currentLevelPoints = member.points - pointsFromLastLevel;
    const pointsNeededForLevel = pointsForNextLevel - pointsFromLastLevel;
    return Math.round((currentLevelPoints / pointsNeededForLevel) * 100);
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <SideNavigation />
      
      <div className="flex-1">
        <BossManHeader 
          title="Team Progress Dashboard" 
          isBossMode={true}
        />
        
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Team Performance Hub</h1>
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              <span className="text-xl font-bold">Team Points: {formatNumber(teamMembers.reduce((sum, member) => sum + member.points, 0))}</span>
            </div>
          </div>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 gap-4 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto py-3"
              >
                <div className="flex flex-col items-center">
                  <Zap className="h-5 w-5 mb-1" />
                  <span>Overview</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="leaderboards" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto py-3"
              >
                <div className="flex flex-col items-center">
                  <TrendingUp className="h-5 w-5 mb-1" />
                  <span>Leaderboards</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="achievements" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto py-3"
              >
                <div className="flex flex-col items-center">
                  <Award className="h-5 w-5 mb-1" />
                  <span>Achievements</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="challenges" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto py-3"
              >
                <div className="flex flex-col items-center">
                  <Star className="h-5 w-5 mb-1" />
                  <span>Challenges</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map(member => (
                  <Card key={member.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{member.name}</CardTitle>
                          <CardDescription>{member.role}</CardDescription>
                        </div>
                        <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-10 h-10 text-lg font-bold">
                          {member.level}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="mb-4">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Level Progress</span>
                          <span>{getLevelProgress(member)}%</span>
                        </div>
                        <Progress value={getLevelProgress(member)} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Tasks: {member.tasksCompleted}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>On Time: {member.daysOnTime} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <SquareStack className="h-4 w-4 text-slate-500" />
                          <span>Jobsites: {member.jobsitesVisited}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span>Streak: {member.streak} days</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Badges Earned:</div>
                        <div className="flex flex-wrap gap-2">
                          {member.badges.map((badge, idx) => (
                            <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
                              {getBadgeIcon(badge)}
                              <span>{badge.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 border-t">
                      <div className="flex justify-between items-center w-full">
                        <div className="text-sm text-muted-foreground">Safety Score: {member.safetyScore}/100</div>
                        <Button variant="ghost" size="sm" className="text-primary">View Details</Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="leaderboards" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {leaderboards.map(leaderboard => (
                  <Card key={leaderboard.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {leaderboard.icon}
                        <CardTitle>{leaderboard.category} Leaders</CardTitle>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-4">
                        {leaderboard.members.map((member, idx) => {
                          const teamMember = findTeamMember(member.memberId);
                          if (!teamMember) return null;
                          
                          return (
                            <li key={member.memberId} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                  {idx + 1}
                                </div>
                                <span className="font-medium">{teamMember.name}</span>
                              </div>
                              <span className="font-bold">{member.score}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="achievements" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map(achievement => (
                  <Card key={achievement.id} className={`${achievement.completed ? 'border-2 border-green-500' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="mt-1">{achievement.icon}</div>
                          <div>
                            <CardTitle>{achievement.name}</CardTitle>
                            <CardDescription>{achievement.description}</CardDescription>
                          </div>
                        </div>
                        <Badge className={`${getTierColor(achievement.tier)} text-white`}>
                          {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="mb-2">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <Progress value={achievement.progress} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-4 w-4 fill-amber-500" />
                          <span className="font-bold">{achievement.points} points</span>
                        </div>
                        
                        {achievement.completed ? (
                          <Badge variant="outline" className="border-green-500 text-green-500 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Achieved</span>
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm">Claim when completed</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="challenges" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {challenges.map(challenge => (
                  <Card key={challenge.id}>
                    <CardHeader className="pb-2">
                      <div className="flex gap-3">
                        <div className="p-2 bg-muted rounded-md">
                          {challenge.icon}
                        </div>
                        <div>
                          <CardTitle>{challenge.title}</CardTitle>
                          <Badge variant="outline" className="mt-1">{challenge.deadline}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>
                      
                      <div className="mb-4">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Challenge Progress</span>
                          <span>{challenge.progress}%</span>
                        </div>
                        <Progress value={challenge.progress} className="h-2" />
                      </div>
                      
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-sm font-medium mb-1">Reward:</div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{challenge.reward}</span>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>{challenge.pointsValue}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t pt-3">
                      <Button className="w-full">Accept Challenge</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}