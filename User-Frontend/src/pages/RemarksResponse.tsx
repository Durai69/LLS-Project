import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/MainLayout/MainLayout';

interface Feedback {
  fromDepartment: string;
  ratingGiven: number;
  remark: string;
}

interface OutFeedback {
  department: string;
  rating: number;
  yourRemark: string;
  theirResponse: {
    explanation: string;
    actionPlan: string;
    responsiblePerson: string;
  };
}

const RemarksResponse = () => {
  const { toast } = useToast();

  // Incoming feedback data
  const [incomingFeedbacks] = useState<Feedback[]>([
    { fromDepartment: 'Production', ratingGiven: 2, remark: 'Slow response to inventory requests' },
    { fromDepartment: 'Procurement', ratingGiven: 1, remark: 'Parts delivery was delayed' },
    { fromDepartment: 'Marketing', ratingGiven: 3, remark: 'Better communication needed for campaign launches' },
  ]);

  // Outgoing feedback data
  const [outgoingFeedbacks] = useState<OutFeedback[]>([
    {
      department: 'QA Department',
      rating: 2,
      yourRemark: 'Delayed reports submission',
      theirResponse: {
        explanation: 'We were understaffed due to resignations',
        actionPlan: 'Hiring 2 more analysts by next month',
        responsiblePerson: 'Mr. Arjun',
      },
    },
    {
      department: 'Finance Department',
      rating: 1,
      yourRemark: 'Slow invoice processing',
      theirResponse: {
        explanation: 'Workflow tool was under maintenance',
        actionPlan: 'Tool updated and live now',
        responsiblePerson: 'Ms. Kavitha',
      },
    },
    {
      department: 'HR Department',
      rating: 2,
      yourRemark: 'Improved onboarding process',
      theirResponse: {
        explanation: 'Introduced new training modules',
        actionPlan: 'Ongoing evaluation next quarter',
        responsiblePerson: 'Ms. Priya',
      },
    },
  ]);

  // State for each section's current index
  const [incomingIndex, setIncomingIndex] = useState(0);
  const [outgoingIndex, setOutgoingIndex] = useState(0);

  // Response form state (for incoming feedback)
  const [responseForm, setResponseForm] = useState({
    yourResponse: '',
    actionPlan: '',
    responsiblePerson: '',
  });

  // Handlers for form input change
  const handleInputChange = (field: string, value: string) => {
    setResponseForm((prev) => ({ ...prev, [field]: value }));
  };

  // Submit handler for response form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { yourResponse, actionPlan, responsiblePerson } = responseForm;

    if (!yourResponse.trim() || !actionPlan.trim() || !responsiblePerson.trim()) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required to submit your response.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Response Submitted',
      description: 'Your response has been recorded successfully.',
    });

    setResponseForm({ yourResponse: '', actionPlan: '', responsiblePerson: '' });
  };

  // Navigation handlers for incoming feedback
  const goToPrevIncoming = () => {
    setIncomingIndex((prev) => Math.max(prev - 1, 0));
    setResponseForm({ yourResponse: '', actionPlan: '', responsiblePerson: '' });
  };

  const goToNextIncoming = () => {
    setIncomingIndex((prev) => Math.min(prev + 1, incomingFeedbacks.length - 1));
    setResponseForm({ yourResponse: '', actionPlan: '', responsiblePerson: '' });
  };

  // Navigation handlers for outgoing feedback
  const goToPrevOutgoing = () => setOutgoingIndex((prev) => Math.max(prev - 1, 0));
  const goToNextOutgoing = () => setOutgoingIndex((prev) => Math.min(prev + 1, outgoingFeedbacks.length - 1));

  const currentIncoming = incomingFeedbacks[incomingIndex];
  const currentOutgoing = outgoingFeedbacks[outgoingIndex];

  return (
    <MainLayout title="Remarks & Response">
      <div className="container mx-auto max-w-6xl px-4 py-6 space-y-12">

        {/* Incoming Feedback Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Incoming Feedback</h2>

          <Card className="bg-green-50 border-green-200 mb-4 transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-700 min-w-[140px]">From Department:</span>
                <span className="text-gray-800">{currentIncoming.fromDepartment}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-700 min-w-[140px]">Rating Given:</span>
                <span className="text-gray-800">{currentIncoming.ratingGiven}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="font-medium text-gray-700 min-w-[140px]">Remark:</span>
                <span className="text-gray-800">"{currentIncoming.remark}"</span>
              </div>
            </CardContent>
          </Card>

          {/* Incoming Feedback Navigation */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <button
              onClick={goToPrevIncoming}
              disabled={incomingIndex === 0}
              aria-label="Previous Incoming Feedback"
              className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                incomingIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              {incomingIndex + 1} of {incomingFeedbacks.length}
            </div>

            <button
              onClick={goToNextIncoming}
              disabled={incomingIndex === incomingFeedbacks.length - 1}
              aria-label="Next Incoming Feedback"
              className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                incomingIndex === incomingFeedbacks.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>

          {/* Response Form for Incoming Feedback */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="yourResponse">
                    Your Response (Explanation)
                  </label>
                  <Textarea
                    id="yourResponse"
                    value={responseForm.yourResponse}
                    onChange={(e) => handleInputChange('yourResponse', e.target.value)}
                    placeholder="Enter explanation..."
                    className="bg-white min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="actionPlan">
                    Action Plan
                  </label>
                  <Textarea
                    id="actionPlan"
                    value={responseForm.actionPlan}
                    onChange={(e) => handleInputChange('actionPlan', e.target.value)}
                    placeholder="Enter action plan..."
                    className="bg-white min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="responsiblePerson">
                    Responsible Person
                  </label>
                  <Input
                    id="responsiblePerson"
                    value={responseForm.responsiblePerson}
                    onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                    placeholder="Enter name..."
                    className="bg-white"
                  />
                </div>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                  Submit Response
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Outgoing Feedback Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Outgoing Feedback</h2>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-700 min-w-[140px]">Department:</span>
                <span className="text-gray-800">{currentOutgoing.department}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-700 min-w-[140px]">Rating:</span>
                <span className="text-gray-800">{currentOutgoing.rating.toFixed(1)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="font-medium text-gray-700 min-w-[140px]">Your Remark:</span>
                <span className="text-gray-800">"{currentOutgoing.yourRemark}"</span>
              </div>
              <hr className="my-2 border-yellow-300" />
              <div>
                <h3 className="font-semibold text-yellow-700 mb-2">Their Response</h3>
                <p>
                  <strong>Explanation:</strong> {currentOutgoing.theirResponse.explanation}
                </p>
                <p>
                  <strong>Action Plan:</strong> {currentOutgoing.theirResponse.actionPlan}
                </p>
                <p>
                  <strong>Responsible Person:</strong> {currentOutgoing.theirResponse.responsiblePerson}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Outgoing Feedback Navigation */}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              onClick={goToPrevOutgoing}
              disabled={outgoingIndex === 0}
              aria-label="Previous Outgoing Feedback"
              className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                outgoingIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              {outgoingIndex + 1} of {outgoingFeedbacks.length}
            </div>

            <button
              onClick={goToNextOutgoing}
              disabled={outgoingIndex === outgoingFeedbacks.length - 1}
              aria-label="Next Outgoing Feedback"
              className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                outgoingIndex === outgoingFeedbacks.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default RemarksResponse;
