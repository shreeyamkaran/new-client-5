import { AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { ShieldCheck, CalendarDays, Clock, Trash2, Pencil } from 'lucide-react';
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Fragment, useState } from "react";
import { LoadingSpinner } from "@/utils/spinner";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { removeTask } from "@/redux/taskSlice";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "../ui/toaster";

interface TaskCardProps {
    value: string,
    task: {
        appraisalStatus: string;
        date: string;
        description: string;
        duration: number;
        id: number;
        title: string;
        projectId: number;
        projectName: string;
    }
}

export default function TaskCard({ value, task }: TaskCardProps) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const { toast } = useToast();
    const formatdate = (taskDate: string) => {
        const date = new Date(taskDate);
        const formattedDate = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
        return formattedDate;
    }

    const getColor = () => {
        switch(task.appraisalStatus) {
            case "DID_NOT_APPLY": return "light:text-black dark:text-white";
            default: return "text-yellow-400";
        }
    }

    const handleDelete = async (taskId: number) => {
        console.log(taskId);
        try {
            setLoading(true);
            const response = await fetchWithAuth(`http://localhost:8080/api/v1/tasks/${ taskId }`, {
                method: "DELETE",
                body: JSON.stringify(task)
            });

            if(response.ok) {
                dispatch(removeTask(task));
                toast({
                    title: "Task deleted"
                });
            }
        }
        catch(error) {
            console.log(error);
            toast({
                title: "Cannot delete task",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <Fragment>
            <Toaster />
            <AccordionItem value={ value }>
                <AccordionTrigger>
                    <div className="flex flex-col gap-2 lg:flex-row lg:justify-between px-2 sm:px-20 items-start w-full">
                        <div className="flex gap-4 justify-start">
                            <ShieldCheck className={ `${ getColor() }` } />
                            <Badge>{ task.projectName }</Badge>
                        </div>
                        <div>
                            <p className="text-lg flex justify-center">{ task.title }</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <CalendarDays size={ 16 } />
                                <p>{ formatdate(task.date) }</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={ 16 } />
                                <p>{ task.duration } minutes</p>
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="px-2 sm:px-20 flex flex-col gap-4">
                        <p>{ task.description }</p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={ () => navigate("/tasks/add", { state: { task } }) }><Pencil /> Edit Task</Button>
                            <Button variant="destructive" size="sm" onClick={ event => handleDelete(task.id) }>{ loading ? <LoadingSpinner /> : <div className="flex gap-2"><Trash2 /> <span>Delete Task</span></div> }</Button>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Fragment>
    );
}