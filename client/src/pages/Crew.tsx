import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, ArrowLeft, Edit2, Grid3X3, List, MapPin, Search, Shield, Languages, Star, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface CrewFormData {
  name: string;
  role: string;
  specialization: string;
  phone: string;
  email: string;
  experienceYears: number | null;
  jobsiteId: number | null;
  status: string;
  certifications: string[];
  languages: string[];
  emergencyContact: string;
  notes: string;
  profileImage: string | null;
}

interface CrewMember {
  id: number;
  name: string;
  role: string;
  specialization?: string;
  phone?: string;
  email?: string;
  experienceYears?: number | null;
  jobsiteId?: number | null;
  status?: string;
  certifications?: string[];
  languages?: string[];
  emergencyContact?: string;
  notes?: string;
  profileImage?: string | null;
  lastCheckIn?: string;
  locationName?: string;
}

interface Jobsite {
  id: number;
  name: string;
  location: string;
  status: string;
}

export const CrewPage = () => {
  const params = useParams();
  const crewId = params.id ? parseInt(params.id) : null;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [jobsiteFilter, setJobsiteFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [isProfileView, setIsProfileView] = useState(false);
  const [isAssignProjectsMode, setIsAssignProjectsMode] = useState(false);
  const [selectedCrewMember, setSelectedCrewMember] = useState<CrewMember | null>(null);
  const [tempAssignedProjectIds, setTempAssignedProjectIds] = useState<number[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  // Initial form data
  const getInitialFormData = (): CrewFormData => ({
    name: "",
    role: "",
    specialization: "",
    phone: "",
    email: "",
    experienceYears: null,
    jobsiteId: null,
    status: "active",
    certifications: [],
    languages: [],
    emergencyContact: "",
    notes: "",
    profileImage: null
  });

  const [formData, setFormData] = useState<CrewFormData>(getInitialFormData());

  // List of specializations for dropdown
  const specializations = [
    "Carpentry",
    "Electrical",
    "Plumbing",
    "HVAC",
    "Masonry",
    "Painting",
    "Flooring",
    "Roofing",
    "General Labor",
    "Heavy Equipment Operation",
    "Landscaping",
    "Welding",
    "Concrete",
    "Drywall",
    "Project Management"
  ];

  // Get crew members
  const { data: crewMembers = [], isLoading: isLoadingCrewMembers } = useQuery({
    queryKey: ['/api/crew'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crew");
      const data = await response.json();
      return data;
    }
  });

  // Get jobsites for filters and assignment
  const { data: jobsites = [], isLoading: isLoadingJobsites } = useQuery({
    queryKey: ['/api/jobsites'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/jobsites");
      const data = await response.json();
      return data;
    }
  });
  
  // Get projects assigned to this crew member
  const { data: assignedProjects = [], isLoading: isLoadingAssignedProjects } = useQuery({
    queryKey: ['/api/crew', selectedCrewMember?.id, 'projects'],
    queryFn: async () => {
      if (!selectedCrewMember?.id) return [];
      const response = await apiRequest("GET", `/api/crew/${selectedCrewMember.id}/projects`);
      const data = await response.json();
      return data;
    },
    enabled: !!selectedCrewMember?.id // Only run this query if we have a selected crew member
  });
  
  // Update our temporary state when assigned projects change
  useEffect(() => {
    if (assignedProjects && assignedProjects.length > 0) {
      setTempAssignedProjectIds(assignedProjects.map((p: any) => p.id));
    }
  }, [assignedProjects]);

  // Mutations for CRUD operations
  const addCrewMutation = useMutation({
    mutationFn: (data: CrewFormData) => 
      apiRequest("POST", "/api/crew", data)
        .then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew'] });
      setIsAddDialogOpen(false);
      setFormData(getInitialFormData());
      toast({
        title: "Success",
        description: "Crew member added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add crew member: " + error,
        variant: "destructive",
      });
    }
  });

  const updateCrewMutation = useMutation({
    mutationFn: (data: {id: number, crewMember: Partial<CrewFormData>}) => 
      apiRequest("PATCH", `/api/crew/${data.id}`, data.crewMember)
        .then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Crew member updated successfully",
      });
      
      // If we're in profile view, refresh the selected member
      if (isProfileView && selectedCrewMember) {
        const updatedMember = crewMembers.find((c: CrewMember) => c.id === selectedCrewMember.id);
        if (updatedMember) {
          setSelectedCrewMember(updatedMember);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update crew member: " + error,
        variant: "destructive",
      });
    }
  });

  const deleteCrewMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/crew/${id}`);
      // 204 No Content status doesn't have a response body to parse
      if (res.status === 204) {
        return { success: true };
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew'] });
      
      // If we're in profile view, go back to list
      if (isProfileView) {
        setIsProfileView(false);
        setSelectedCrewMember(null);
        setLocation("/crew");
      }
      
      toast({
        title: "Success",
        description: "Crew member deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete crew member: " + error,
        variant: "destructive",
      });
    }
  });
  
  // Add crew member to project mutation
  const addToProjectMutation = useMutation({
    mutationFn: async (data: { crewMemberId: number, projectId: number }) => {
      const response = await apiRequest(
        "POST", 
        `/api/crew/${data.crewMemberId}/assign-project`,
        { projectId: data.projectId }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew', selectedCrewMember?.id, 'projects'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add crew member to project: " + error,
        variant: "destructive",
      });
    }
  });
  
  // Remove crew member from project mutation
  const removeFromProjectMutation = useMutation({
    mutationFn: async (data: { crewMemberId: number, projectId: number }) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/crew/${data.crewMemberId}/projects/${data.projectId}`
      );
      // If successful with 204 No Content
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew', selectedCrewMember?.id, 'projects'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove crew member from project: " + error,
        variant: "destructive",
      });
    }
  });

  // Form event handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? null : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (name: string, value: string | number | null) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()]
      });
      setNewCertification("");
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter(c => c !== cert)
    });
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage.trim()]
      });
      setNewLanguage("");
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(l => l !== lang)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditDialogOpen && selectedCrewMember) {
        updateCrewMutation.mutate({
          id: selectedCrewMember.id,
          crewMember: formData
        });
      } else {
        addCrewMutation.mutate(formData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (crewMember: CrewMember) => {
    setSelectedCrewMember(crewMember);
    setFormData({
      name: crewMember.name,
      role: crewMember.role,
      specialization: crewMember.specialization || "",
      phone: crewMember.phone || "",
      email: crewMember.email || "",
      experienceYears: crewMember.experienceYears || null,
      jobsiteId: crewMember.jobsiteId || null,
      status: crewMember.status || "active",
      certifications: crewMember.certifications || [],
      languages: crewMember.languages || [],
      emergencyContact: crewMember.emergencyContact || "",
      notes: crewMember.notes || "",
      profileImage: crewMember.profileImage || null
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (crewMember: CrewMember) => {
    if (window.confirm(`Are you sure you want to delete ${crewMember.name}?`)) {
      try {
        deleteCrewMutation.mutate(crewMember.id);
      } catch (error) {
        console.error("Error deleting crew member:", error);
        toast({
          title: "Error",
          description: "Failed to delete crew member. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Helper to get jobsite name by id
  const getJobsiteName = (id: number | null | undefined) => {
    if (!id) return "Not Assigned";
    const jobsite = jobsites.find((j: Jobsite) => j.id === id);
    return jobsite ? jobsite.name : "Unknown Jobsite";
  };

  // Filter crew members based on search, status, and jobsite
  const filteredCrewMembers = crewMembers.filter((crew: CrewMember) => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (crew.specialization && crew.specialization.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    const matchesStatus = !statusFilter || crew.status === statusFilter;
    
    // Jobsite filter
    const matchesJobsite = !jobsiteFilter || crew.jobsiteId === jobsiteFilter;
    
    return matchesSearch && matchesStatus && matchesJobsite;
  });

  // Check if we should show profile view or assign projects mode
  useEffect(() => {
    if (crewId) {
      const member = crewMembers.find((c: CrewMember) => c.id === crewId);
      if (member) {
        // Check if we're in assign-projects mode
        if (location.includes(`/crew/${crewId}/assign-projects`)) {
          setIsProfileView(false);
          setIsAssignProjectsMode(true);
          setSelectedCrewMember(member);
        } else {
          // Regular profile view
          setIsProfileView(true);
          setIsAssignProjectsMode(false);
          setSelectedCrewMember(member);
        }
      } else if (!isLoadingCrewMembers) {
        // Not found and not still loading
        setLocation("/crew");
        toast({
          title: "Crew Member Not Found",
          description: "The requested crew member could not be found.",
          variant: "destructive",
        });
      }
    } else {
      setIsProfileView(false);
      setIsAssignProjectsMode(false);
      setSelectedCrewMember(null);
    }
  }, [crewId, crewMembers, isLoadingCrewMembers, setLocation, location]);

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto py-8 px-6">
          {isAssignProjectsMode && selectedCrewMember ? (
            // Assign Projects Mode
            <>
              <div className="flex items-center mb-6">
                <Button 
                  variant="outline" 
                  className="mr-4"
                  onClick={() => {
                    setIsAssignProjectsMode(false);
                    setLocation(`/crew/${selectedCrewMember.id}`);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Profile
                </Button>
                <h1 className="text-3xl font-bold">Assign Projects to {selectedCrewMember.name}</h1>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Projects</CardTitle>
                    <CardDescription>
                      Select projects to assign to this crew member
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingJobsites ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : jobsites.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No projects available</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation("/projects")}
                        >
                          Create New Project
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobsites.map((project: Jobsite) => {
                          // Check if crew member is already assigned to this project
                          // Use tempAssignedProjectIds for the UI state
                          const isAssigned = tempAssignedProjectIds.includes(project.id);
                          
                          return (
                            <div 
                              key={project.id} 
                              className={`p-4 border rounded-md flex items-center justify-between ${
                                isAssigned ? 'bg-primary/5 border-primary' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div>
                                <h4 className="font-medium">{project.name}</h4>
                                <p className="text-sm text-gray-500">{project.address || 'No address specified'}</p>
                              </div>
                              <div>
                                {isAssigned ? (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => {
                                      // Here you would call the API to remove the assignment
                                      if (confirm(`Remove ${selectedCrewMember.name} from ${project.name}?`)) {
                                        // Call the API to remove the assignment
                                        removeFromProjectMutation.mutate({
                                          crewMemberId: selectedCrewMember.id,
                                          projectId: project.id
                                        });
                                        
                                        // Update UI immediately without waiting for the API response
                                        setTempAssignedProjectIds(tempAssignedProjectIds.filter(id => id !== project.id));
                                      }
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Remove
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      // Call the API to add the assignment
                                      addToProjectMutation.mutate({
                                        crewMemberId: selectedCrewMember.id,
                                        projectId: project.id
                                      });

                                      // Update UI immediately without waiting for the API response
                                      setTempAssignedProjectIds([...tempAssignedProjectIds, project.id]);
                                    }}
                                  >
                                    Add to Project
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : isProfileView && selectedCrewMember ? (
            // Profile View
            <>
              <div className="flex items-center mb-6">
                <Button 
                  variant="outline" 
                  className="mr-4"
                  onClick={() => {
                    setIsProfileView(false);
                    setSelectedCrewMember(null);
                    setLocation("/crew");
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Crew
                </Button>
                <h1 className="text-3xl font-bold">{selectedCrewMember.name}</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <Avatar className="h-32 w-32 mb-4">
                        {selectedCrewMember.profileImage ? (
                          <AvatarImage src={selectedCrewMember.profileImage} alt={selectedCrewMember.name} />
                        ) : (
                          <AvatarFallback className="text-3xl">
                            {selectedCrewMember.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <h3 className="text-xl font-semibold mb-1">{selectedCrewMember.name}</h3>
                      <p className="text-gray-500 mb-4">{selectedCrewMember.role}</p>
                      
                      <div className="w-full">
                        <Badge 
                          className={`w-full justify-center mb-4 ${
                            selectedCrewMember.status === 'active' ? 'bg-green-100 text-green-800' : 
                            selectedCrewMember.status === 'on-leave' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {selectedCrewMember.status === 'active' ? 'Active' : 
                            selectedCrewMember.status === 'on-leave' ? 'On Leave' : 'Terminated'}
                        </Badge>
                        
                        <div className="space-y-3">
                          {selectedCrewMember.specialization && (
                            <div className="flex items-center">
                              <span className="font-medium w-1/3">Specialization:</span>
                              <span>{selectedCrewMember.specialization}</span>
                            </div>
                          )}
                          
                          {selectedCrewMember.experienceYears && selectedCrewMember.experienceYears > 0 && (
                            <div className="flex items-center">
                              <span className="font-medium w-1/3">Experience:</span>
                              <span>{selectedCrewMember.experienceYears} years</span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <span className="font-medium w-1/3">Jobsite:</span>
                            <span>{getJobsiteName(selectedCrewMember.jobsiteId)}</span>
                          </div>
                          
                          {selectedCrewMember.lastCheckIn && (
                            <div className="flex items-center">
                              <span className="font-medium w-1/3">Last Check-in:</span>
                              <span>{new Date(selectedCrewMember.lastCheckIn).toLocaleString()}</span>
                            </div>
                          )}
                          
                          {selectedCrewMember.locationName && (
                            <div className="flex items-center">
                              <span className="font-medium w-1/3">Location:</span>
                              <span>{selectedCrewMember.locationName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => handleEditClick(selectedCrewMember)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleDeleteClick(selectedCrewMember)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="md:col-span-2">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCrewMember.phone && (
                          <div>
                            <h4 className="font-medium text-gray-500">Phone</h4>
                            <p>{selectedCrewMember.phone}</p>
                          </div>
                        )}
                        
                        {selectedCrewMember.email && (
                          <div>
                            <h4 className="font-medium text-gray-500">Email</h4>
                            <p>{selectedCrewMember.email}</p>
                          </div>
                        )}
                        
                        {selectedCrewMember.emergencyContact && (
                          <div className="md:col-span-2">
                            <h4 className="font-medium text-gray-500">Emergency Contact</h4>
                            <p>{selectedCrewMember.emergencyContact}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Skills & Qualifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="certifications">
                        <TabsList className="mb-4">
                          <TabsTrigger value="certifications">Certifications</TabsTrigger>
                          <TabsTrigger value="languages">Languages</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="certifications">
                          {selectedCrewMember.certifications && selectedCrewMember.certifications.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedCrewMember.certifications.map((cert, idx) => (
                                <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
                                  <Shield className="h-3 w-3" />
                                  <span>{cert}</span>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No certifications listed.</p>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="languages">
                          {selectedCrewMember.languages && selectedCrewMember.languages.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedCrewMember.languages.map((lang, idx) => (
                                <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
                                  <Languages className="h-3 w-3" />
                                  <span>{lang}</span>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No languages listed.</p>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                  
                  {selectedCrewMember.notes && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-line">{selectedCrewMember.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Assigned Projects */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Assigned Projects</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation(`/crew/${selectedCrewMember.id}/assign-projects`)}
                        className="h-8"
                      >
                        Manage Assignments
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {isLoadingAssignedProjects ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      ) : assignedProjects.length > 0 ? (
                        <div className="space-y-3">
                          {assignedProjects.map((project: Jobsite) => (
                            <div 
                              key={project.id} 
                              className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                              onClick={() => setLocation(`/projects/${project.id}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{project.name}</h4>
                                  <p className="text-sm text-gray-500">{project.address}</p>
                                </div>
                                <Badge className={
                                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                                  project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  project.status === 'scheduled' ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                </Badge>
                              </div>
                              {typeof project.progress === 'number' && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{project.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-primary h-1.5 rounded-full" 
                                      style={{ width: `${project.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-gray-500 mb-4">No assigned projects found</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation(`/crew/${selectedCrewMember.id}/assign-projects`)}
                          >
                            Assign to Project
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            // List View
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-3xl font-bold mb-4 md:mb-0">Crew Management</h1>
                <Button onClick={() => {
                  setFormData(getInitialFormData());
                  setIsAddDialogOpen(true);
                }}>
                  Add Crew Member
                </Button>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    placeholder="Search crew members..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) => setStatusFilter(value !== "all" ? value : null)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={jobsiteFilter?.toString() || "all"}
                    onValueChange={(value) => setJobsiteFilter(value !== "all" ? parseInt(value) : null)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by jobsite" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobsites</SelectItem>
                      {jobsites.map((jobsite: Jobsite) => (
                        <SelectItem key={jobsite.id} value={jobsite.id.toString()}>
                          {jobsite.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="hidden md:flex mr-4 bg-gray-100 rounded-lg p-1">
                    <Button 
                      size="sm"
                      variant={viewMode === 'list' ? "default" : "ghost"}
                      onClick={() => setViewMode('list')}
                      className="rounded-l-md"
                    >
                      <List className="h-4 w-4 mr-1" />
                      List
                    </Button>
                    <Button 
                      size="sm"
                      variant={viewMode === 'grid' ? "default" : "ghost"}
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-md"
                    >
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      Grid
                    </Button>
                  </div>
                </div>
              </div>
              
              {isLoadingCrewMembers ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredCrewMembers.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No crew members found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || statusFilter || jobsiteFilter 
                      ? "Try adjusting your filters to see more results."
                      : "Add your first crew member to get started."}
                  </p>
                  <Button 
                    onClick={() => {
                      setFormData(getInitialFormData());
                      setIsAddDialogOpen(true);
                    }}
                  >
                    Add Crew Member
                  </Button>
                </div>
              ) : viewMode === 'list' ? (
                // List View
                <div className="space-y-6 mt-6 p-4">
                  {filteredCrewMembers.map((crewMember: CrewMember) => (
                    <div 
                      key={crewMember.id} 
                      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6
                        ${crewMember.status === 'on-leave' ? 'border-l-4 border-yellow-400' : 
                          crewMember.status === 'terminated' ? 'border-l-4 border-red-400' : 
                          'border-l-4 border-green-400'}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-4">
                            {crewMember.profileImage ? (
                              <AvatarImage src={crewMember.profileImage} alt={crewMember.name} />
                            ) : (
                              <AvatarFallback>
                                {crewMember.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div>
                            <h3 className="text-lg font-semibold">{crewMember.name}</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
                              <span className="mr-3">{crewMember.role}</span>
                              
                              {crewMember.specialization && (
                                <span className="mr-3 hidden md:inline">• {crewMember.specialization}</span>
                              )}
                              
                              {crewMember.jobsiteId && (
                                <div className="flex items-center mt-1 sm:mt-0">
                                  <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                                  <span>{getJobsiteName(crewMember.jobsiteId)}</span>
                                </div>
                              )}
                              
                              {crewMember.experienceYears && crewMember.experienceYears > 0 && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Star className="h-3 w-3 text-gray-400 mr-1" />
                                  <span>{crewMember.experienceYears} years experience</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4 md:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation(`/crew/${crewMember.id}`)}
                          >
                            View Profile
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditClick(crewMember)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                            onClick={() => handleDeleteClick(crewMember)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6 mt-6">
                  {filteredCrewMembers.map((crewMember: CrewMember) => (
                    <Card key={crewMember.id} className="overflow-hidden hover:shadow-md transition-shadow p-1">
                      <div 
                        className={`h-2 w-full
                          ${crewMember.status === 'active' ? 'bg-green-500' : 
                            crewMember.status === 'on-leave' ? 'bg-yellow-500' : 
                            'bg-red-500'}`}
                      />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <Avatar className="h-12 w-12 mr-3">
                              {crewMember.profileImage ? (
                                <AvatarImage src={crewMember.profileImage} alt={crewMember.name} />
                              ) : (
                                <AvatarFallback>
                                  {crewMember.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{crewMember.name}</CardTitle>
                              <CardDescription>{crewMember.role}</CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-2 text-sm">
                          {crewMember.specialization && (
                            <div>{crewMember.specialization}</div>
                          )}
                          
                          {crewMember.jobsiteId && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                              <span>{getJobsiteName(crewMember.jobsiteId)}</span>
                            </div>
                          )}
                          
                          {crewMember.languages && crewMember.languages.length > 0 && (
                            <div className="flex items-center">
                              <Languages className="h-3 w-3 text-gray-400 mr-1" />
                              <span>{crewMember.languages.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => setLocation(`/crew/${crewMember.id}`)}
                        >
                          View Profile
                        </Button>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditClick(crewMember)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                            onClick={() => handleDeleteClick(crewMember)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Add Crew Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Crew Member</DialogTitle>
            <DialogDescription>
              Add a new member to your construction crew. Fill out the required information.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                    <Input
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Foreman, Site Manager"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select
                      value={formData.specialization}
                      onValueChange={(value) => handleSelectChange('specialization', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map(spec => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(XXX) XXX-XXXX"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobsiteId">Assigned Jobsite</Label>
                    <Select
                      value={formData.jobsiteId?.toString() || "none"}
                      onValueChange={(value) => handleSelectChange('jobsiteId', value !== "none" ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select jobsite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {jobsites.map((jobsite: any) => (
                          <SelectItem key={jobsite.id} value={jobsite.id.toString()}>
                            {jobsite.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experienceYears === null ? "" : formData.experienceYears}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      placeholder="Name: (XXX) XXX-XXXX"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Certifications</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Add certification"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddCertification}
                      disabled={!newCertification.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
                          <Shield className="h-3 w-3" />
                          <span>{cert}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveCertification(cert)}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      placeholder="Add language"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddLanguage}
                      disabled={!newLanguage.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.languages.map((lang, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
                          <Languages className="h-3 w-3" />
                          <span>{lang}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveLanguage(lang)}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional information about this crew member..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.name || !formData.role || addCrewMutation.isPending}
              >
                {addCrewMutation.isPending ? 'Adding...' : 'Add Crew Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Crew Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Crew Member</DialogTitle>
            <DialogDescription>
              Update information for {selectedCrewMember?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                {/* Same form fields as add dialog */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                    <Input
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Foreman, Site Manager"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select
                      value={formData.specialization}
                      onValueChange={(value) => handleSelectChange('specialization', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map(spec => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Remaining form fields identical to add dialog */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(XXX) XXX-XXXX"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobsiteId">Assigned Jobsite</Label>
                    <Select
                      value={formData.jobsiteId?.toString() || "none"}
                      onValueChange={(value) => handleSelectChange('jobsiteId', value !== "none" ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select jobsite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {jobsites.map((jobsite: any) => (
                          <SelectItem key={jobsite.id} value={jobsite.id.toString()}>
                            {jobsite.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experienceYears === null ? "" : formData.experienceYears}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      placeholder="Name: (XXX) XXX-XXXX"
                    />
                  </div>
                </div>
                
                {/* Other fields omitted for brevity but would be the same as add dialog */}
                <div className="space-y-2">
                  <Label>Certifications</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Add certification"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddCertification}
                      disabled={!newCertification.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
                          <Shield className="h-3 w-3" />
                          <span>{cert}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveCertification(cert)}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      placeholder="Add language"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddLanguage}
                      disabled={!newLanguage.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.languages.map((lang, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
                          <Languages className="h-3 w-3" />
                          <span>{lang}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveLanguage(lang)}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional information about this crew member..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.name || !formData.role || updateCrewMutation.isPending}
              >
                {updateCrewMutation.isPending ? 'Updating...' : 'Update Crew Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CrewPage;