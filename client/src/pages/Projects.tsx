import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Jobsite } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SideNavigation } from '@/components/SideNavigation';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Package, Wrench, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    
                    try {
                      // Get form data
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('name') as string;
                      const address = formData.get('address') as string;
                      const status = formData.get('status') as string;
                      const startDate = formData.get('startDate') as string;
                      const endDate = formData.get('endDate') as string;
                      const description = formData.get('description') as string;
                      
                      // For now, create a simple mock location based on address
                      // In a real app, we would use a geocoding service here
                      const mockLocation = {
                        lat: 40.7128 + (Math.random() * 0.1),
                        lng: -74.0060 + (Math.random() * 0.1)
                      };
                      
                      // Create the project object
                      const newProject = {
                        name,
                        address,
                        status,
                        startDate,
                        endDate: endDate || undefined, // Handle empty end date
                        description: description || null,
                        time: new Date().toISOString(),
                        progress: 0,
                        location: mockLocation, // Add location data for geolocation
                      };
                      
                      console.log("Creating new project:", newProject);
                      
                      // Create a new project using apiRequest from queryClient
                      fetch('/api/jobsites', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(newProject),
                      })
                        .then(response => {
                          if (!response.ok) {
                            throw new Error(`Server responded with ${response.status}`);
                          }
                          return response.json();
                        })
                        .then((data) => {
                          console.log("Project created successfully:", data);
                          // Close dialog and refetch projects
                          document.getElementById('closeNewProjectDialog')?.click();
                          
                          // Use query invalidation rather than full page reload
                          setTimeout(() => {
                            window.location.reload();
                          }, 500);
                        })
                        .catch(error => {
                          console.error('Error creating project:', error);
                          alert(`Failed to create project: ${error.message}`);
                        });
                    } catch (error) {
                      console.error('Error in form submission:', error);
                      alert("An error occurred while submitting the form. Please try again.");
                    }
                  }}>
                    <div className="grid gap-4 py-4">
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
                        onClick={() => document.querySelector('dialog')?.close()}
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
  
  return (
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-auto flex items-center">
              View Details <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{project.name}</DialogTitle>
              <DialogDescription>
                {project.address}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="font-medium">Status</h3>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Timeline</h3>
                <p>
                  {formatDate(project.startDate?.toString())} - {project.endDate ? formatDate(project.endDate.toString()) : 'TBD'}
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Completion</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};