// src/contexts/SurveyContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast'; // Assuming you have this
import { Department } from '@/contexts/DepartmentContext'; // Assuming Department interface is here or adjust path

// Define API base URL - ensure this matches your Flask app's URL
const API_BASE_URL = 'http://localhost:5000/api';

// Define interfaces for survey data that match your backend's expected structure
interface SurveyQuestion {
    id: number;
    text: string;
    type: 'rating' | 'text' | 'multiple_choice'; // Match your backend Enum
    order: number;
    options?: { id: number; text: string; value?: string }[]; // For multiple_choice
}

interface SurveyData {
    id: number;
    title: string;
    description: string;
    created_at: string;
    questions: SurveyQuestion[];
}

interface QuestionAnswerSubmission {
    id: number; // Question ID
    rating?: number; // For rating questions
    remarks?: string; // For text/remarks questions
    selected_option_id?: number; // For multiple choice
}

interface SurveySubmissionPayload {
    user_id: number; // IMPORTANT: In a real app, this comes from authentication
    answers: QuestionAnswerSubmission[];
    suggestion?: string; // For the final suggestion textarea
}

interface SurveyContextType {
    currentSurvey: SurveyData | null;
    loadingSurvey: boolean;
    error: string | null;
    fetchSurveyById: (surveyId: string | number) => Promise<void>;
    submitSurveyResponse: (surveyId: string | number, payload: SurveySubmissionPayload) => Promise<boolean>;
    // You might already have 'departments' and 'submitSurvey' but let's rename submitSurvey to submitSurveyResponse for clarity
    departments: Department[]; // Assuming you fetch departments here or via DepartmentsContext
    // This is a placeholder for departments for now. If you fetch them via a separate context, you'd remove this.
    // For now, let's keep it simple and assume departments are fetched elsewhere or mocked if not in use here.
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export const SurveyProvider = ({ children }: { children: ReactNode }) => {
    const [currentSurvey, setCurrentSurvey] = useState<SurveyData | null>(null);
    const [loadingSurvey, setLoadingSurvey] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Placeholder for departments - replace with actual fetch or context usage
    const [departments] = useState<Department[]>([]); 

    const fetchSurveyById = async (surveyId: string | number) => {
        setLoadingSurvey(true);
        setError(null);
        try {
            const response = await axios.get<SurveyData>(`${API_BASE_URL}/surveys/${surveyId}`);
            setCurrentSurvey(response.data);
        } catch (err) {
            console.error('Failed to fetch survey:', err);
            setError('Failed to load survey. Please ensure the backend is running and survey exists.');
            toast({
                title: 'Error',
                description: 'Could not load survey. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoadingSurvey(false);
        }
    };

    const submitSurveyResponse = async (surveyId: string | number, payload: SurveySubmissionPayload): Promise<boolean> => {
        try {
            const response = await axios.post(`${API_BASE_URL}/surveys/${surveyId}/submit_response`, payload);
            toast({
                title: 'Survey Submitted',
                description: 'Your survey has been submitted successfully.',
            });
            return true;
        } catch (err: any) {
            console.error('Failed to submit survey:', err);
            setError(err.response?.data?.detail || 'Failed to submit survey. Please try again.');
            toast({
                title: 'Submission Failed',
                description: err.response?.data?.detail || 'There was an error submitting your survey.',
                variant: 'destructive',
            });
            return false;
        }
    };

    return (
        <SurveyContext.Provider value={{ currentSurvey, loadingSurvey, error, fetchSurveyById, submitSurveyResponse, departments }}>
            {children}
        </SurveyContext.Provider>
    );
};

export const useSurvey = () => {
    const context = useContext(SurveyContext);
    if (context === undefined) {
        throw new Error('useSurvey must be used within a SurveyProvider');
    }
    return context;
};