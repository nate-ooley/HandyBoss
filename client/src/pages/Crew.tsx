import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Edit2, MapPin, Phone, Mail, Star, Award, Shield, X, Plus, Calendar, Clock, Info, Trash2, Languages } from 'lucide-react';
import { SideNavigation } from '@/components/SideNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type CrewMember } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import BossManImage from '@assets/bossMan.png';

interface CrewFormData {
  name: string;
  role: string;
  specialization: string;
  phone: string;
  email: string;
  experienceYears: number;
  jobsiteId: number | null;
  status: string;
  certifications: string[];
  languages: string[];
  emergencyContact: string;
  notes: string;
  profileImage: string | null;
}

const getInitialFormData = (): CrewFormData => ({
  name: '',
  role: '',
  specialization: '',
  phone: '',
  email: '',
  experienceYears: 0,
  jobsiteId: null,
  status: 'active',
  certifications: [],
  languages: [],
  emergencyContact: '',
  notes: '',
  profileImage: null
});

const specializations = [
  'Carpenter', 'Electrician', 'Plumber', 'Mason', 'Welder', 
  'Heavy Equipment Operator', 'Painter', 'HVAC Technician', 
  'Roofer', 'General Labor', 'Foreman', 'Project Manager'
];

const CrewPage: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CrewFormData>(getInitialFormData());
  const [selectedCrewMember, setSelectedCrewMember] = useState<CrewMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [newCertification, setNewCertification] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Fetch all crew members
  const { data: crewMembers = [], isLoading, isError } = useQuery<CrewMember[]>({
    queryKey: ['/api/crew'],
    staleTime: 60000, // 1 minute
  });

  // Fetch jobsites for dropdown
  const { data: jobsites = [] } = useQuery<any[]>({
    queryKey: ['/api/jobsites'],
    staleTime: 300000, // 5 minutes
  });

  // Add new crew member
  const addCrewMutation = useMutation({
    mutationFn: (data: CrewFormData) => 
      apiRequest('POST', '/api/crew', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew'] });
      setIsAddDialogOpen(false);
      setFormData(getInitialFormData());
      toast({
        title: 'Success',
        description: 'Crew member added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to add crew member: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Update crew member
  const updateCrewMutation = useMutation({
    mutationFn: (data: { id: number; data: Partial<CrewFormData> }) => 
      apiRequest('PATCH', `/api/crew/${data.id}`, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Crew member updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update crew member: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Delete crew member
  const deleteCrewMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/crew/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew'] });
      setIsDeleteDialogOpen(false);
      setSelectedCrewMember(null);
      toast({
        title: 'Success',
        description: 'Crew member deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete crew member: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes (for dropdowns)
  const handleSelectChange = (name: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle certification changes
  const handleAddCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  // Handle language changes
  const handleAddLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For adding new crew member
    if (!isEditDialogOpen) {
      addCrewMutation.mutate(formData);
    } 
    // For updating existing crew member
    else if (selectedCrewMember) {
      updateCrewMutation.mutate({
        id: selectedCrewMember.id,
        data: formData
      });
    }
  };

  // Open edit dialog with selected crew member data
  const handleEditClick = (crewMember: CrewMember) => {
    setSelectedCrewMember(crewMember);
    setFormData({
      name: crewMember.name,
      role: crewMember.role,
      specialization: crewMember.specialization || '',
      phone: crewMember.phone || '',
      email: crewMember.email || '',
      experienceYears: crewMember.experienceYears || 0,
      jobsiteId: crewMember.jobsiteId,
      status: crewMember.status || 'active',
      certifications: crewMember.certifications || [],
      languages: crewMember.languages || [],
      emergencyContact: crewMember.emergencyContact || '',
      notes: crewMember.notes || '',
      profileImage: crewMember.profileImage
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (crewMember: CrewMember) => {
    setSelectedCrewMember(crewMember);
    setIsDeleteDialogOpen(true);
  };

  // Filter crew members based on search query and active filter
  const filteredCrewMembers = crewMembers.filter((crew: CrewMember) => {
    const matchesSearch = crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (crew.role && crew.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (crew.specialization && crew.specialization.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!activeFilter) return matchesSearch;
    return matchesSearch && crew.status === activeFilter;
  });

  // Get jobsite name based on jobsiteId
  const getJobsiteName = (jobsiteId: number | null) => {
    if (!jobsiteId) return 'Not Assigned';
    const jobsite = jobsites.find((j: any) => j.id === jobsiteId);
    return jobsite ? jobsite.name : 'Unknown Jobsite';
  };

  return (
    <div className="flex h-screen">
      <SideNavigation />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img 
                src={BossManImage} 
                alt="BossMan Character" 
                className="w-16 h-16 object-contain" 
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Crew Management</h1>
                <p className="text-gray-600">Manage your construction team members</p>
              </div>
            </div>
            <Button onClick={() => {
              setFormData(getInitialFormData());
              setIsAddDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Crew Member
            </Button>
          </div>

          <div className="mb-6 flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search by name, role, specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                variant={activeFilter === null ? "default" : "outline"}
                onClick={() => setActiveFilter(null)}
              >
                All
              </Button>
              <Button 
                variant={activeFilter === 'active' ? "default" : "outline"}
                onClick={() => setActiveFilter('active')}
              >
                Active
              </Button>
              <Button 
                variant={activeFilter === 'on-leave' ? "default" : "outline"}
                onClick={() => setActiveFilter('on-leave')}
              >
                On Leave
              </Button>
              <Button 
                variant={activeFilter === 'terminated' ? "default" : "outline"}
                onClick={() => setActiveFilter('terminated')}
              >
                Terminated
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-20 bg-gray-200"></CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-3">
                      <div className="h-6 bg-gray-200 rounded-md"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-xl">Error loading crew members</div>
              <p className="text-gray-600 mt-2">Please try again later</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/crew'] })}
              >
                Retry
              </Button>
            </div>
          ) : filteredCrewMembers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">👷</div>
              <h3 className="text-xl font-medium text-gray-900">No crew members found</h3>
              {searchQuery ? (
                <p className="text-gray-600 mt-2">
                  No results match your search criteria. Try different keywords or clear your search.
                </p>
              ) : (
                <p className="text-gray-600 mt-2">
                  You haven't added any crew members yet. Click "Add Crew Member" to get started.
                </p>
              )}
              {searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCrewMembers.map((crewMember: CrewMember) => (
                <Card key={crewMember.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className={`
                    pb-2 relative
                    ${crewMember.status === 'active' ? 'bg-green-50' : 
                      crewMember.status === 'on-leave' ? 'bg-amber-50' : 
                      crewMember.status === 'terminated' ? 'bg-red-50' : 'bg-gray-50'}
                  `}>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge
                          className={`mb-2 
                            ${crewMember.status === 'active' ? 'bg-green-500' : 
                              crewMember.status === 'on-leave' ? 'bg-amber-500' : 
                              crewMember.status === 'terminated' ? 'bg-red-500' : 'bg-gray-500'}
                          `}
                        >
                          {crewMember.status === 'active' ? 'Active' : 
                           crewMember.status === 'on-leave' ? 'On Leave' : 
                           crewMember.status === 'terminated' ? 'Terminated' : crewMember.status}
                        </Badge>
                        <CardTitle className="text-gray-900">{crewMember.name}</CardTitle>
                        <CardDescription>
                          {crewMember.role}
                          {crewMember.specialization && ` • ${crewMember.specialization}`}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleEditClick(crewMember)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDeleteClick(crewMember)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600 gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" /> 
                        <span>{getJobsiteName(crewMember.jobsiteId)}</span>
                      </div>
                      
                      {crewMember.phone && (
                        <div className="flex items-center text-sm text-gray-600 gap-1">
                          <Phone className="h-4 w-4 text-gray-400" /> 
                          <span>{crewMember.phone}</span>
                        </div>
                      )}
                      
                      {crewMember.email && (
                        <div className="flex items-center text-sm text-gray-600 gap-1">
                          <Mail className="h-4 w-4 text-gray-400" /> 
                          <span className="truncate">{crewMember.email}</span>
                        </div>
                      )}
                      
                      {crewMember.experienceYears && crewMember.experienceYears > 0 && (
                        <div className="flex items-center text-sm text-gray-600 gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" /> 
                          <span>{crewMember.experienceYears} {crewMember.experienceYears === 1 ? 'year' : 'years'} experience</span>
                        </div>
                      )}
                      
                      {crewMember.languages && crewMember.languages.length > 0 && (
                        <div className="flex items-start text-sm text-gray-600 gap-1">
                          <Languages className="h-4 w-4 text-gray-400 mt-0.5" /> 
                          <span>
                            {crewMember.languages.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {crewMember.certifications && crewMember.certifications.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Certifications:</p>
                        <div className="flex flex-wrap gap-1">
                          {crewMember.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs py-0">
                              <Shield className="h-3 w-3 mr-1 text-blue-500" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-0 flex justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/crew/${crewMember.id}`}>View Profile</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
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
                      value={formData.experienceYears}
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
                      value={formData.experienceYears}
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
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.name || !formData.role || updateCrewMutation.isPending}
              >
                {updateCrewMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCrewMember?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedCrewMember && deleteCrewMutation.mutate(selectedCrewMember.id)}
              disabled={deleteCrewMutation.isPending}
            >
              {deleteCrewMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrewPage;