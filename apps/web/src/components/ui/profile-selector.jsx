import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search, User, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AgencyDashboardService from '@/services/agencyDashboardService';

export function ProfileSelector({ ownerType, onSelect, agencyId, value, disabled }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch profiles when owner type changes or search term updates
  useEffect(() => {
    if (!ownerType || !agencyId) {
      setProfiles([]);
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchProfiles();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [ownerType, searchTerm, agencyId]);

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let data = [];
      switch (ownerType) {
        case 'maid':
          data = await AgencyDashboardService.searchMaids(agencyId, searchTerm);
          break;
        case 'sponsor':
          data = await AgencyDashboardService.searchSponsors(agencyId, searchTerm);
          break;
        case 'agency':
          data = await AgencyDashboardService.searchAgencies(searchTerm);
          break;
        default:
          break;
      }

      setProfiles(data);
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
      setError(err.message);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (profile) => {
    const formattedProfile = {
      id: profile.id,
      full_name: profile.full_name,
      avatar: profile.profile_picture || profile.avatar_url || profile.logo_url,
      context: getProfileContext(profile)
    };

    onSelect(formattedProfile);
    setOpen(false);
    setSearchTerm('');
  };

  const getProfileContext = (profile) => {
    switch (ownerType) {
      case 'maid':
        return profile.nationality || 'N/A';
      case 'sponsor':
        return `${profile.city || 'N/A'}, ${profile.country || 'N/A'}`;
      case 'agency':
        return profile.country || 'N/A';
      default:
        return '';
    }
  };

  const getProfileIcon = () => {
    switch (ownerType) {
      case 'maid':
        return <User className="h-4 w-4" />;
      case 'sponsor':
        return <Users className="h-4 w-4" />;
      case 'agency':
        return <Building2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getPlaceholder = () => {
    if (!ownerType) return 'Select owner type first';
    return `Search for ${ownerType}...`;
  };

  const getDisplayValue = () => {
    if (value) {
      return value.full_name || 'Selected';
    }
    return getPlaceholder();
  };

  if (!ownerType) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          disabled={true}
          className="w-full justify-between text-muted-foreground"
        >
          Select owner type first
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full justify-between"
      >
        <div className="flex items-center space-x-2 truncate">
          {getProfileIcon()}
          <span className="truncate">{getDisplayValue()}</span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 w-full mt-2 border rounded-lg bg-white shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={getPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full" />
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-sm text-red-600">
                {error}
              </div>
            ) : profiles.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {searchTerm ? `No ${ownerType}s found matching "${searchTerm}"` : `No ${ownerType}s available`}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {profiles.map((profile) => {
                  const displayName = profile.full_name;
                  const isSelected = value?.id === profile.id;

                  return (
                    <button
                      key={profile.id}
                      onClick={() => handleSelect(profile)}
                      className={cn(
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors',
                        isSelected && 'bg-gray-100'
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={profile.profile_picture || profile.avatar_url || profile.logo_url}
                          alt={displayName}
                        />
                        <AvatarFallback>
                          {displayName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {getProfileContext(profile)}
                        </p>
                      </div>

                      {ownerType === 'maid' && profile.availability_status && (
                        <Badge
                          variant={profile.availability_status === 'available' ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {profile.availability_status}
                        </Badge>
                      )}

                      {isSelected && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
