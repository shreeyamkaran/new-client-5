import { Bell, CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, Clock, Eye, Menu, Settings, Star, UserRound } from "lucide-react";
import Navbar from "../custom/navbar";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import React, { Fragment, useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useDispatch, useSelector } from "react-redux";
import { createTask, fetchTasks, removeTask } from "@/redux/taskSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../ui/sheet";
import { addNotification, removeNotification } from "@/redux/notificationSlice";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "../ui/toaster";
import { LoadingSpinner } from "@/utils/spinner";

interface Employee {
    id: number;
    name: string;
    username: string;
    password: string;
    designation: {
        id: number;
        name: string;
        skills: {
            id: number;
            name: string;
            category: string;
        }[];
    };
    dob: string;
    gender: string;
    doj: string;
    location: string;
    tasks: {
        id: number;
        title: string;
        description: string;
        date: string;
        duration: number;
        appraisalStatus: string;
        ratings: number;
        numberOfRatings: number;
    }[];
    projects: {
        id: number;
        name: string;
    }[];
    ratings: number;
    numberOfRatings: number;
}

interface Task {
    id: number,
    title: string,
    description: string,
    date: string,
    duration: number,
    appraisalStatus: string,
    projectId: number,
    projectName: string,
    ratings: number,
    numberOfRatings: number
}

// Function to format the date into the desired format
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    return formattedDate;
};

export default function Admin() {
    const [activeId, setActiveId] = useState<number>(-1);
    const [activeView, setActiveView] = useState<string>("DETAILS");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeLoader, setEmployeeLoader] = useState<boolean>(false);
    const tasks = useSelector((state: RootState) => state.task.tasks);
    const dispatch: AppDispatch = useDispatch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTaskId, setActiveTaskId] = useState(-1);

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 5; // Adjust the number of tasks per page here

    // Filter tasks based on appraisal status
    const filteredTasks = tasks?.filter(t => t.appraisalStatus === "APPLIED_FOR_APPRAISAL");

    // Paginate tasks
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

    // Calculate total number of pages
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        // Set up the SSE connection
        const token = localStorage.getItem("jwt");
        const eventSource = new EventSource(`http://localhost:8080/api/v1/notifications/connect/Bearer${token}`);

        // Listen for the 'taskCreated' event
        eventSource.addEventListener("taskCreated", (event) => {
            console.log(event.data);
            dispatch(createTask(JSON.parse(event.data)));
        });

        // Listen for the 'taskEdited' event
        eventSource.addEventListener("taskEdited", (event) => {
            console.log(event.data);
            dispatch(removeTask(JSON.parse(event.data)));
        });

        eventSource.addEventListener("notification", (event) => {
            console.log(event.data);
            dispatch(addNotification(JSON.parse(event.data)));
        });

        eventSource.addEventListener("deleteNotification", (event) => {
            const notification = JSON.parse(event.data);
            dispatch(removeNotification(notification.id));
        });

        // Clean up the event source on component unmount
        return () => {
            eventSource.close();
        };
        
    }, []);


    useEffect(() => {
        const fetchAllEmployees = async () => {
            try {
                setEmployeeLoader(true);
                const response = await fetchWithAuth(`http://localhost:8080/api/v1/employees`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("Fetched Employees:", data);
                setEmployees(data);
            } catch (error) {
                console.error("Error fetching employees:", error);
            } finally {
                setEmployeeLoader(false);
            }
        };
        fetchAllEmployees();
    }, []);

    useEffect(() => {
        dispatch(fetchTasks(activeId));
    }, [activeId]);

    const handleClick = (event: React.MouseEvent) => {
        const targetElement = event.target as HTMLElement;
        const targetElementId = targetElement.id;
        const employeeId = targetElementId.split("-")[0];
        setActiveId(Number(employeeId));
    };

    const handleNotificationButton = async (event: React.MouseEvent, task: Task) => {
        event.stopPropagation();
        try {
            setLoading(true);
            setActiveTaskId(task.id);
            const response = await fetchWithAuth(`http://localhost:8080/api/v1/notifications/remind/${ task.id }`, {
                method: "POST"
            });

            if(response.ok) {
                toast({
                    title: "Notification sent to the manager"
                });
            }
        }
        catch(error) {
            console.log(error);
        }
        finally {
            setLoading(false);
            setActiveTaskId(-1);
        }
    }

    const handleUserDetails = () => {
        setActiveView("DETAILS");
    };

    const handleUserTasks = () => {
        setActiveView("TASKS");
    };

    const selectedEmployee = employees.find((e) => e.id === activeId);

    return (
        <div>
            <Navbar />
            <Toaster />
            {employeeLoader ? (
                <div>Loading...</div>
            ) : (
                <div
                    className={`px-2 py-2 sm:px-20 sm:py-10 ${activeId !== -1 && "grid lg:grid-cols-[1fr,2fr] gap-8"}`}
                >
                    <div>
                        <p className="text-2xl font-bold">Admin Panel</p>

                        <Sheet>
                            <SheetTrigger asChild>
                                {/* Hamburger Menu for Small Screens */}
                                <div className="lg:hidden flex items-center">
                                    <Button variant="outline" size="sm" className="mt-4">
                                        <Menu />
                                    </Button>
                                </div>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <SheetTitle className="w-full"></SheetTitle>
                                <SheetDescription className="w-full"></SheetDescription>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/3">Id</TableHead>
                                            <TableHead className="w-1/3 text-center">Name</TableHead>
                                            <TableHead className="w-1/3 text-right">Manage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="font-bold">
                                        {
                                            employees.map(object => {
                                                return (
                                                    <TableRow key={ object.id }>
                                                        <TableCell>{ object.id }</TableCell>
                                                        <TableCell className="text-center">{ object.name }</TableCell>
                                                        <TableCell className="flex justify-end">
                                                            <Button size="sm" id={ `${ object.id }-tasks` } onClick={ event => handleClick(event) }><Settings /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        }
                                    </TableBody>
                                </Table>
                            </SheetContent>
                        </Sheet>

                        <Table className="hidden lg:block w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/3">Id</TableHead>
                                    <TableHead className="w-1/3 text-center">Name</TableHead>
                                    <TableHead className="w-1/3 text-right">View more</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-bold">
                                {employees.length > 0 &&
                                    employees.map((e) => (
                                        <TableRow key={e.id}>
                                            <TableCell>{e.id}</TableCell>
                                            <TableCell className="text-center">{e.name}</TableCell>
                                            <TableCell className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    id={`${e.id}-activeId`}
                                                    onClick={(event) => handleClick(event)}
                                                >
                                                    <Eye />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>

                    {activeId !== -1 && selectedEmployee && (
                        <div>
                            <div className="flex justify-end gap-4">
                                <Button size="sm" onClick={handleUserDetails}>
                                    <UserRound /> Details
                                </Button>
                                <Button size="sm" onClick={handleUserTasks}>
                                    <ClipboardCheck /> Tasks
                                </Button>
                            </div>

                            {activeView === "DETAILS" && (
                                <div>
                                    <p className="font-bold">Employee Details</p>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-1/2">Attribute</TableHead>
                                                <TableHead className="w-1/2">Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="font-bold">
                                            <TableRow>
                                                <TableCell>Id</TableCell>
                                                <TableCell>{selectedEmployee.id}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Name</TableCell>
                                                <TableCell>{selectedEmployee.name}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Username</TableCell>
                                                <TableCell>{selectedEmployee.username}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Designation</TableCell>
                                                <TableCell>{selectedEmployee.designation.name}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Date of Birth</TableCell>
                                                <TableCell>{formatDate(selectedEmployee.dob)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Gender</TableCell>
                                                <TableCell>{selectedEmployee.gender}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Date of Joining</TableCell>
                                                <TableCell>{formatDate(selectedEmployee.doj)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Office Location</TableCell>
                                                <TableCell>{selectedEmployee.location}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Overall Rating</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <p>{selectedEmployee.ratings.toFixed(1)}</p>
                                                        <Star size={16} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Projects</TableCell>
                                                <TableCell className="flex gap-2 flex-wrap">
                                                    {selectedEmployee.projects.map((project) => (
                                                        <Badge key={project.id}>{project.name}</Badge>
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {activeView === "TASKS" &&  (
                                <div>
                                    <p className="font-bold">Employee Tasks</p>
                                    {
                                        filteredTasks && filteredTasks.length > 0 ?
                                        <Fragment>
                                            <Accordion type="multiple" className="w-full">
                                                <Fragment>
                                                    <Accordion type="multiple" className="w-full">
                                                        {currentTasks.map((task) => (
                                                            <AccordionItem key={task.id} value={`item-${task.id}`}>
                                                                <AccordionTrigger className="relative">
                                                                    <div className="flex justify-between w-full px-2 sm:px-10">
                                                                        <div className="flex flex-col items-start gap-2">
                                                                            <Badge>{task.projectName}</Badge>
                                                                            <div className="flex items-center gap-2">
                                                                                {task.numberOfRatings === 0 && (
                                                                                    <Button
                                                                                        className="absolute"
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={(event) => handleNotificationButton(event, task)}
                                                                                    >
                                                                                        {activeTaskId === task.id && loading ? (
                                                                                            <LoadingSpinner />
                                                                                        ) : (
                                                                                            <Bell />
                                                                                        )}
                                                                                    </Button>
                                                                                )}
                                                                                <p className="text-lg ml-12">{task.title}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end justify-end gap-1 font-bold">
                                                                            <div className="flex items-center gap-2">
                                                                                <CalendarDays size={16} />
                                                                                <p>{formatDate(task.date)}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Clock size={16} />
                                                                                <p>{task.duration} minutes</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent>
                                                                    <div className="flex flex-col gap-4 px-2 sm:px-10">
                                                                        {task.description}
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        ))}
                                                    </Accordion>
                            
                                                    {/* Pagination Controls */}
                                                    <div className="flex justify-center items-center mt-4">
                                                        <Button
                                                            onClick={() => handlePageChange(currentPage - 1)}
                                                            disabled={currentPage === 1}
                                                            size="sm"
                                                        >
                                                            <ChevronLeft />
                                                        </Button>
                                                        <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
                                                        <Button
                                                            onClick={() => handlePageChange(currentPage + 1)}
                                                            disabled={currentPage === totalPages}
                                                            size="sm"
                                                        >
                                                            <ChevronRight />
                                                        </Button>
                                                    </div>
                                                </Fragment>
                                            </Accordion>
                                        </Fragment>
                                        :
                                        <div className="mt-4">No task added by the employee</div>
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
