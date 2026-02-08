import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./shell";

import { OnboardingPage } from "../pages/Onboarding";
import { DashboardPage } from "../pages/Dashboard";
import { HouseholdPage } from "../pages/Household";
import { PetPage } from "../pages/Pet";
import { MedicationPage } from "../pages/Medication";
import { NotificationsPage } from "../pages/Notifications";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <OnboardingPage /> },
      { path: "household", element: <HouseholdPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "pets/:petId", element: <PetPage /> },
      { path: "meds/:medId", element: <MedicationPage /> }
    ],
  },
]);
