import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SideNavigation } from '@/components/SideNavigation';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, Clock, MapPin, Users, Package, Wrench, ChevronRight, 
  ArrowLeft, Trash2, UserPlus, CheckCircle, AlertCircle,
  MessageSquare, Send, MessageCircle, Globe
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { ProjectAIAssistant } from '@/components/ProjectAIAssistant';
import { MapPlaceholder } from '@/assets/map-placeholder';

// Types
interface Jobsite {
  id: number;
  name: string;
  address: string;
  status: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  progress?: number;
  location?: {
    lat: number;
    lng: number;
  } | null;
  time: string;
}

interface CrewMember {
  id: number;
  name: string;
  role: string;
  specialization?: string;
  profileImage?: string;
  status?: string;
  email?: string;
  phone?: string;
}

interface ProjectMember {
  id: number;
  projectId: number;
  crewMemberId: number;
  role: string;
  assignedAt: string;
}

export default function Projects() {
  const [selectedTab, setSelectedTab] = useState<string>('active');
  const [isAddCrewDialogOpen, setIsAddCrewDialogOpen] = useState(false);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingCrewMember, setIsAddingCrewMember] = useState(false);
  const [selectedCrewMember, setSelectedCrewMember] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectId = params.id ? parseInt(params.id) : null;

  // Fetch jobsites data
  const { data: jobsites = [], isLoading: isLoadingJobsites } = useQuery<Jobsite[]>({
    queryKey: ['/api/jobsites'],
    staleTime: 30000,
  });
  
  // Get the selected project
  const selectedProject = projectId 
    ? jobsites.find(jobsite => jobsite.id === projectId) 
    : null;
    
  // Fetch crew members
  const { data: allCrewMembers = [], isLoading: isLoadingCrew } = useQuery<CrewMember[]>({
    queryKey: ['/api/crew'],
    enabled: !!projectId,
  });
  
  // Fetch project crew members
  const { data: projectMembers = [], isLoading: isLoadingProjectMembers } = useQuery({
    queryKey: ['/api/projects', projectId, 'crew'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await apiRequest("GET", `/api/projects/${projectId}/crew`);
      const data = await response.json();
      return data;
    },
    enabled: !!projectId,
  });
  
  // Add crew member to project mutation
  const addCrewToProjectMutation = useMutation({
    mutationFn: async (data: { projectId: number, crewMemberId: number, role: string }) => {
      try {
        setIsAddingCrewMember(true);
        const response = await apiRequest("POST", `/api/projects/${data.projectId}/crew`, {
          crewMemberId: data.crewMemberId,
          role: data.role
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add crew member');
        }
        return response.json();
      } catch (error: any) {
        console.error("Error adding crew member:", error);
        throw new Error(error.message || 'Failed to add crew member to project');
      } finally {
        setIsAddingCrewMember(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'crew'] });
      setIsAddCrewDialogOpen(false);
      setSelectedCrewMember(null);
      toast({
        title: "Success",
        description: "Crew member added to project successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add crew member to project",
        variant: "destructive",
      });
    }
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
    
    if (typeof jobsite.progress === 'number') {
      return jobsite.progress;
    }
    
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

  // Remove crew member from project
  const removeCrewFromProject = async (crewMemberId: number) => {
    if (!projectId) return;
    
    try {
      await apiRequest("DELETE", `/api/projects/${projectId}/crew/${crewMemberId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'crew'] });
      toast({
        title: "Success",
        description: "Crew member removed from project",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove crew member: " + error,
        variant: "destructive",
      });
    }
  };
  
  // Handle adding crew member to project
  const handleAddCrewToProject = () => {
    if (!projectId || !selectedCrewMember || isAddingCrewMember) return;
    
    try {
      setIsAddingCrewMember(true);
      addCrewToProjectMutation.mutate({
        projectId,
        crewMemberId: selectedCrewMember,
        role: "crew-member" // Default role
      });
    } finally {
      // The mutation callbacks will handle success/error states
      // This ensures the button state is reset regardless
      setIsAddingCrewMember(false);
    }
  };
  
  // Filter crew members that are not already assigned to the project
  const availableCrewMembers = allCrewMembers.filter(crew => 
    !projectMembers.some((member: any) => member.crewMemberId === crew.id)
  );
  
  // Filter crew members based on search query
  const filteredAvailableCrewMembers = availableCrewMembers.filter(crew => 
    searchQuery === "" || 
    crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (crew.specialization && crew.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (selectedProject) {
    // PROJECT DETAIL VIEW
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:block">
          <SideNavigation />
        </div>
        <div className="flex-1 flex flex-col">
          <header className="border-b px-3 sm:px-6 md:px-8 py-4 md:py-6 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mr-2 sm:mr-4 h-8 px-2 sm:h-10 sm:px-4"
                  onClick={() => setLocation("/projects")}
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Projects</span>
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary">
                    {selectedProject.name}
                  </h1>
                  <div className="flex items-center mt-1 sm:mt-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate max-w-[250px] sm:max-w-md">{selectedProject.address}</span>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0">
                  <Badge 
                    className={`px-3 py-1 sm:px-4 sm:py-1.5 text-sm sm:text-base ${
                      selectedProject.status === 'active' ? 'bg-green-100 text-green-800' : 
                      selectedProject.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                      selectedProject.status === 'scheduled' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-3 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Project location map */}
                      <div className="sm:col-span-2 mb-3">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Location</h4>
                        <MapPlaceholder 
                          lat={selectedProject.location?.lat || 34.0522}
                          lng={selectedProject.location?.lng || -118.2437}
                          address={selectedProject.address}
                          className="h-48 sm:h-64 w-full"
                        />
                      </div>
                      
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500">Status</h4>
                        <p className="text-sm sm:text-base flex items-center">
                          <span className={`h-2 w-2 rounded-full mr-2 ${
                            selectedProject.status === 'active' ? 'bg-green-500' : 
                            selectedProject.status === 'completed' ? 'bg-blue-500' : 
                            selectedProject.status === 'scheduled' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}></span>
                          {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500">Address</h4>
                        <p className="text-sm sm:text-base break-words">{selectedProject.address}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500">Start Date</h4>
                        <p className="text-sm sm:text-base flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {formatDate(selectedProject.startDate)}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500">End Date</h4>
                        <p className="text-sm sm:text-base flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {formatDate(selectedProject.endDate)}
                        </p>
                      </div>
                      
                      {selectedProject.description && (
                        <div className="sm:col-span-2">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-500">Description</h4>
                          <p className="text-sm sm:text-base break-words">{selectedProject.description}</p>
                        </div>
                      )}
                      
                      <div className="sm:col-span-2 mt-2">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Progress</h4>
                        <div className="w-full">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">Completion</span>
                            <span className="font-bold text-primary">{selectedProject.progress || calculateProgress(selectedProject)}%</span>
                          </div>
                          <Progress value={selectedProject.progress || calculateProgress(selectedProject)} className="h-3" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Project AI Assistant Card */}
                <ProjectAIAssistant projectId={projectId} userId={1} />
                
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Project Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    {/* Project communications section */}
                    <ProjectMessages projectId={projectId} />
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg mb-2 sm:mb-0">Project Team</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddCrewDialogOpen(true)}
                      className="w-full sm:w-auto h-8 sm:h-9"
                    >
                      <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Add Crew Member
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    {isLoadingProjectMembers ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : projectMembers.length === 0 ? (
                      <div className="text-center py-4 sm:py-8">
                        <UserPlus className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2 sm:mb-3" />
                        <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No crew members assigned</h3>
                        <p className="text-sm text-gray-500 mb-3 sm:mb-4 px-4">Assign crew members to this project to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {projectMembers.map((member: any) => {
                          const crewMember = allCrewMembers.find(c => c.id === member.crewMemberId);
                          if (!crewMember) return null;
                          
                          return (
                            <div key={member.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-md">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3">
                                  {crewMember.profileImage ? (
                                    <AvatarImage src={crewMember.profileImage} alt={crewMember.name} />
                                  ) : (
                                    <AvatarFallback>
                                      {crewMember.name.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-sm sm:text-base truncate">{crewMember.name}</h4>
                                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    {crewMember.role}
                                    {crewMember.specialization && ` • ${crewMember.specialization}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setLocation(`/crew/${crewMember.id}`)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  onClick={() => removeCrewFromProject(crewMember.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                {/* Additional project management features could go here */}
              </div>
            </div>
          </main>
          
          {/* Dialog for adding crew members */}
          <Dialog 
            open={isAddCrewDialogOpen} 
            onOpenChange={(open) => {
              setIsAddCrewDialogOpen(open);
              if (!open) {
                // Reset form state when dialog is closed
                setSelectedCrewMember(null);
                setSearchQuery('');
                setIsAddingCrewMember(false);
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Crew Member to Project</DialogTitle>
                <DialogDescription>
                  Assign a crew member to this project.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedCrewMember) {
                  handleAddCrewToProject();
                }
              }}>
                <div className="py-4">
                  <div className="mb-4">
                    <Input 
                      placeholder="Search crew members..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-4"
                    />
                    
                    {isLoadingCrew ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : filteredAvailableCrewMembers.length === 0 ? (
                      <div className="text-center py-6">
                        <AlertCircle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          {searchQuery 
                            ? "No matching crew members found. Try a different search term." 
                            : "No available crew members to assign."}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-2">
                        {filteredAvailableCrewMembers.map(crew => (
                          <div 
                            key={crew.id} 
                            className={`p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                              selectedCrewMember === crew.id ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setSelectedCrewMember(crew.id)}
                          >
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                {crew.profileImage ? (
                                  <AvatarImage src={crew.profileImage} alt={crew.name} />
                                ) : (
                                  <AvatarFallback>
                                    {crew.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{crew.name}</h4>
                                <p className="text-xs text-gray-500">
                                  {crew.role}
                                  {crew.specialization && ` • ${crew.specialization}`}
                                </p>
                              </div>
                            </div>
                            {selectedCrewMember === crew.id && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setIsAddCrewDialogOpen(false);
                      setSelectedCrewMember(null);
                      setSearchQuery('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={!selectedCrewMember || isAddingCrewMember || addCrewToProjectMutation.isPending}
                  >
                    {isAddingCrewMember || addCrewToProjectMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                        Adding...
                      </>
                    ) : 'Add to Project'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // PROJECTS LIST VIEW
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <SideNavigation />
      </div>
      <div className="flex-1 flex flex-col">
        <header className="border-b px-4 sm:px-6 md:px-8 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Projects</h1>
            <div className="flex items-center sm:gap-4">
              <Dialog 
                open={isNewProjectDialogOpen} 
                onOpenChange={(open) => {
                  setIsNewProjectDialogOpen(open);
                  
                  // Reset form state when dialog is closed
                  if (!open) {
                    setIsSubmitting(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="gap-1 w-full sm:w-auto">
                    <span>New Project</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Add project details to create a new project.
                    </DialogDescription>
                  </DialogHeader>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      
                      // Prevent multiple form submissions
                      if (isSubmitting) return;
                      
                      try {
                        setIsSubmitting(true);
                        const formData = new FormData(e.target as HTMLFormElement);
                        const formValues = Object.fromEntries(formData.entries());
                        
                        const response = await apiRequest("POST", "/api/jobsites", formValues);
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Failed to create project');
                        }
                        
                        const newProject = await response.json();
                        
                        // Reset form and close the dialog
                        (e.target as HTMLFormElement).reset();
                        
                        // Close the dialog programmatically
                        setIsNewProjectDialogOpen(false);
                        
                        // Invalidate queries to refresh data
                        queryClient.invalidateQueries({ queryKey: ['/api/jobsites'] });
                        
                        toast({
                          title: "Project Created",
                          description: `Project "${newProject.name}" created successfully`,
                        });
                        
                        // Navigate to the new project
                        setLocation(`projects/${newProject.id}`);
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to create project",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="name" className="text-right">
                          Project Name*
                        </label>
                        <input
                          id="name"
                          name="name"
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="address" className="text-right">
                          Address* (for geolocation)
                        </label>
                        <div className="col-span-3 flex flex-col gap-1">
                          <input
                            id="address"
                            name="address"
                            placeholder="Enter a valid street address for precise location tracking"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Please provide a complete address for accurate mapping and crew directions
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="status" className="text-right">
                          Status*
                        </label>
                        <select
                          id="status"
                          name="status"
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="active">Active</option>
                          <option value="delayed">Delayed</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="startDate" className="text-right">
                          Start Date*
                        </label>
                        <input
                          id="startDate"
                          name="startDate"
                          type="date"
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="endDate" className="text-right">
                          End Date
                        </label>
                        <input
                          id="endDate"
                          name="endDate"
                          type="date"
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="description" className="text-right">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          className="col-span-3 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        id="closeNewProjectDialog" 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsNewProjectDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Project</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-3 sm:p-6 md:p-8">
          <Tabs defaultValue="active" className="w-full" onValueChange={setSelectedTab}>
            <TabsList className="mb-4 sm:mb-6 md:mb-8 w-full overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="active">Active</TabsTrigger>
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

interface ProjectCommunication {
  id: number;
  projectId: number;
  senderId: number;
  content: string;
  translatedContent?: string;
  language: string; // 'en' or 'es'
  timestamp: string;
  attachmentUrl?: string;
  attachmentType?: string;
  isAnnouncement?: boolean;
  readBy?: number[];
  reactions?: Record<string, string[]>;
}

interface ProjectMessagesProps {
  projectId: number | null;
}

function ProjectMessages({ projectId }: ProjectMessagesProps) {
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading } = useQuery<ProjectCommunication[]>({
    queryKey: ['/api/projects', projectId, 'communications'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await apiRequest("GET", `/api/projects/${projectId}/communications`);
      if (!response.ok) {
        throw new Error("Failed to fetch project messages");
      }
      return response.json();
    },
    enabled: !!projectId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!projectId) throw new Error("No project selected");
      const response = await apiRequest("POST", `/api/projects/${projectId}/communications`, {
        content,
        language: 'en', // Default to English for now
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'communications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  // Group messages by date
  const groupedMessages: Record<string, ProjectCommunication[]> = {};
  messages.forEach(message => {
    const date = formatMessageDate(message.timestamp);
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-sm text-gray-500 mb-4">Start a conversation about this project.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-4 overflow-y-auto max-h-[400px]">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-2">
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-xs text-gray-500">{date}</span>
                </div>
              </div>
              
              {dateMessages.map(message => (
                <div key={message.id} className="flex items-start group">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{message.language === 'es' ? 'Spanish Message' : 'English Message'}</span>
                      <span className="text-xs text-gray-500">{formatMessageTime(message.timestamp)}</span>
                    </div>
                    <p className="text-sm mb-1">{message.content}</p>
                    {message.translatedContent && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <Globe className="h-3 w-3 mr-1" />
                          <span>Translated from {message.language === 'es' ? 'Spanish' : 'English'}</span>
                        </div>
                        <p className="text-sm text-gray-700">{message.translatedContent}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSendMessage} className="mt-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm pr-10"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80 disabled:text-gray-300"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ProjectCardProps {
  project: Jobsite;
  progress: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, progress }) => {
  const [, setLocation] = useLocation();
  
  const navigateToProjectDetail = () => {
    setLocation(`projects/${project.id}`);
  };
  
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
  
  // Calculate days remaining or overdue
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
  
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <Badge 
              className={`${getStatusColor(project.status)} text-white mb-1.5 sm:mb-2 text-xs sm:text-sm`}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
            <CardTitle className="text-base sm:text-lg md:text-xl line-clamp-1">{project.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center text-xs sm:text-sm line-clamp-1">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 opacity-70 flex-shrink-0" />
              <span className="truncate">
                {project.address || (project.location ? `${project.location.lat.toFixed(4)}, ${project.location.lng.toFixed(4)}` : 'No location set')}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-1 p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 mb-2 text-xs sm:text-sm">
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 opacity-70 flex-shrink-0" />
            <span className="truncate">
              {formatDate(project.startDate?.toString())}
              {project.endDate && ` - ${formatDate(project.endDate.toString())}`}
            </span>
          </div>
          
          <div className={`flex items-center ${daysInfo.overdue ? 'text-red-500' : ''}`}>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 opacity-70 flex-shrink-0" />
            <span>
              {daysInfo.overdue 
                ? `${daysInfo.days} day${daysInfo.days !== 1 ? 's' : ''} overdue` 
                : project.status === 'completed'
                  ? 'Completed'
                  : `${daysInfo.days} day${daysInfo.days !== 1 ? 's' : ''} left`}
            </span>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-4">
          <div className="flex justify-between mb-1 text-xs sm:text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 sm:h-2" />
        </div>
        
        <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs">
          <div className="flex flex-col items-center p-1.5 sm:p-2 bg-muted rounded-md">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mb-0.5 sm:mb-1" />
            <span className="text-center">Crew: {(project.id % 5) + 2}</span>
          </div>
          <div className="flex flex-col items-center p-1.5 sm:p-2 bg-muted rounded-md">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mb-0.5 sm:mb-1" />
            <span className="text-center">{project.status === 'completed' ? 'Complete' : 'In Progress'}</span>
          </div>
          <div className="flex flex-col items-center p-1.5 sm:p-2 bg-muted rounded-md">
            <Wrench className="h-3 w-3 sm:h-4 sm:w-4 mb-0.5 sm:mb-1" />
            <span className="text-center">Tasks: {progress}%</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-1 sm:pt-2 border-t mt-auto p-3 sm:p-4 md:p-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-auto flex items-center h-8 text-xs sm:text-sm"
          onClick={navigateToProjectDetail}
        >
          <span>View Details</span> <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};
