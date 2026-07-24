import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { MilestoneToast } from "../MilestoneToast";

export function AppLayout() {
  return (
    <>
      <MilestoneToast />
      <div className="pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}
