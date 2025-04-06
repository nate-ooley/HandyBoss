import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Jobsite, ProjectMember, ProjectCommunication, CrewMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SideNavigation } from '@/components/SideNavigation';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Hammer, Users, Package, Wrench, ChevronRight, MessageCircle, Plus, Smile, ThumbsUp, User, PlusCircle, Paperclip, Languages, X, Send, Edit, Save, Info, UserPlus, FileText, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function Projects() {
  const [selectedTab, setSelectedTab] = useState<string>('active');

  // Fetch jobsites data
  const { data: jobsites = [] } = useQuery<Jobsite[]>({
    queryKey: ['/api/jobsites'],
    staleTime: 30000,
  });

  // Filter projects based on selected tab
  const filteredProjects = jobsites.filter(jobsite => {
    if (selectedTab === 'active') return jobsite.status === 'active';
    if (selectedTab === 'completed') return jobsite.status === 'completed';
    if (selectedTab === 'upcoming') return jobsite.status === 'scheduled';
    return true; // 'all' tab
  });

  // Calculate project progress (mock calculation)
  const calculateProgress = (jobsite: Jobsite): number => {
    if (jobsite.status === 'completed') return 100;
    if (jobsite.status === 'scheduled') return 0;
    
    // For active jobs, generate a semi-random progress based on the jobsite ID
    const baseProgress = (jobsite.id * 17) % 85;
    return baseProgress + 10; // Ensure it's at least 10% complete if active
  };
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SideNavigation />
      <div className="flex-1 flex flex-col">
        <header className="border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <span className="mr-2">+</span> New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Enter the details for your new construction project.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    {/* Form would go here */}
                    <p className="text-sm text-muted-foreground">Project creation form is under development.</p>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Create Project</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-8">
          <Tabs defaultValue="active" className="w-full" onValueChange={setSelectedTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="active">Active Projects</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Projects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-0">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} progress={calculateProgress(project)} />
                ))}
                
                {filteredProjects.length === 0 && (
                  <div className="col-span-full flex justify-center p-8">
                    <p className="text-muted-foreground">No active projects found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-0">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} progress={calculateProgress(project)} />
                ))}
                
                {filteredProjects.length === 0 && (
                  <div className="col-span-full flex justify-center p-8">
                    <p className="text-muted-foreground">No upcoming projects found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} progress={calculateProgress(project)} />
                ))}
                
                {filteredProjects.length === 0 && (
                  <div className="col-span-full flex justify-center p-8">
                    <p className="text-muted-foreground">No completed projects found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} progress={calculateProgress(project)} />
                ))}
                
                {filteredProjects.length === 0 && (
                  <div className="col-span-full flex justify-center p-8">
                    <p className="text-muted-foreground">No projects found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Jobsite;
  progress: number;
}

interface ProjectDetailsTabsProps {
  project: Jobsite;
  progress: number;
}

const ProjectDetailsTabs: React.FC<ProjectDetailsTabsProps> = ({ project, progress }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch project members
  const { data: projectMembers = [] } = useQuery<ProjectMember[]>({
    queryKey: ['/api/projects', project.id, 'members'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/projects/${project.id}/members`);
        return response.json();
      } catch (error) {
        // This is expected to fail if the API route isn't implemented yet
        console.log('Could not fetch project members', error);
        return [];
      }
    },
    staleTime: 60000,
  });
  
  // Fetch crew members for assigning to project
  const { data: crewMembers = [] } = useQuery<CrewMember[]>({
    queryKey: ['/api/crew'],
    staleTime: 60000,
  });
  
  // Fetch project communications
  const { data: communications = [] } = useQuery<ProjectCommunication[]>({
    queryKey: ['/api/projects', project.id, 'communications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/projects/${project.id}/communications`);
        return response.json();
      } catch (error) {
        // This is expected to fail if the API route isn't implemented yet
        console.log('Could not fetch project communications', error);
        return [];
      }
    },
    staleTime: 30000,
  });
  
  // State for new message
  const [newMessage, setNewMessage] = useState("");
  const [isTranslating, setIsTranslating] = useState(true);
  
  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ content, language }: { content: string, language: string }) => {
      const payload = {
        content,
        language,
        senderId: 1, // Current user ID (would come from auth context in real app)
        timestamp: new Date().toISOString()
      };
      
      const response = await apiRequest('POST', `/api/projects/${project.id}/communications`, payload);
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project.id, 'communications'] });
      toast({
        title: "Message sent",
        description: "Your message has been sent to the project team.",
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    addMessageMutation.mutate({
      content: newMessage,
      language: 'en' // Default to English for now
    });
  };
  
  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ communicationId, emoji }: { communicationId: number, emoji: string }) => {
      const payload = {
        userId: 1, // Current user ID
        emoji
      };
      
      const response = await apiRequest('POST', `/api/projects/communications/${communicationId}/reactions`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project.id, 'communications'] });
    },
    onError: (error) => {
      console.error('Failed to add reaction:', error);
      toast({
        title: "Failed to add reaction",
        description: "There was an error adding your reaction.",
        variant: "destructive",
      });
    }
  });
  
  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (communicationId: number) => {
      const payload = {
        userId: 1 // Current user ID
      };
      
      const response = await apiRequest('POST', `/api/projects/communications/${communicationId}/read`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project.id, 'communications'] });
    }
  });
  
  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };
  
  // Handle reactions
  const handleReaction = (communicationId: number, emoji: string) => {
    addReactionMutation.mutate({ communicationId, emoji });
  };
  
  // Handle mark as read
  const handleMarkAsRead = (communicationId: number) => {
    markAsReadMutation.mutate(communicationId);
  };
  
  return (
    <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden" onValueChange={setActiveTab}>
      <div className="border-b">
        <div className="px-6">
          <TabsList className="h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              <FileText className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-background">
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="communications" className="data-[state=active]:bg-background">
              <MessageCircle className="w-4 h-4 mr-2" />
              Communications
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
      
      <TabsContent value="overview" className="p-6 flex-1 overflow-y-auto">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <Badge className={project.status === 'active' ? 'bg-green-500 text-white' : 
                  project.status === 'completed' ? 'bg-blue-500 text-white' : 
                  'bg-amber-500 text-white'}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Timeline</h4>
                <div className="text-sm">
                  {project.startDate ? format(new Date(project.startDate), 'MMMM d, yyyy') : 'Not set'} 
                  {' - '}
                  {project.endDate ? format(new Date(project.endDate), 'MMMM d, yyyy') : 'TBD'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Address</h4>
                <div className="text-sm">{project.address}</div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Team Members</h4>
                {projectMembers.length > 0 ? (
                  <div className="space-y-3">
                    {projectMembers.slice(0, 3).map((member, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarFallback>{member.role.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Crew #{member.crewMemberId}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                        </div>
                      </div>
                    ))}
                    {projectMembers.length > 3 && (
                      <Button variant="link" size="sm" className="mt-2 h-auto p-0">
                        View all {projectMembers.length} members
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No team members assigned to this project yet.
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Recent Activity</h4>
                <div className="text-sm text-muted-foreground">
                  {communications.length > 0 ? 
                    `${communications.length} messages in the last 7 days` : 
                    'No recent communication activity'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="team" className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Project Team Members</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Assign a crew member to this project.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="crew-member">Crew Member</Label>
                    <select 
                      id="crew-member" 
                      className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">Select a crew member</option>
                      {crewMembers.map(crew => (
                        <option key={crew.id} value={crew.id}>
                          {crew.name} - {crew.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Project Role</Label>
                    <Input id="role" placeholder="e.g., Foreman, Carpenter, Electrician" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly-rate">Hourly Rate ($)</Label>
                    <Input id="hourly-rate" type="number" placeholder="25.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Add any additional notes about this team member" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Add Team Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {projectMembers.length > 0 ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-12 border-b bg-muted p-3 text-sm font-medium">
                <div className="col-span-3">Crew Member</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Hourly Rate</div>
                <div className="col-span-3">Assigned Date</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              
              {projectMembers.map((member, index) => (
                <div key={index} className={`grid grid-cols-12 p-3 text-sm ${index !== projectMembers.length - 1 ? 'border-b' : ''}`}>
                  <div className="col-span-3 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.crewMemberId.toString().charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>Crew #{member.crewMemberId}</span>
                  </div>
                  <div className="col-span-2 flex items-center">{member.role}</div>
                  <div className="col-span-2 flex items-center">${member.hourlyRate || 'N/A'}</div>
                  <div className="col-span-3 flex items-center">{format(new Date(member.assignedAt), 'MMM d, yyyy')}</div>
                  <div className="col-span-2 flex justify-end items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border rounded-md">
              <Users className="h-12 w-12 text-muted-foreground/60" />
              <div>
                <h3 className="text-lg font-medium">No Team Members Yet</h3>
                <p className="text-sm text-muted-foreground">This project doesn't have any team members assigned yet.</p>
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Team Member
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="communications" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {communications.length > 0 ? (
              communications.map((message, index) => (
                <div key={index} className="flex flex-col space-y-2">
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{message.senderId.toString().charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">User #{message.senderId}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatMessageTime(message.timestamp)}
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        {message.content}
                        {message.translatedContent && (
                          <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                            <span className="font-medium">Translated: </span>
                            {message.translatedContent}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => handleReaction(message.id, '👍')}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          {message.reactions && message.reactions['👍'] && (
                            <span className="text-xs py-1 px-1.5 bg-muted rounded-md">
                              {message.reactions['👍'].length}
                            </span>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-xs" 
                                onClick={() => handleMarkAsRead(message.id)}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Mark as read
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark this message as read</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground/60" />
                <div>
                  <h3 className="text-lg font-medium">No Messages Yet</h3>
                  <p className="text-sm text-muted-foreground">Start the conversation with your team.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center">
                <Switch
                  id="translate"
                  checked={isTranslating}
                  onCheckedChange={setIsTranslating}
                  className="mr-2"
                />
                <Label htmlFor="translate" className="text-sm">Auto-translate messages</Label>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Languages className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle language</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center space-x-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 min-h-[80px]"
              />
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" size="icon" className="rounded-full">
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setNewMessage('')}
                  disabled={!newMessage.trim()}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || addMessageMutation.isPending}
                >
                  {addMessageMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                      Sending...
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, progress }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'scheduled':
        return 'bg-amber-500';
      case 'delayed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Calculate days remaining or overdue (mock calculation)
  const getDaysRemaining = (): { days: number, overdue: boolean } => {
    const endDate = project.endDate ? new Date(project.endDate) : new Date();
    const today = new Date();
    const differenceInTime = endDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return {
      days: Math.abs(differenceInDays),
      overdue: differenceInDays < 0 && project.status !== 'completed'
    };
  };
  
  const daysInfo = getDaysRemaining();
  
  const [showDetails, setShowDetails] = useState(false);
  
  const handleViewDetails = () => {
    setShowDetails(true);
  };
  
  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <Badge 
                className={`${getStatusColor(project.status)} text-white mb-2`}
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
              <CardTitle className="text-xl">{project.name}</CardTitle>
              <CardDescription className="mt-1 flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1 opacity-70" />
                {project.address || (project.location ? `${project.location.lat.toFixed(4)}, ${project.location.lng.toFixed(4)}` : 'No location set')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2 flex-1">
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 opacity-70" />
              <span>
                {formatDate(project.startDate?.toString())}
                {project.endDate && ` - ${formatDate(project.endDate.toString())}`}
              </span>
            </div>
            
            <div className={`flex items-center ${daysInfo.overdue ? 'text-red-500' : ''}`}>
              <Clock className="h-4 w-4 mr-1 opacity-70" />
              <span>
                {daysInfo.overdue 
                  ? `${daysInfo.days} day${daysInfo.days !== 1 ? 's' : ''} overdue` 
                  : project.status === 'completed'
                    ? 'Completed'
                    : `${daysInfo.days} day${daysInfo.days !== 1 ? 's' : ''} left`}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-1 text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col items-center p-2 bg-muted rounded-md">
              <Users className="h-4 w-4 mb-1" />
              <span>Crew: {(project.id % 5) + 2}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted rounded-md">
              <Package className="h-4 w-4 mb-1" />
              <span>Materials: {project.status === 'completed' ? 'Complete' : 'In Progress'}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted rounded-md">
              <Wrench className="h-4 w-4 mb-1" />
              <span>Tasks: {progress}%</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 border-t mt-auto">
          <Button variant="ghost" size="sm" className="ml-auto flex items-center" onClick={handleViewDetails}>
            View Details <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-5xl h-[80vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge 
                  className={`${getStatusColor(project.status)} text-white`}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
                <DialogTitle className="text-2xl">{project.name}</DialogTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="mt-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1 opacity-70" />
              {project.address || 'No address specified'}
            </DialogDescription>
          </DialogHeader>
          
          <ProjectDetailsTabs project={project} progress={progress} />
        </DialogContent>
      </Dialog>
    </>
  );
};