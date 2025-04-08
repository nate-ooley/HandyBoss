import React from 'react';
import BossManCharacter from "./BossManCharacter";
import { Clock, CloudRain, ChevronRight } from 'lucide-react';
import { Jobsite } from '../types';
import { useLocation } from 'wouter';

interface JobsitesListProps {
  jobsites: Jobsite[];
}

export const JobsitesList: React.FC<JobsitesListProps> = ({ jobsites }) => {
  const [, navigate] = useLocation();

  const getMoodForStatus = (status: string): 'neutral' | 'happy' | 'angry' | 'confused' | 'excited' | 'concerned' => {
    switch (status.toLowerCase()) {
      case 'delayed':
        return 'concerned';
      case 'weather alert':
        return 'angry';
      case 'on time':
        return 'happy';
      default:
        return 'neutral';
    }
  };

  const handleJobsiteClick = (jobsiteId: number) => {
    navigate(`/voice-commands?jobsite=${jobsiteId}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-foreground mb-3">TODAY'S JOBSITES</h2>
      
      {jobsites.map((jobsite) => (
        <div 
          key={jobsite.id} 
          className="mb-3 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer active:scale-98 jobsite-item"
          onClick={() => handleJobsiteClick(jobsite.id)}
          role="button"
          aria-label={`Navigate to ${jobsite.name} jobsite`}
        >
          <div className="flex justify-between items-center">
            <div className="flex-grow">
              <h3 className="font-semibold text-foreground">{jobsite.name}</h3>
              <p className="jobsite-address">{jobsite.address}</p>
              <div className="flex items-center mt-1">
                {jobsite.status.toLowerCase().includes('delayed') ? (
                  <>
                    <Clock className="text-primary h-4 w-4 mr-1" />
                    <span className="text-sm jobsite-time">{jobsite.time} - {jobsite.status}</span>
                  </>
                ) : jobsite.status.toLowerCase().includes('weather') ? (
                  <>
                    <CloudRain className="text-secondary h-4 w-4 mr-1" />
                    <span className="text-sm font-medium text-secondary">{jobsite.status}</span>
                  </>
                ) : (
                  <>
                    <Clock className="text-primary/70 h-4 w-4 mr-1" />
                    <span className="text-sm font-medium text-foreground">{jobsite.time}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <BossManCharacter size="sm" mood={getMoodForStatus(jobsite.status)} />
              <ChevronRight className="h-5 w-5 text-foreground/70 ml-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
