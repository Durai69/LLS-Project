import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// import { initialPermissions as baseInitialPermissions } from '@/lib/mock-data'; // Remove mock data import
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDepartments } from '@/contexts/DepartmentsContext';
import { DateRangePicker } from '@/components/permissions/DateRangePicker';
import { BulkActionsCard } from '@/components/permissions/BulkActionsCard';
import { PermissionSummaryCard } from '@/components/permissions/PermissionSummaryCard';
import axios from 'axios'; // Import axios

// Define the structure for your permissions matrix
type PermissionsMatrix = Record<number, Record<number, boolean>>;

// Define the DateRange type as expected by DateRangePicker and for sending to backend
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const API_BASE_URL = 'http://localhost:5000/api'; // Assuming your Flask backend runs on port 5000

const ManagePermissions = () => {
  const { departments, loading, error } = useDepartments(); 
  const { toast } = useToast();

  const departmentNames = useMemo(() => departments.map(d => d.name), [departments]);
  const departmentIds = useMemo(() => departments.map(d => d.id), [departments]);
  const departmentMap = useMemo(() => {
    return departments.reduce((acc, dept) => {
      acc[dept.id] = dept.name;
      return acc;
    }, {} as Record<number, string>);
  }, [departments]);

  const initializePermissions = useCallback(() => {
    const matrix: PermissionsMatrix = {};
    departmentIds.forEach(fromId => {
      matrix[fromId] = {};
      departmentIds.forEach(toId => {
        matrix[fromId][toId] = fromId !== toId; // Default to allowed if not self-rating
        // If you had existing permissions from backend, you'd load them here
      });
    });
    return matrix;
  }, [departmentIds]);

  const [permissions, setPermissions] = useState<PermissionsMatrix>(initializePermissions());
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined }); // State for date range
  const [isSaving, setIsSaving] = useState(false); // For Save Changes button
  const [isAlerting, setIsAlerting] = useState(false); // For Mail Alert Users button


  // Effect to fetch initial permissions from backend once departments and mappings are ready
  useEffect(() => {
    const fetchInitialPermissions = async () => {
        if (departments.length === 0 || Object.keys(departmentMap).length === 0) {
            return; // Wait for departments to load
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/permissions`);
            const backendPermissions: { from_dept_id: number; to_dept_id: number }[] = response.data;

            const initialMatrix: PermissionsMatrix = {};
            departments.forEach(fromDept => {
                initialMatrix[fromDept.id] = {};
                departments.forEach(toDept => {
                    initialMatrix[fromDept.id][toDept.id] = false; // Default to not allowed
                });
            });

            backendPermissions.forEach(perm => {
                // Ensure it's not a self-rating, which should always be false/disabled
                if (perm.from_dept_id !== perm.to_dept_id) {
                    initialMatrix[perm.from_dept_id][perm.to_dept_id] = true;
                }
            });

            setPermissions(initialMatrix);
        } catch (err) {
            console.error("Failed to fetch initial permissions:", err);
            toast({
                title: "Error",
                description: "Failed to load permissions. Please check backend connection.",
                variant: "destructive",
            });
        }
    };

    if (!loading && !error) { // Only fetch if departments are not loading and no error
        fetchInitialPermissions();
    }
  }, [departments, loading, error, departmentMap, toast]);


  // Recalculate permissions state when departments change
  useEffect(() => {
    if (!loading && !error && departments.length > 0) {
      setPermissions(initializePermissions());
    }
  }, [departments, loading, error, initializePermissions]);


  // Calculate stats for PermissionSummaryCard
  const actualToggleableCells = departments.length * (departments.length - 1); 
  
  const currentAllowedCount = useMemo(() => {
      return Object.keys(permissions).reduce(
          (sum, fromIdStr) => {
              const fromId = Number(fromIdStr);
              if (!departmentIds.includes(fromId)) return sum; 

              return sum + Object.keys(permissions[fromId]).reduce(
                  (innerSum, toIdStr) => {
                      const toId = Number(toIdStr);
                      if (!departmentIds.includes(toId)) return innerSum; 

                      // Count only allowed permissions that are NOT self-ratings
                      return innerSum + (permissions[fromId][toId] && fromId !== toId ? 1 : 0); 
                  }, 0
              );
          }, 0
      );
  }, [permissions, departmentIds]);

  const currentRestrictedCount = actualToggleableCells - currentAllowedCount;
  const progressRate = actualToggleableCells > 0 ? Math.round((currentAllowedCount / actualToggleableCells) * 100) : 0;


  // Toggle permission for a specific cell
  const togglePermission = useCallback((fromId: number, toId: number) => {
      if (fromId === toId) return; // Self-rating is not allowed

      setPermissions(prev => {
          const newMatrix = { ...prev };
          if (!newMatrix[fromId]) {
              newMatrix[fromId] = {};
          }
          newMatrix[fromId][toId] = !newMatrix[fromId]?.[toId];
          return newMatrix;
      });
  }, []);

  // Handle "Allow All" for a selected department
  const handleAllowAll = useCallback((selectedDeptName: string) => {
      const selectedDept = departments.find(d => d.name === selectedDeptName);
      if (!selectedDept) {
          toast({ title: "Error", description: "Selected department not found.", variant: "destructive" });
          return;
      }
      const selectedDeptId = selectedDept.id;

      setPermissions(prev => {
          const newPermissions = { ...prev };
          if (!newPermissions[selectedDeptId]) {
              newPermissions[selectedDeptId] = {};
          }

          departments.forEach(dept => {
              if (selectedDeptId !== dept.id) { // Do not toggle self-rating
                  newPermissions[selectedDeptId][dept.id] = true;
              }
          });
          return newPermissions;
      });

      toast({
          title: "Permissions Updated",
          description: `All permissions granted for ${selectedDeptName}`,
      });
  }, [departments, toast]);

  // Handle "Revoke All" for a selected department
  const handleRevokeAll = useCallback((selectedDeptName: string) => {
      const selectedDept = departments.find(d => d.name === selectedDeptName);
      if (!selectedDept) {
          toast({ title: "Error", description: "Selected department not found.", variant: "destructive" });
          return;
      }
      const selectedDeptId = selectedDept.id;

      setPermissions(prev => {
          const newPermissions = { ...prev };
          if (!newPermissions[selectedDeptId]) {
              newPermissions[selectedDeptId] = {};
          }

          departments.forEach(dept => {
              if (selectedDeptId !== dept.id) { // Do not toggle self-rating
                  newPermissions[selectedDeptId][dept.id] = false;
              }
          });
          return newPermissions;
      });

      toast({
          title: "Permissions Updated",
          description: `All permissions revoked for ${selectedDeptName}`,
      });
  }, [departments, toast]);

    // Handle saving changes to the backend
  const handleSaveChanges = useCallback(async () => {
    if (loading || isSaving) { // Prevent multiple clicks or saving while departments are loading
      toast({ title: "Please wait", description: "Data is still loading or saving.", variant: "default" }); // Changed variant to "default"
      return;
    }
    if (error) {
         toast({ title: "Error", description: "Cannot save: there was an error loading data.", variant: "destructive" });
         return;
    }

    setIsSaving(true);
    const allowedPairs: { from_dept_id: number; to_dept_id: number }[] = [];
    Object.entries(permissions).forEach(([fromIdStr, toDepts]) => {
        const fromId = Number(fromIdStr);
        Object.entries(toDepts).forEach(([toIdStr, isAllowed]) => {
            const toId = Number(toIdStr);

            // Only include allowed permissions that are not self-ratings and have valid IDs
            if (isAllowed && fromId !== toId && departmentIds.includes(fromId) && departmentIds.includes(toId)) {
                allowedPairs.push({
                    from_dept_id: fromId,
                    to_dept_id: toId
                });
            }
        });
    });

    try {
        await axios.post(`${API_BASE_URL}/permissions/save`, { allowed_pairs: allowedPairs });
        toast({
            title: "Permissions Saved",
            description: "Your permission changes have been saved successfully",
            variant: "default", // Changed variant to "default"
        });
        // Optionally, re-fetch permissions to ensure the state is fully synchronized with DB
        // await fetchInitialPermissions(); // This might cause a re-render and brief loading state
    } catch (err: any) {
        console.error("Failed to save permissions:", err);
        toast({
            title: "Error",
            description: err.response?.data?.message || "Failed to save permissions. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  }, [permissions, departmentIds, loading, error, toast, isSaving]);


  // Handle Mail Alert Users
  const handleMailAlert = useCallback(async () => {
    if (isAlerting || loading || error) {
      toast({ title: "Please wait", description: "Data is still loading or alert is in progress.", variant: "default" }); // Changed variant to "default"
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Validation Error",
        description: "Please select a start and end date for the mail alert.",
        variant: "destructive",
      });
      return;
    }

    setIsAlerting(true);
    try {
      // Prepare the data to send to the backend
      // We'll send the currently allowed permissions and the date range
      const currentAllowedPairs: { from_dept_id: number; to_dept_id: number }[] = [];
      Object.entries(permissions).forEach(([fromIdStr, toDepts]) => {
          const fromId = Number(fromIdStr);
          Object.entries(toDepts).forEach(([toIdStr, isAllowed]) => {
              const toId = Number(toIdStr);
              if (isAllowed && fromId !== toId && departmentIds.includes(fromId) && departmentIds.includes(toId)) {
                  currentAllowedPairs.push({
                      from_dept_id: fromId,
                      to_dept_id: toId
                  });
              }
          });
      });

      await axios.post(`${API_BASE_URL}/permissions/mail-alert`, {
        allowed_pairs: currentAllowedPairs,
        start_date: dateRange.from.toISOString(), // Send as ISO string
        end_date: dateRange.to.toISOString(),     // Send as ISO string
      });

      toast({
        title: "Mail Alert Sent",
        description: "Permission alerts have been sent to all relevant users.",
        variant: "default", // Changed variant to "default"
      });
    } catch (err: any) {
      console.error("Failed to send mail alert:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to send mail alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAlerting(false);
    }
  }, [permissions, dateRange, departmentIds, loading, error, toast, isAlerting]);
  
  // Display loading or error states
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        <p>Loading departments and permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  // Main component rendering
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Survey Permission</h1>
          <p className="text-muted-foreground">
            Control which departments can survey each other
          </p>
        </div>
        <Button onClick={handleSaveChanges} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Permission Matrix - Full Width */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white border border-gray-200 px-3 py-3.5 text-sm font-semibold text-gray-900">
                      Department
                    </th>
                    {/* Use department.name for headers, department.id for key */}
                    {departments.map((dept) => (
                      <th
                        key={dept.id}
                        scope="col"
                        className="border border-gray-200 px-3 py-3.5 text-center text-sm font-semibold text-gray-900 min-w-[120px]"
                      >
                        {dept.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Iterate over departments to create rows */}
                  {departments.map((fromDept) => (
                    <tr key={fromDept.id}>
                      <td className="sticky left-0 z-10 bg-gray-50 border border-gray-200 whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                        {fromDept.name}
                      </td>
                      {/* Iterate over departments again for columns */}
                      {departments.map((toDept) => (
                        <td
                          key={`${fromDept.id}-${toDept.id}`}
                          className={`border border-gray-200 px-3 py-4 text-center ${
                            fromDept.id === toDept.id
                              ? 'bg-gray-200'
                              : permissions[fromDept.id]?.[toDept.id]
                              ? 'bg-green-50'
                              : 'bg-white'
                          }`}
                        >
                          {fromDept.id === toDept.id ? (
                            <div className="text-xs text-gray-500 text-center">
                              Self Rating<br />is not allowed
                            </div>
                          ) : (
                            <button
                              onClick={() => togglePermission(fromDept.id, toDept.id)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                permissions[fromDept.id]?.[toDept.id]
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                              aria-label={
                                permissions[fromDept.id]?.[toDept.id]
                                  ? `Revoke permission for ${fromDept.name} to survey ${toDept.name}`
                                  : `Grant permission for ${fromDept.name} to survey ${toDept.name}`
                              }
                            >
                              {permissions[fromDept.id]?.[toDept.id] ? <Check size={14} /> : null}
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Summary and Bulk Actions - Below Matrix */}
      <div className="grid lg:grid-cols-2 gap-6">
        <PermissionSummaryCard
          totalPermissions={actualToggleableCells} 
          allowedPermissions={currentAllowedCount} 
          restrictedPermissions={currentRestrictedCount} 
          progressRate={progressRate} 
        />

        <BulkActionsCard
          departments={departmentNames} 
          onAllowAll={handleAllowAll}
          onRevokeAll={handleRevokeAll}
        />
      </div>

      {/* Date Range Picker - Below Summary/Bulk Actions */}
      <DateRangePicker onSelectDateRange={setDateRange} /> {/* Pass setDateRange callback */}

      {/* Mail Alert Button - Bottom */}
      <div className="flex justify-end">
        <Button
          onClick={handleMailAlert}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isAlerting || !dateRange.from || !dateRange.to} // Disable if no date range or alerting
        >
          {isAlerting ? 'Sending Alerts...' : 'Mail Alert Users'}
        </Button>
      </div>
    </div>
  );
};

export default ManagePermissions;
