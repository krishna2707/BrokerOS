"use client";
import { useParams } from "next/navigation";
import { SharedProjectInventoryPage } from "@/features/inventory";

export default function ManagerProjectInventoryPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <SharedProjectInventoryPage
      projectId={projectId}
      backLink="/dashboard/sales-manager/inventory"
      title="Project Towers"
      canManageTowers={true}
      canAssignTowers={true}
      canBookUnits={false}
      canSetPossession={true}
    />
  );
}
