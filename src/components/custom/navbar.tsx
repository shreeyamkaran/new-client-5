import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useTheme } from "@/utils/theme-provider";
import { Moon, Sun, Settings, Bell, ClipboardCheck, LogOut, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { jwtDecode } from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Badge } from "../ui/badge";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { removeNotification } from "@/redux/notificationSlice";
import { LoadingSpinner } from "@/utils/spinner";

interface MyToken {
    sub: string,
    role: string,
    iat: number,
    exp: number,
    employeeId: number
}

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State to toggle the mobile menu visibility
    const [loadingNotifications, setLoadingNotifications] = useState<{ [key: number]: boolean }>({});
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const dispatch: AppDispatch = useDispatch();

    const toggleTheme = () => {
        if (theme === "light") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    };

    const token = localStorage.getItem("jwt");
    const user = jwtDecode<MyToken>(token ? token : "");

    const notifications = useSelector((state: RootState) => state.notification.notifications);
    const count = useSelector((state: RootState) => state.notification.count);

    const handleDismissal = async (notificationId: number) => {
        try {
            setLoadingNotifications((prevState) => ({
                ...prevState,
                [notificationId]: true
            }));
            
            const response = await fetchWithAuth(`http://localhost:8080/api/v1/notifications/dismiss/${ notificationId }`, {
                method: "PUT"
            });

            if(response.ok) {
                dispatch(removeNotification(notificationId));
            }
            
        }
        catch(error) {
            console.log(error);
        }
        finally {
            setLoadingNotifications((prevState) => ({
                ...prevState,
                [notificationId]: false
            }));
        }
    }

    return (
        <div className="sticky z-10 top-0 backdrop-blur-lg flex justify-between items-center px-4 sm:px-20 py-2">
            <div className="flex items-center justify-between w-full">
                {/* Logo or Brand Name */}
                <div className="text-xl sm:text-4xl">
                    {user.role === "ROLE_Admin" ? "BS" : (
                        <Link to="/" className="text-4xl">
                            BS
                        </Link>
                    )}
                </div>

                {/* Menu Items (Hidden on Small Screens) */}
                <div className={`lg:flex items-center gap-4 hidden flex-col lg:flex-row`}>
                    {user.role !== "ROLE_Admin" && (
                        <Button variant="outline" size="sm" onClick={() => navigate("/tasks")}>
                            <ClipboardCheck />
                        </Button>
                    )}

                    {user.role === "ROLE_Manager" && (
                        <Button variant="outline" size="sm" onClick={() => navigate("/manage")}>
                            <Settings />
                        </Button>
                    )}

                    {/* Notification Panel */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="relative">
                                <Bell />
                                {
                                    count > 0 && <Badge className="absolute -top-1 -right-1 p-2 flex justify-center items-center w-4 h-4 rounded-full">{ count }</Badge>
                                }
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Notification Panel</SheetTitle>
                                <SheetDescription></SheetDescription>
                                {
                                    notifications && notifications.length > 0 ? (
                                        notifications.map(n => {
                                            return <div key={ n.id } className="relative shadow-md pl-4 p-2 flex flex-col items-start gap-2">
                                                <div className="absolute top-0 left-0 h-full w-1 bg-primary rounded-tl-md rounded-bl-md"></div>
                                                <p className="font-bold text-lg">{ n.title }</p>
                                                <p className="text-xs">{ n.description }</p>
                                                <Button variant="secondary" size="sm" className="text-xs" onClick={ event => handleDismissal(n.id) }>{ loadingNotifications[n.id] ? <LoadingSpinner /> : <div className="flex gap-2"><X /> Dismiss</div> }</Button>
                                            </div>
                                        })
                                    )
                                    :
                                    <div>No new notifications</div>
                                }
                            </SheetHeader>
                        </SheetContent>
                    </Sheet>

                    {/* Theme Toggle Button */}
                    <Button variant="outline" size="sm" onClick={toggleTheme}>
                        {theme === "dark" ? (
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        ) : (
                            <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        )}
                    </Button>

                    {/* Log Out Button */}
                    <Button variant="secondary" size="sm">
                        <LogOut />
                    </Button>
                </div>
            </div>
            {/* Conditional Rendering of Mobile Menu */}
            {
                <Sheet>
                    <SheetTrigger asChild>
                        {/* Hamburger Menu for Small Screens */}
                        <div className="lg:hidden flex items-center">
                            <Button variant="outline" size="sm" onClick={toggleMenu} className="relative">
                                <Menu />
                                {
                                    count > 0 && <Badge className="absolute -top-1 -right-1 p-2 flex justify-center items-center w-4 h-4 rounded-full">{ count }</Badge>
                                }
                            </Button>
                        </div>
                    </SheetTrigger>
                    <SheetContent side="top" className="flex flex-wrap items-start">
                        <SheetTitle className="w-full">Navigation Menu</SheetTitle>
                        <SheetDescription className="w-full"></SheetDescription>
                        {user.role !== "ROLE_Admin" && (
                            <Button variant="outline" size="sm" onClick={() => navigate("/tasks")}>
                                <ClipboardCheck /> Tasks
                            </Button>
                        )}

                        {user.role === "ROLE_Manager" && (
                            <Button variant="outline" size="sm" onClick={() => navigate("/manage")}>
                                <Settings /> Manage Tasks
                            </Button>
                        )}

                        {/* Notification Panel */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="relative">
                                    <Bell /> Notifications
                                    {
                                        count > 0 && <Badge className="absolute -top-1 -right-1 p-2 flex justify-center items-center w-4 h-4 rounded-full">{ count }</Badge>
                                    }
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Notification Panel</SheetTitle>
                                    <SheetDescription></SheetDescription>
                                    {
                                        notifications && notifications.length > 0 ? (
                                            notifications.map(n => {
                                                return <div key={ n.id } className="relative shadow-md pl-4 p-2 flex flex-col items-start gap-2">
                                                    <div className="absolute top-0 left-0 h-full w-1 bg-primary rounded-tl-md rounded-bl-md"></div>
                                                    <p className="font-bold text-lg">{ n.title }</p>
                                                    <p className="text-xs">{ n.description }</p>
                                                    <Button variant="secondary" size="sm" className="text-xs" onClick={ event => handleDismissal(n.id) }>{ loadingNotifications[n.id] ? <LoadingSpinner /> : <div className="flex gap-2"><X /> Dismiss</div> }</Button>
                                                </div>
                                            })
                                        )
                                        :
                                        <div>No new notifications</div>
                                    }
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>

                        {/* Theme Toggle Button */}
                        <Button variant="outline" size="sm" onClick={toggleTheme}>
                            {theme === "dark" ? (
                                <Fragment>
                                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span>Light Mode</span>
                                </Fragment>
                            ) : (
                                <Fragment>
                                    <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <span>Dark Mode</span>
                                </Fragment>
                            )}
                        </Button>

                        {/* Log Out Button */}
                        <Button variant="secondary" size="sm">
                            <LogOut /> Log out
                        </Button>
                    </SheetContent>
                </Sheet>
            }
        </div>
    );
}
