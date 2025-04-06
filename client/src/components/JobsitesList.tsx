import React from 'react';
import BossManCharacter from "./BossManCharacter";
import { Clock, CloudRain } from 'lucide-react';
import { Jobsite } from '../types';

interface JobsitesListProps {
  jobsites: Jobsite[];
}

export const JobsitesList: React.FC<JobsitesListProps> = ({ jobsites }) => {
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

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-dark mb-3">TODAY'S JOBSITES</h2>
      
      {jobsites.map((jobsite) => (
        <div key={jobsite.id} className="mb-3 border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between">
            <div>
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
            <BossManCharacter size="sm" mood={getMoodForStatus(jobsite.status)} />
          </div>
        </div>
      ))}
    </div>
  );
};
