import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { UserCheck, UserX, Clock, ShieldAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate(ROUTES.ADMIN_LOGIN);
            return;
        }
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const data = await authService.getPendingAdmins();
            setRequests(data);
        } catch (error) {
            toast.error("Failed to fetch requests");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, status: "approved" | "rejected") => {
        try {
            await authService.updateAdminStatus(id, status);
            toast.success(`Admin ${status} successfully`);
            fetchRequests();
        } catch (error) {
            toast.error(`Failed to ${status} admin`);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-wider mb-4">
                        <ShieldAlert className="w-3 h-3" />
                        Admin Management
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 italic uppercase">Registration Requests</h1>
                    <p className="text-muted-foreground text-sm">Manage pending administrative access requests for the platform</p>
                </header>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                ) : requests.length === 0 ? (
                    <Card className="bg-card/30 border-white/5 backdrop-blur-sm p-12 text-center rounded-[2rem]">
                        <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                            <Clock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Pending Requests</h3>
                        <p className="text-muted-foreground">All registration requests have been processed.</p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((request) => (
                            <Card key={request._id} className="bg-card/40 border-white/5 backdrop-blur-sm hover:border-orange-500/20 transition-all rounded-[1.5rem] overflow-hidden group">
                                <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg">
                                            {request.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">{request.email}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                Pending Approval
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            className="flex-1 sm:flex-none border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 rounded-xl px-6"
                                            onClick={() => handleAction(request._id, "rejected")}
                                        >
                                            <UserX className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                        <Button
                                            className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-900/20 px-6 font-bold"
                                            onClick={() => handleAction(request._id, "approved")}
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
