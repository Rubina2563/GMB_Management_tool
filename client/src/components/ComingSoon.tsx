import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComingSoonProps {
  title: string;
  description: string;
  showRequestButton?: boolean;
  buttonText?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description,
  showRequestButton = true,
  buttonText = "Request Feature"
}) => {
  const { toast } = useToast();

  const handleFeatureRequest = () => {
    toast({
      title: "Feature Request Submitted",
      description: `Thanks for your interest in ${title}. We've recorded your request.`,
      variant: "default",
    });
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-3xl text-center bg-white">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-[#F28C38]/10">
              <Rocket className="h-10 w-10 text-[#F28C38]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-black">{title}</CardTitle>
          <CardDescription className="text-lg text-black">
            Coming Soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-black">{description}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-200 p-4 w-full max-w-xs">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F28C38]/10">
                <Rocket className="h-6 w-6 text-[#F28C38]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-black">In Development</p>
                <p className="text-xs text-black">We're working hard to bring you this feature soon</p>
              </div>
            </div>
          </div>
        </CardContent>
        {showRequestButton && (
          <CardFooter className="flex justify-center">
            <Button className="bg-[#F28C38] hover:bg-[#F28C38]/90 text-white" onClick={handleFeatureRequest}>
              {buttonText}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ComingSoon;