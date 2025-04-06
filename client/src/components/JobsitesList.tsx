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
      <h2 className="text-lg font-bold text-dark mb-3">TODAY'S JOBSITES</h2>
      
      {jobsites.map((jobsite) => (
        <div 
          key={jobsite.id} 
          className="mb-3 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer active:scale-98"
          onClick={() => handleJobsiteClick(jobsite.id)}
          role="button"
          aria-label={`Navigate to ${jobsite.name} jobsite`}
        >
          <div className="flex justify-between items-center">
            <div className="flex-grow">
              <h3 className="font-semibold text-dark">{jobsite.name}</h3>
              <p className="text-gray-500 text-sm">{jobsite.address}</p>
              <div className="flex items-center mt-1">
                {jobsite.status.toLowerCase().includes('delayed') ? (
                  <>
                    <Clock className="text-gray-400 h-4 w-4 mr-1" />
                    <span className="text-sm text-primary">{jobsite.time} - {jobsite.status}</span>
                  </>
                ) : jobsite.status.toLowerCase().includes('weather') ? (
                  <>
                    <CloudRain className="text-secondary h-4 w-4 mr-1" />
                    <span className="text-sm text-secondary">{jobsite.status}</span>
                  </>
                ) : (
                  <>
                    <Clock className="text-gray-400 h-4 w-4 mr-1" />
                    <span className="text-sm">{jobsite.time}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <BossManCharacter size="sm" mood={getMoodForStatus(jobsite.status)} />
              <ChevronRight className="h-5 w-5 text-gray-400 ml-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
