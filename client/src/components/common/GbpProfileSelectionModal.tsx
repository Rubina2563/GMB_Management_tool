import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface GbpProfile {
  name: string;
  title: string;
  storefrontAddress?: {
    addressLines: string[];
  };
}

interface GbpProfileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedProfiles: string[]) => Promise<void>;
}

export function GbpProfileSelectionModal({
  isOpen,
  onClose,
  onSave,
}: GbpProfileSelectionModalProps) {
  const [profiles, setProfiles] = useState<GbpProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/client/gbp/select', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch GBP profiles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch GBP profiles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSelect = (profileName: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileName)
        ? prev.filter((name) => name !== profileName)
        : [...prev, profileName]
    );
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(selectedProfiles);
      setSelectedProfiles([]);
      onClose();
      toast({
        title: 'Success',
        description: 'Profiles saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save selected profiles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1C2526] font-montserrat">
            Select GBP Profiles
          </DialogTitle>
          <DialogDescription>
            Choose the Google Business Profiles you want to connect to your account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-64 overflow-y-auto py-4">
          {isLoading && profiles.length === 0 ? (
            <p className="text-[#1C2526]">Loading GBP profiles...</p>
          ) : profiles.length === 0 ? (
            <p className="text-[#1C2526]">No profiles found. Make sure your Google account has access to GBP profiles.</p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.name} className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id={profile.name}
                  checked={selectedProfiles.includes(profile.name)}
                  onCheckedChange={() => handleProfileSelect(profile.name)}
                />
                <Label htmlFor={profile.name} className="text-[#1C2526] font-montserrat cursor-pointer">
                  {profile.title}
                  {profile.storefrontAddress?.addressLines && (
                    <span className="text-sm text-gray-500 block">
                      {profile.storefrontAddress.addressLines.join(', ')}
                    </span>
                  )}
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedProfiles.length === 0 || isLoading}
            className="bg-[#F28C38] text-white hover:bg-[#F5A461]"
          >
            {isLoading ? 'Saving...' : 'Save Selected Profiles'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}