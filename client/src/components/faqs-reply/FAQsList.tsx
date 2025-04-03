import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StableDialog, StableDialogContent } from "@/components/ui/stable-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Edit, Plus, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface FAQsListProps {
  locationId: string | number;
  currentTab: string;
  setParentTab?: (tab: string) => void;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const FAQsList: React.FC<FAQsListProps> = ({ locationId, currentTab, setParentTab }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  // Fetch FAQs from the server
  const { data: faqsData, isLoading, isError, error } = useQuery({
    queryKey: ['faqs', locationId],
    queryFn: async () => {
      const response = await fetch(`/api/client/gbp-faq/location/${locationId}/faqs`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load FAQs');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load FAQs');
      }
      
      return data.faqs;
    },
  });

  // Add a new FAQ
  const addFAQMutation = useMutation({
    mutationFn: async (faq: { question: string; answer: string }) => {
      // The server requires user_id and location_id, but these are added in the server route
      // We just need to ensure we're sending question and answer correctly
      const response = await fetch(`/api/client/gbp-faq/location/${locationId}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          question: faq.question,
          answer: faq.answer
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('FAQ creation error:', errorData);
        throw new Error(errorData.message || 'Failed to add FAQ');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to add FAQ');
      }
      
      return data.faq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs', locationId] });
      setNewFAQ({ question: '', answer: '' });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "FAQ added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add FAQ",
        variant: "destructive",
      });
    },
  });

  // Update an existing FAQ
  const updateFAQMutation = useMutation({
    mutationFn: async (faq: FAQ) => {
      const response = await fetch(`/api/client/gbp-faq/location/${locationId}/faqs/${faq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          question: faq.question,
          answer: faq.answer,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update FAQ');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update FAQ');
      }
      
      return data.faq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs', locationId] });
      setSelectedFAQ(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "FAQ updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update FAQ",
        variant: "destructive",
      });
    },
  });

  // Delete a FAQ
  const deleteFAQMutation = useMutation({
    mutationFn: async (faqId: number) => {
      const response = await fetch(`/api/client/gbp-faq/location/${locationId}/faqs/${faqId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete FAQ');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete FAQ');
      }
      
      return faqId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs', locationId] });
      setSelectedFAQ(null);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ",
        variant: "destructive",
      });
    },
  });

  // Handle adding a new FAQ
  const handleAddFAQ = () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Both question and answer are required",
        variant: "destructive",
      });
      return;
    }

    addFAQMutation.mutate(newFAQ);
  };
  
  // Reset form when opening add dialog
  const handleOpenAddDialog = () => {
    setNewFAQ({ question: '', answer: '' });
    setIsAddDialogOpen(true);
  };

  // Handle updating an existing FAQ
  const handleUpdateFAQ = () => {
    if (!selectedFAQ) return;

    if (!selectedFAQ.question.trim() || !selectedFAQ.answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Both question and answer are required",
        variant: "destructive",
      });
      return;
    }

    updateFAQMutation.mutate(selectedFAQ);
  };

  // Handle deleting a FAQ
  const handleDeleteFAQ = () => {
    if (!selectedFAQ) return;
    deleteFAQMutation.mutate(selectedFAQ.id);
  };

  // Handle importing CSV data
  const handleImportCSV = () => {
    if (!csvContent.trim()) {
      toast({
        title: "Validation Error",
        description: "CSV content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse CSV content
      const lines = csvContent.split('\n');
      const importedFAQs: { question: string; answer: string }[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Split by comma, but handle quotes properly
        const commaIndex = line.indexOf(',');
        if (commaIndex === -1) {
          toast({
            title: "CSV Format Error",
            description: `Line ${i+1} does not have a comma separator: ${line}`,
            variant: "destructive",
          });
          return;
        }
        
        let question = line.substring(0, commaIndex).trim();
        let answer = line.substring(commaIndex + 1).trim();
        
        // Remove surrounding quotes if present
        if (question.startsWith('"') && question.endsWith('"')) {
          question = question.substring(1, question.length - 1);
        }
        if (answer.startsWith('"') && answer.endsWith('"')) {
          answer = answer.substring(1, answer.length - 1);
        }
        
        if (!question || !answer) {
          toast({
            title: "CSV Format Error",
            description: `Line ${i+1} has empty question or answer: ${line}`,
            variant: "destructive",
          });
          return;
        }
        
        importedFAQs.push({ question, answer });
      }
      
      // Import all FAQs one by one
      const importAll = async () => {
        let successCount = 0;
        let errorCount = 0;
        
        for (const faq of importedFAQs) {
          try {
            // Use the same mutation function as the add button to ensure consistency
            await addFAQMutation.mutateAsync({
              question: faq.question,
              answer: faq.answer
            });
            successCount++;
          } catch (error) {
            console.error("Error importing FAQ:", error);
            errorCount++;
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ['faqs', locationId] });
        setIsImportDialogOpen(false);
        setCsvContent('');
        
        toast({
          title: "Import Complete",
          description: `Successfully imported ${successCount} FAQs. ${errorCount > 0 ? `Failed to import ${errorCount} FAQs.` : ''}`,
          variant: errorCount > 0 ? "destructive" : "default",
        });
      };
      
      importAll();
    } catch (error) {
      console.error("CSV parsing error:", error);
      toast({
        title: "CSV Parsing Error",
        description: "Failed to parse CSV data. Please check the format.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-base/5">
        <CardHeader className="bg-dark-base/10 border-b border-dark-darker/20">
          <CardTitle className="text-xl text-black">Frequently Asked Questions</CardTitle>
          <CardDescription className="text-black">Manage your FAQs to automate responses to common questions</CardDescription>
        </CardHeader>
        <CardContent className="bg-dark-base/5">
          <div className="flex justify-end space-x-2 mb-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setCsvContent('');
                setIsImportDialogOpen(true);
              }}
              className="flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button 
              onClick={handleOpenAddDialog}
              className="flex items-center bg-[#F28C38] hover:bg-[#E67A17] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#F28C38]" />
            </div>
          ) : isError ? (
            <div className="bg-red-900/10 p-4 rounded-md text-red-700">
              <p className="text-black">Error loading FAQs: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          ) : (faqsData?.length === 0) ? (
            <div className="bg-dark-base/10 p-6 rounded-md text-center">
              <p className="text-black mb-4">No FAQs found. Add your first FAQ to get started.</p>
              <Button 
                onClick={handleOpenAddDialog}
                className="bg-[#F28C38] hover:bg-[#E67A17] text-white"
              >
                Add Your First FAQ
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-dark-darker/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-dark-base/20">
                    <TableHead className="w-[40%] text-black">Question</TableHead>
                    <TableHead className="w-[50%] text-black">Answer</TableHead>
                    <TableHead className="w-[10%] text-right text-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqsData.map((faq: FAQ) => (
                    <TableRow key={faq.id}>
                      <TableCell className="font-medium text-black">{faq.question}</TableCell>
                      <TableCell className="text-sm text-black">
                        {faq.answer.length > 100 ? `${faq.answer.substring(0, 100)}...` : faq.answer}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#F28C38] hover:text-[#E67A17] hover:bg-orange-100"
                            onClick={() => {
                              setSelectedFAQ(faq);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-900/10"
                            onClick={() => {
                              setSelectedFAQ(faq);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add FAQ Dialog */}
      <StableDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <StableDialogContent className="sm:max-w-[550px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Add New FAQ</DialogTitle>
            <DialogDescription className="text-black">
              Add a new frequently asked question and its answer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="question" className="text-black">Question</Label>
              <Input
                id="question"
                placeholder="Enter the question"
                value={newFAQ.question}
                onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="answer" className="text-black">Answer</Label>
              <Textarea
                id="answer"
                placeholder="Enter the answer"
                rows={5}
                className="resize-none text-black"
                value={newFAQ.answer}
                onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#F28C38] hover:bg-[#E67A17] text-white"
              onClick={handleAddFAQ}
              disabled={addFAQMutation.isPending}
            >
              {addFAQMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add FAQ
            </Button>
          </DialogFooter>
        </StableDialogContent>
      </StableDialog>

      {/* Edit FAQ Dialog */}
      <StableDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <StableDialogContent className="sm:max-w-[550px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Edit FAQ</DialogTitle>
            <DialogDescription className="text-black">
              Update the question and answer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-question" className="text-black">Question</Label>
              <Input
                id="edit-question"
                placeholder="Enter the question"
                value={selectedFAQ?.question || ''}
                onChange={(e) => selectedFAQ && setSelectedFAQ({ ...selectedFAQ, question: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-answer" className="text-black">Answer</Label>
              <Textarea
                id="edit-answer"
                placeholder="Enter the answer"
                rows={5}
                className="resize-none text-black"
                value={selectedFAQ?.answer || ''}
                onChange={(e) => selectedFAQ && setSelectedFAQ({ ...selectedFAQ, answer: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#F28C38] hover:bg-[#E67A17] text-white"
              onClick={handleUpdateFAQ}
              disabled={updateFAQMutation.isPending}
            >
              {updateFAQMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </StableDialogContent>
      </StableDialog>

      {/* Delete FAQ Dialog */}
      <StableDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <StableDialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Delete FAQ</DialogTitle>
            <DialogDescription className="text-black">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium text-black">{selectedFAQ?.question}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteFAQ}
              disabled={deleteFAQMutation.isPending}
            >
              {deleteFAQMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </StableDialogContent>
      </StableDialog>

      {/* Import CSV Dialog */}
      <StableDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <StableDialogContent className="sm:max-w-[550px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Import FAQs from CSV</DialogTitle>
            <DialogDescription className="text-black">
              Paste your CSV content below. Format: "question","answer" - one per line.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csv-content" className="text-black">CSV Content</Label>
              <Textarea
                id="csv-content"
                placeholder='Example: "What are your hours?","We are open from 9 AM to 5 PM Monday through Friday."'
                rows={10}
                className="font-mono text-sm text-black"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#F28C38] hover:bg-[#E67A17] text-white"
              onClick={handleImportCSV}
              disabled={addFAQMutation.isPending}
            >
              {addFAQMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          </DialogFooter>
        </StableDialogContent>
      </StableDialog>
    </div>
  );
};

export default FAQsList;