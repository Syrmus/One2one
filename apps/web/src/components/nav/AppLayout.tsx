import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { MilestoneToast } from "../MilestoneToast";

export function AppLayout() {
  return (
    <>
      <MilestoneToast />
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}
