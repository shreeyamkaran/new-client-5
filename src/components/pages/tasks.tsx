import { Fragment, useEffect, useState } from "react";
import Navbar from "../custom/navbar";
import TaskCard from "../custom/task-card";
import { Accordion } from "../ui/accordion";
import { fetchTasks } from "@/redux/taskSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Toaster } from "../ui/toaster";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";
import { Skeleton } from "../ui/skeleton";

interface MyToken {
    sub: string,
    role: string,
    iat: number,
    exp: number,
    employeeId: number;
}

export default function Tasks() {
    const tasks = useSelector((state: RootState) => state.task.tasks);
    const loading = useSelector((state: RootState) => state.task.loading);
    const dispatch: AppDispatch = useDispatch();
    const token = localStorage.getItem("jwt");
    const user = jwtDecode<MyToken>(token ? token : "");

    const [currentPage, setCurrentPage] = useState(1); // Manage the current page
    const tasksPerPage = 5; // Number of tasks per page

    useEffect(() => {
        dispatch(fetchTasks(user.employeeId));
    }, [dispatch, user.employeeId]);

    // Calculate the tasks for the current page
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = tasks
        .slice()
        .sort((a, b) => b.id - a.id) // Sort by taskId in descending order
        .slice(indexOfFirstTask, indexOfLastTask);

    // Handle navigation between pages
    const handleNextPage = () => {
        if (currentPage < Math.ceil(tasks.length / tasksPerPage)) {
            setCurrentPage((prevPage) => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    return (
        <div>
            <Toaster />
            <Navbar />
            <div className="px-2 py-2 sm:px-20 sm:py-10">
                <p className="text-2xl font-bold mb-5">Tasks</p>
                {
                    loading ? (
                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-12" />
                            <Skeleton className="h-12" />
                            <Skeleton className="h-12" />
                            <Skeleton className="h-12" />
                            <Skeleton className="h-12" />
                        </div>
                    ) : (
                        <Fragment>
                            <Accordion type="multiple" className="w-full min-h-[400px]">
                                {
                                    currentTasks.length === 0 ? (
                                        <div>No task added by the employee</div>
                                    ) : (
                                        currentTasks.map(task => (
                                            <TaskCard key={task.id} value={`value-${(task.id)}`} task={task} />
                                        ))
                                    )
                                }
                            </Accordion>
                            <div className="flex gap-2 justify-center items-center mt-8">
                                <Button
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft />
                                </Button>
                                <p>Page {currentPage} of {Math.ceil(tasks.length / tasksPerPage)}</p>
                                <Button
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === Math.ceil(tasks.length / tasksPerPage)}
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                        </Fragment>
                    )
                }
                {
                    !loading &&
                    <Link to="/tasks/add">
                        <Button className="fixed bottom-10 right-10 rounded-md" size="sm">
                            <Plus />Add Task
                        </Button>
                    </Link>
                }
            </div>
        </div>
    );
}
